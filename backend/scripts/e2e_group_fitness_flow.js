/* eslint-disable no-console */
const BASE_URL = process.env.E2E_BASE_URL || "http://localhost:5001/api";

const now = Date.now();
const suffix = `e2e${now}`;

const users = {
  gymOwner: {
    name: `Gym Owner ${suffix}`,
    email: `gym-owner-${suffix}@example.com`,
    password: "StrongPass!123",
    role: "gym_owner",
    shopName: `E2E Gym ${suffix}`,
  },
  trainerA: {
    name: `Trainer A ${suffix}`,
    email: `trainer-a-${suffix}@example.com`,
    password: "StrongPass!123",
    role: "trainer",
  },
  trainerB: {
    name: `Trainer B ${suffix}`,
    email: `trainer-b-${suffix}@example.com`,
    password: "StrongPass!123",
    role: "trainer",
  },
  member: {
    name: `Member ${suffix}`,
    email: `member-${suffix}@example.com`,
    password: "StrongPass!123",
    role: "member",
  },
};

const request = async (path, options = {}) => {
  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (!response.ok) {
    const message = data?.message || response.statusText;
    throw new Error(`${options.method || "GET"} ${path} failed (${response.status}): ${message}`);
  }

  return data;
};

const authHeaders = (token) => ({ Authorization: `Bearer ${token}` });

const register = async (payload) => request("/auth/register", { method: "POST", body: JSON.stringify(payload) });

const main = async () => {
  console.log("Running E2E group fitness flow against", BASE_URL);

  const ownerAuth = await register(users.gymOwner);
  const trainerAAuth = await register(users.trainerA);
  const trainerBAuth = await register(users.trainerB);
  const memberAuth = await register(users.member);

  const trainers = await request("/trainers");
  const trainerA = trainers.find((item) => item.userId?.email === users.trainerA.email);
  const trainerB = trainers.find((item) => item.userId?.email === users.trainerB.email);
  if (!trainerA || !trainerB) {
    throw new Error("Could not resolve trainer profiles from trainer list");
  }

  const shops = await request("/shops");
  const ownerShop = shops.find((item) => item.ownerId?.email === users.gymOwner.email);
  if (!ownerShop) {
    throw new Error("Could not resolve auto-created gym owner shop");
  }

  const servicePayload = {
    category: "group fitness",
    type: "program",
    title: `E2E Group Program Service ${suffix}`,
    description: "Group program service for E2E validation",
    audience: "all",
    price: 199,
    currency: "MVR",
    shopId: ownerShop._id,
    assignedTrainerIds: [trainerA._id, trainerB._id],
    capacity: 25,
    groupProgramMeta: {
      nextClassDate: new Date(Date.now() + 86400000).toISOString(),
      nextClassStartTime: "19:00",
      nextClassEndTime: "20:00",
      bringNote: "Bring mat and water",
      eventDayTitle: "Transformation Challenge Day",
      eventDayDate: new Date(Date.now() + 7 * 86400000).toISOString(),
      eventDayNote: "Progress check and mini challenge",
    },
  };

  const createdService = await request("/services", {
    method: "POST",
    headers: authHeaders(ownerAuth.token),
    body: JSON.stringify(servicePayload),
  });

  const discovery = await request("/group-fitness");
  const teamId = discovery.teams?.[0]?._id;
  if (!teamId) {
    throw new Error("No group fitness team available");
  }

  const programPayload = {
    teamId,
    title: `E2E Program ${suffix}`,
    subtitle: "E2E cohort",
    description: "Program created by E2E flow",
    price: 350,
    currency: "MVR",
    venue: ownerShop.shopName,
    coach: trainerA.userId?.name || "Coach A",
    days: ["Monday", "Wednesday", "Friday"],
    startTime: "19:00",
    endTime: "20:00",
    startDate: new Date(Date.now() + 2 * 86400000).toISOString().slice(0, 10),
    endDate: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
    totalSlots: 30,
    linkedServiceId: createdService._id,
    assignedTrainerIds: [trainerA._id, trainerB._id],
    serviceMatchTerms: ["e2e", "group"],
  };

  const createdProgram = await request("/group-fitness/programs", {
    method: "POST",
    headers: authHeaders(ownerAuth.token),
    body: JSON.stringify(programPayload),
  });

  const planUpdate = await request(`/group-fitness/programs/${createdProgram._id}/plan`, {
    method: "PATCH",
    headers: authHeaders(ownerAuth.token),
    body: JSON.stringify({
      nextClass: {
        classDate: new Date(Date.now() + 86400000).toISOString(),
        startTime: "19:30",
        endTime: "20:30",
        bringNote: "Bring towel and resistance band",
      },
      eventDay: {
        title: "E2E Event Day",
        eventDate: new Date(Date.now() + 10 * 86400000).toISOString(),
        note: "Attendance challenge and body metrics",
      },
      assignedTrainerIds: [trainerA._id, trainerB._id],
    }),
  });

  await request(`/group-fitness/programs/${createdProgram._id}/members`, {
    method: "POST",
    headers: authHeaders(ownerAuth.token),
    body: JSON.stringify({ userId: memberAuth.user._id }),
  });

  const classDate = new Date(Date.now() + 86400000).toISOString().slice(0, 10);

  const intentionResult = await request(`/group-fitness/programs/${createdProgram._id}/intention`, {
    method: "POST",
    headers: authHeaders(memberAuth.token),
    body: JSON.stringify({ classDate, intendsToAttend: true }),
  });

  await request(`/group-fitness/programs/${createdProgram._id}/attendance`, {
    method: "POST",
    headers: authHeaders(ownerAuth.token),
    body: JSON.stringify({
      classDate,
      entries: [
        {
          userId: memberAuth.user._id,
          status: "attended",
          note: "Completed session",
        },
      ],
    }),
  });

  await request(`/group-fitness/programs/${createdProgram._id}/measurements`, {
    method: "POST",
    headers: authHeaders(ownerAuth.token),
    body: JSON.stringify({
      measurements: [
        {
          userId: memberAuth.user._id,
          measuredAt: new Date(Date.now() - 10 * 86400000).toISOString().slice(0, 10),
          weightKg: 80,
          waistCm: 95,
          note: "Baseline",
        },
        {
          userId: memberAuth.user._id,
          measuredAt: new Date().toISOString().slice(0, 10),
          weightKg: 77.8,
          waistCm: 91.5,
          note: "After week one",
        },
      ],
    }),
  });

  const dashboard = await request(`/group-fitness/programs/${createdProgram._id}/dashboard`, {
    headers: authHeaders(ownerAuth.token),
  });

  const summary = {
    createdUsers: {
      gymOwner: ownerAuth.user.email,
      trainerA: trainerAAuth.user.email,
      trainerB: trainerBAuth.user.email,
      member: memberAuth.user.email,
    },
    shopId: ownerShop._id,
    serviceId: createdService._id,
    programId: createdProgram._id,
    updatedNextClass: planUpdate.nextClass,
    intentionExpectedHeadcount: intentionResult.expectedHeadcount,
    dashboard: {
      totalMembers: dashboard.totalMembers,
      expectedHeadcount: dashboard.expectedHeadcount,
      topAttendance: dashboard.topAttendance,
      biggestLoser: dashboard.biggestLoser,
    },
  };

  console.log(JSON.stringify(summary, null, 2));
};

main().catch((error) => {
  console.error("E2E flow failed:", error.message);
  process.exit(1);
});
