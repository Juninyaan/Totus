const Booking = require("../../models/Booking");
const BodyMeasurement = require("../../models/BodyMeasurement");
const GroupFitnessProgram = require("../../models/GroupFitnessProgram");
const GroupFitnessTeam = require("../../models/GroupFitnessTeam");
const Service = require("../../models/Service");
const Shop = require("../../models/Shop");
const Trainer = require("../../models/Trainer");
const User = require("../../models/User");
const { asyncHandler } = require("../../utils/asyncHandler");
const { httpError } = require("../../utils/httpError");

const GROUP_FITNESS_DEFAULTS = [
  {
    team: {
      name: "Ignite Crew",
      location: "Male Fitness District",
      focus: "Fat-loss programs and high-energy circuits",
      description: "Structured group programs with measurable progress, weekly check-ins, and fixed evening sessions.",
    },
    programs: [
      {
        title: "Biggest Loser Bootcamp",
        subtitle: "8-week transformation cohort",
        description: "A focused fat-loss program with weigh-ins, coach support, and three coached evening sessions every week.",
        price: 650,
        venue: "Ignite Arena",
        coach: "Coach Shamin",
        days: ["Monday", "Wednesday", "Friday"],
        startTime: "20:00",
        endTime: "21:00",
        startDate: "2026-05-04",
        endDate: "2026-06-26",
        totalSlots: 18,
        bookedSlots: 12,
        serviceMatchTerms: ["biggest loser", "bootcamp", "ignite"],
      },
    ],
  },
  {
    team: {
      name: "Flow Studio Team",
      location: "Hulhumale Wellness Hub",
      focus: "Mobility, yoga, and low-impact conditioning",
      description: "Progressive classes for consistency, recovery, and flexible strength over an eight-week block.",
    },
    programs: [
      {
        title: "Group Yoga Reset",
        subtitle: "8-week guided flexibility series",
        description: "A recovery-first evening program for mobility, breath work, and guided flexibility across a fixed two-month cycle.",
        price: 480,
        venue: "Flow Loft",
        coach: "Coach Afa",
        days: ["Tuesday", "Thursday", "Saturday"],
        startTime: "20:00",
        endTime: "21:00",
        startDate: "2026-05-05",
        endDate: "2026-06-27",
        totalSlots: 16,
        bookedSlots: 16,
        serviceMatchTerms: ["group yoga", "yoga", "flow"],
      },
    ],
  },
  {
    team: {
      name: "Pulse Lab Collective",
      location: "Henveiru Training Hall",
      focus: "Conditioning, boxing circuits, and transformation cohorts",
      description: "Intensive small-group training built around fixed cohorts, coach-led accountability, and capped class sizes.",
    },
    programs: [
      {
        title: "After Hours BoxFit",
        subtitle: "8-week cardio and boxing block",
        description: "Three coached nights per week combining pad work, circuits, and conditioning in one fixed-cohort program.",
        price: 720,
        venue: "Pulse Fight Floor",
        coach: "Coach Rishan",
        days: ["Monday", "Wednesday", "Friday"],
        startTime: "20:00",
        endTime: "21:00",
        startDate: "2026-07-06",
        endDate: "2026-08-28",
        totalSlots: 20,
        bookedSlots: 7,
        serviceMatchTerms: ["boxfit", "boxing", "pulse"],
      },
    ],
  },
];

const teamPopulate = {
  path: "teamId",
  select: "name location focus description isActive",
};

const ensureGroupFitnessSeed = async () => {
  const existingTeamCount = await GroupFitnessTeam.countDocuments();
  const existingProgramCount = await GroupFitnessProgram.countDocuments();

  if (existingTeamCount > 0 || existingProgramCount > 0) {
    return;
  }

  for (const entry of GROUP_FITNESS_DEFAULTS) {
    const team = await GroupFitnessTeam.create(entry.team);
    await GroupFitnessProgram.insertMany(
      entry.programs.map((program) => ({
        ...program,
        teamId: team._id,
      }))
    );
  }
};

const resolveLinkedService = async (program) => {
  if (program.linkedServiceId) {
    const linkedService = await Service.findById(program.linkedServiceId);
    if (linkedService) {
      return linkedService;
    }
  }

  if (!program.serviceMatchTerms?.length) {
    return null;
  }

  const services = await Service.find({ isActive: true }).sort({ createdAt: -1 });
  const linkedService = services.find((service) => {
    const content = `${service.title} ${service.category} ${service.type} ${service.description ?? ""} ${service.location?.name ?? ""}`.toLowerCase();
    return program.serviceMatchTerms.some((term) => content.includes(term.toLowerCase()));
  });

  if (linkedService) {
    program.linkedServiceId = linkedService._id;
    await program.save();
    return linkedService;
  }

  const fallbackTrainer = await Trainer.findOne().sort({ createdAt: 1 });
  if (!fallbackTrainer) {
    return null;
  }

  const generatedService = await Service.create({
    category: "group fitness",
    type: "program",
    title: program.title,
    description: program.description,
    price: program.price,
    currency: program.currency,
    trainerId: fallbackTrainer._id,
    assignedTrainerIds: [fallbackTrainer._id],
    location: {
      name: program.venue,
      city: typeof program.teamId === "object" && program.teamId?.location ? program.teamId.location : undefined,
    },
    schedule: program.days.map((day) => ({
      day,
      startTime: program.startTime,
      endTime: program.endTime,
    })),
    capacity: program.totalSlots,
    groupProgramMeta: {
      nextClassDate: program.nextClass?.classDate,
      nextClassStartTime: program.nextClass?.startTime,
      nextClassEndTime: program.nextClass?.endTime,
      bringNote: program.nextClass?.bringNote,
      eventDayTitle: program.eventDay?.title,
      eventDayDate: program.eventDay?.eventDate,
      eventDayNote: program.eventDay?.note,
    },
    isActive: true,
  });

  program.linkedServiceId = generatedService._id;
  await program.save();
  return generatedService;
};

const serializeProgram = async (program) => {
  const linkedService = await resolveLinkedService(program);
  const availableSlots = Math.max(program.totalSlots - program.bookedSlots, 0);

  return {
    _id: program._id,
    teamId: program.teamId?._id ?? program.teamId,
    title: program.title,
    subtitle: program.subtitle,
    description: program.description,
    price: program.price,
    currency: program.currency,
    venue: program.venue,
    coach: program.coach,
    days: program.days,
    startTime: program.startTime,
    endTime: program.endTime,
    startDate: program.startDate,
    endDate: program.endDate,
    totalSlots: program.totalSlots,
    bookedSlots: program.bookedSlots,
    availableSlots,
    isFull: availableSlots === 0,
    isComplete: program.endDate < new Date(),
    waitlistCount: program.waitlist.length,
    linkedServiceId: linkedService?._id ?? null,
    assignedTrainerIds: program.assignedTrainerIds ?? [],
    memberIds: program.memberIds ?? [],
    nextClass: program.nextClass ?? {},
    eventDay: program.eventDay ?? {},
    expectedHeadcount: program.intentions?.filter((item) => item.intendsToAttend).length ?? 0,
  };
};

const getRequestTrainer = async (req) => {
  if (!req.auth?.userId) {
    return null;
  }

  return Trainer.findOne({ userId: req.auth.userId }).select("_id userId");
};

const canManageProgram = async (req, program) => {
  if (req.auth?.roles?.includes("admin")) {
    return true;
  }

  const requestTrainer = await getRequestTrainer(req);
  if (requestTrainer && program.assignedTrainerIds?.some((id) => id.toString() === requestTrainer._id.toString())) {
    return true;
  }

  if (!req.auth?.roles?.includes("shop") && !req.auth?.roles?.includes("gym_owner")) {
    return false;
  }

  if (!program.linkedServiceId) {
    return false;
  }

  const linkedService = await Service.findById(program.linkedServiceId).select("shopId");
  if (!linkedService?.shopId) {
    return false;
  }

  const ownedShop = await Shop.findOne({ _id: linkedService.shopId, ownerId: req.auth.userId }).select("_id");
  return Boolean(ownedShop);
};

const listDiscovery = asyncHandler(async (_req, res) => {
  await ensureGroupFitnessSeed();

  const [teams, programs] = await Promise.all([
    GroupFitnessTeam.find({ isActive: true }).sort({ createdAt: 1 }),
    GroupFitnessProgram.find({ isActive: true }).populate(teamPopulate).sort({ startDate: 1, createdAt: 1 }),
  ]);

  const serializedPrograms = await Promise.all(programs.map((program) => serializeProgram(program)));

  res.json({ teams, programs: serializedPrograms });
});

const createProgram = asyncHandler(async (req, res) => {
  const {
    teamId,
    title,
    subtitle,
    description,
    price,
    currency,
    venue,
    coach,
    days,
    startTime,
    endTime,
    startDate,
    endDate,
    totalSlots,
    serviceMatchTerms,
    linkedServiceId,
    assignedTrainerIds,
  } = req.body;

  const team = await GroupFitnessTeam.findById(teamId);
  if (!team) {
    throw httpError(404, "Group fitness team not found");
  }

  const uniqueTrainerIds = [...new Set((assignedTrainerIds ?? []).map((id) => id?.toString()).filter(Boolean))];
  if (uniqueTrainerIds.length > 0) {
    const trainers = await Trainer.find({ _id: { $in: uniqueTrainerIds } }).select("_id");
    if (trainers.length !== uniqueTrainerIds.length) {
      throw httpError(404, "One or more assigned trainers were not found");
    }
  }

  const program = await GroupFitnessProgram.create({
    teamId,
    title,
    subtitle,
    description,
    price,
    currency,
    venue,
    coach,
    days,
    startTime,
    endTime,
    startDate,
    endDate,
    totalSlots,
    bookedSlots: 0,
    serviceMatchTerms,
    linkedServiceId,
    assignedTrainerIds: uniqueTrainerIds,
  });

  const populatedProgram = await GroupFitnessProgram.findById(program._id).populate(teamPopulate);
  res.status(201).json(await serializeProgram(populatedProgram));
});

const updateProgramPlan = asyncHandler(async (req, res) => {
  const program = await GroupFitnessProgram.findById(req.params.id).populate(teamPopulate);
  if (!program) {
    throw httpError(404, "Group fitness program not found");
  }

  const allowed = await canManageProgram(req, program);
  if (!allowed) {
    throw httpError(403, "You are not allowed to manage this program");
  }

  const {
    assignedTrainerIds,
    nextClass,
    eventDay,
    coach,
    days,
    startTime,
    endTime,
    venue,
    totalSlots,
  } = req.body;

  if (assignedTrainerIds !== undefined) {
    if (!Array.isArray(assignedTrainerIds)) {
      throw httpError(400, "assignedTrainerIds must be an array");
    }

    const uniqueTrainerIds = [...new Set(assignedTrainerIds.map((id) => id?.toString()).filter(Boolean))];
    const trainers = await Trainer.find({ _id: { $in: uniqueTrainerIds } }).select("_id");
    if (trainers.length !== uniqueTrainerIds.length) {
      throw httpError(404, "One or more assigned trainers were not found");
    }
    program.assignedTrainerIds = uniqueTrainerIds;
  }

  if (nextClass !== undefined) {
    program.nextClass = {
      classDate: nextClass?.classDate,
      startTime: nextClass?.startTime,
      endTime: nextClass?.endTime,
      bringNote: nextClass?.bringNote,
    };
  }

  if (eventDay !== undefined) {
    program.eventDay = {
      title: eventDay?.title,
      eventDate: eventDay?.eventDate,
      note: eventDay?.note,
    };
  }

  if (coach !== undefined) program.coach = coach;
  if (days !== undefined) program.days = days;
  if (startTime !== undefined) program.startTime = startTime;
  if (endTime !== undefined) program.endTime = endTime;
  if (venue !== undefined) program.venue = venue;
  if (totalSlots !== undefined) {
    if (totalSlots < program.bookedSlots) {
      throw httpError(400, "totalSlots cannot be less than current booked slots");
    }
    program.totalSlots = totalSlots;
  }

  await program.save();

  if (program.linkedServiceId) {
    const linkedService = await Service.findById(program.linkedServiceId);
    if (linkedService) {
      linkedService.assignedTrainerIds = program.assignedTrainerIds;
      linkedService.groupProgramMeta = {
        nextClassDate: program.nextClass?.classDate,
        nextClassStartTime: program.nextClass?.startTime,
        nextClassEndTime: program.nextClass?.endTime,
        bringNote: program.nextClass?.bringNote,
        eventDayTitle: program.eventDay?.title,
        eventDayDate: program.eventDay?.eventDate,
        eventDayNote: program.eventDay?.note,
      };
      await linkedService.save();
    }
  }

  const updatedProgram = await GroupFitnessProgram.findById(program._id).populate(teamPopulate);
  res.json(await serializeProgram(updatedProgram));
});

const addMember = asyncHandler(async (req, res) => {
  const { userId } = req.body;

  const [program, user] = await Promise.all([
    GroupFitnessProgram.findById(req.params.id).populate(teamPopulate),
    User.findById(userId),
  ]);

  if (!program) {
    throw httpError(404, "Group fitness program not found");
  }
  if (!user) {
    throw httpError(404, "User not found");
  }

  const allowed = await canManageProgram(req, program);
  if (!allowed) {
    throw httpError(403, "You are not allowed to manage this program");
  }

  const alreadyAdded = program.memberIds.some((id) => id.toString() === userId);
  if (alreadyAdded) {
    throw httpError(409, "User is already in this program");
  }

  if (program.memberIds.length >= program.totalSlots) {
    throw httpError(409, "Program has reached capacity");
  }

  program.memberIds.push(userId);
  program.bookedSlots = Math.min(program.totalSlots, program.memberIds.length);
  await program.save();

  res.status(201).json({
    message: "Member added",
    memberCount: program.memberIds.length,
    program: await serializeProgram(await GroupFitnessProgram.findById(program._id).populate(teamPopulate)),
  });
});

const removeMember = asyncHandler(async (req, res) => {
  const program = await GroupFitnessProgram.findById(req.params.id).populate(teamPopulate);
  if (!program) {
    throw httpError(404, "Group fitness program not found");
  }

  const allowed = await canManageProgram(req, program);
  if (!allowed) {
    throw httpError(403, "You are not allowed to manage this program");
  }

  program.memberIds = program.memberIds.filter((id) => id.toString() !== req.params.userId);
  program.bookedSlots = Math.min(program.totalSlots, program.memberIds.length);
  await program.save();

  res.json({
    message: "Member removed",
    memberCount: program.memberIds.length,
    program: await serializeProgram(await GroupFitnessProgram.findById(program._id).populate(teamPopulate)),
  });
});

const markAttendance = asyncHandler(async (req, res) => {
  const { classDate, entries } = req.body;

  if (!Array.isArray(entries) || entries.length === 0) {
    throw httpError(400, "entries is required and must contain at least one attendance row");
  }

  const program = await GroupFitnessProgram.findById(req.params.id);
  if (!program) {
    throw httpError(404, "Group fitness program not found");
  }

  const allowed = await canManageProgram(req, program);
  if (!allowed) {
    throw httpError(403, "You are not allowed to manage this program");
  }

  const classDateValue = new Date(classDate);
  if (Number.isNaN(classDateValue.getTime())) {
    throw httpError(400, "classDate must be a valid date");
  }

  for (const entry of entries) {
    const existingIndex = program.attendance.findIndex(
      (item) => item.userId.toString() === entry.userId && new Date(item.classDate).toISOString().slice(0, 10) === classDateValue.toISOString().slice(0, 10)
    );

    const nextRecord = {
      userId: entry.userId,
      classDate: classDateValue,
      status: entry.status,
      note: entry.note,
      markedBy: req.auth.userId,
      markedAt: new Date(),
    };

    if (existingIndex >= 0) {
      program.attendance[existingIndex] = nextRecord;
    } else {
      program.attendance.push(nextRecord);
    }
  }

  await program.save();

  res.json({ message: "Attendance saved", attendanceCount: program.attendance.length });
});

const logMeasurements = asyncHandler(async (req, res) => {
  const { measurements } = req.body;

  if (!Array.isArray(measurements) || measurements.length === 0) {
    throw httpError(400, "measurements must be a non-empty array");
  }

  const program = await GroupFitnessProgram.findById(req.params.id);
  if (!program) {
    throw httpError(404, "Group fitness program not found");
  }

  const allowed = await canManageProgram(req, program);
  if (!allowed) {
    throw httpError(403, "You are not allowed to manage this program");
  }

  const writes = measurements.map((entry) => {
    const measuredAt = `${entry.measuredAt}`.trim();
    if (!entry.userId || measuredAt.length === 0) {
      throw httpError(400, "Each measurement requires userId and measuredAt");
    }

    return BodyMeasurement.findOneAndUpdate(
      { userId: entry.userId, measuredAt },
      {
        userId: entry.userId,
        measuredAt,
        weightKg: entry.weightKg,
        bodyFatPercent: entry.bodyFatPercent,
        chestCm: entry.chestCm,
        waistCm: entry.waistCm,
        hipsCm: entry.hipsCm,
        thighCm: entry.thighCm,
        armCm: entry.armCm,
        note: entry.note,
        updatedBy: req.auth.userId,
      },
      { upsert: true, new: true, runValidators: true }
    );
  });

  const saved = await Promise.all(writes);
  res.status(201).json({ message: "Measurements saved", count: saved.length });
});

const setIntention = asyncHandler(async (req, res) => {
  const { classDate, intendsToAttend } = req.body;

  const program = await GroupFitnessProgram.findById(req.params.id);
  if (!program) {
    throw httpError(404, "Group fitness program not found");
  }

  const classDateValue = new Date(classDate);
  if (Number.isNaN(classDateValue.getTime())) {
    throw httpError(400, "classDate must be a valid date");
  }

  const isMember = program.memberIds.some((id) => id.toString() === req.auth.userId);
  if (!isMember) {
    throw httpError(403, "Only enrolled members can set next-class intention");
  }

  const existingIndex = program.intentions.findIndex(
    (item) => item.userId.toString() === req.auth.userId && new Date(item.classDate).toISOString().slice(0, 10) === classDateValue.toISOString().slice(0, 10)
  );

  const payload = {
    userId: req.auth.userId,
    classDate: classDateValue,
    intendsToAttend: Boolean(intendsToAttend),
    updatedAt: new Date(),
  };

  if (existingIndex >= 0) {
    program.intentions[existingIndex] = payload;
  } else {
    program.intentions.push(payload);
  }

  await program.save();

  const expectedHeadcount = program.intentions.filter((item) => item.intendsToAttend && new Date(item.classDate).toISOString().slice(0, 10) === classDateValue.toISOString().slice(0, 10)).length;

  res.json({
    message: "Next-class intention saved",
    expectedHeadcount,
  });
});

const getProgramDashboard = asyncHandler(async (req, res) => {
  const program = await GroupFitnessProgram.findById(req.params.id)
    .populate(teamPopulate)
    .populate({ path: "memberIds", select: "name email" });

  if (!program) {
    throw httpError(404, "Group fitness program not found");
  }

  const allowed = await canManageProgram(req, program);
  if (!allowed) {
    throw httpError(403, "You are not allowed to manage this program");
  }

  const members = program.memberIds || [];
  const attendanceByUser = new Map();

  for (const item of program.attendance) {
    const key = item.userId.toString();
    if (!attendanceByUser.has(key)) {
      attendanceByUser.set(key, { attended: 0, total: 0 });
    }
    const current = attendanceByUser.get(key);
    current.total += 1;
    if (item.status === "attended") {
      current.attended += 1;
    }
  }

  const attendanceLeaderboard = members.map((member) => {
    const stat = attendanceByUser.get(member._id.toString()) || { attended: 0, total: 0 };
    const rate = stat.total > 0 ? Math.round((stat.attended / stat.total) * 100) : 0;
    return {
      userId: member._id,
      name: member.name,
      attended: stat.attended,
      total: stat.total,
      rate,
    };
  }).sort((a, b) => b.rate - a.rate || b.attended - a.attended);

  const measurements = await BodyMeasurement.find({
    userId: { $in: members.map((member) => member._id) },
  }).sort({ userId: 1, measuredAt: 1 });

  const measurementByUser = new Map();
  for (const entry of measurements) {
    const key = entry.userId.toString();
    if (!measurementByUser.has(key)) {
      measurementByUser.set(key, []);
    }
    measurementByUser.get(key).push(entry);
  }

  const weightLossLeaderboard = members.map((member) => {
    const items = measurementByUser.get(member._id.toString()) || [];
    const withWeight = items.filter((entry) => typeof entry.weightKg === "number");
    let weightLossKg = 0;

    if (withWeight.length >= 2) {
      const first = withWeight[0].weightKg;
      const latest = withWeight[withWeight.length - 1].weightKg;
      weightLossKg = Number((first - latest).toFixed(1));
    }

    return {
      userId: member._id,
      name: member.name,
      weightLossKg,
    };
  }).sort((a, b) => b.weightLossKg - a.weightLossKg);

  const nextClassDate = program.nextClass?.classDate ? new Date(program.nextClass.classDate).toISOString().slice(0, 10) : null;
  const expectedHeadcount = nextClassDate
    ? program.intentions.filter((item) => item.intendsToAttend && new Date(item.classDate).toISOString().slice(0, 10) === nextClassDate).length
    : 0;

  res.json({
    program: await serializeProgram(program),
    totalMembers: members.length,
    expectedHeadcount,
    attendanceLeaderboard,
    weightLossLeaderboard,
    topAttendance: attendanceLeaderboard[0] ?? null,
    biggestLoser: weightLossLeaderboard[0] ?? null,
  });
});

const getProgramManagerDetails = asyncHandler(async (req, res) => {
  const program = await GroupFitnessProgram.findById(req.params.id)
    .populate(teamPopulate)
    .populate({ path: "memberIds", select: "name email roles" })
    .populate({ path: "assignedTrainerIds", populate: { path: "userId", select: "name email" } });

  if (!program) {
    throw httpError(404, "Group fitness program not found");
  }

  const allowed = await canManageProgram(req, program);
  if (!allowed) {
    throw httpError(403, "You are not allowed to manage this program");
  }

  const attendanceRows = program.attendance
    .slice()
    .sort((left, right) => new Date(right.classDate).getTime() - new Date(left.classDate).getTime())
    .slice(0, 80)
    .map((row) => {
      const user = (program.memberIds || []).find((member) => member?._id?.toString() === row.userId.toString());
      return {
        userId: row.userId,
        name: user?.name ?? "Member",
        classDate: row.classDate,
        status: row.status,
        note: row.note,
        markedAt: row.markedAt,
      };
    });

  res.json({
    program: await serializeProgram(program),
    members: program.memberIds || [],
    assignedTrainers: program.assignedTrainerIds || [],
    attendanceRows,
    intentions: program.intentions || [],
  });
});

const activateProgram = asyncHandler(async (req, res) => {
  await ensureGroupFitnessSeed();

  const program = await GroupFitnessProgram.findById(req.params.id).populate(teamPopulate);
  if (!program) {
    throw httpError(404, "Group fitness program not found");
  }

  if (program.endDate < new Date()) {
    throw httpError(400, "This group fitness program has already ended");
  }

  if (program.bookedSlots >= program.totalSlots) {
    throw httpError(409, "This program is full. Join the waitlist for the next cohort");
  }

  const existingBooking = await Booking.findOne({
    userId: req.auth.userId,
    groupProgramId: program._id,
    status: { $in: ["requested", "accepted", "completed"] },
  });

  if (existingBooking) {
    throw httpError(409, "You already activated this group fitness program");
  }

  const linkedService = await resolveLinkedService(program);
  if (!linkedService) {
    throw httpError(409, "This program is listed, but its booking service is not linked yet");
  }

  const trainer = await Trainer.findById(linkedService.trainerId);
  if (!trainer) {
    throw httpError(404, "Trainer not found for this program");
  }

  const booking = await Booking.create({
    userId: req.auth.userId,
    serviceId: linkedService._id,
    trainerId: trainer._id,
    groupProgramId: program._id,
    bookingDate: program.startDate,
    timeSlot: `${program.startTime}-${program.endTime}`,
    status: "requested",
    paymentStatus: "not_due",
    notes: `Requested from Group Fitness for ${program.title} with ${program.teamId?.name ?? "team"}.`,
  });

  if (!program.memberIds.some((id) => id.toString() === req.auth.userId)) {
    program.memberIds.push(req.auth.userId);
  }
  program.bookedSlots = Math.min(program.totalSlots, program.memberIds.length);
  await program.save();

  res.status(201).json({
    booking,
    program: await serializeProgram(await GroupFitnessProgram.findById(program._id).populate(teamPopulate)),
  });
});

const joinWaitlist = asyncHandler(async (req, res) => {
  await ensureGroupFitnessSeed();

  const program = await GroupFitnessProgram.findById(req.params.id);
  if (!program) {
    throw httpError(404, "Group fitness program not found");
  }

  if (program.endDate < new Date()) {
    throw httpError(400, "This group fitness program has already ended");
  }

  if (program.bookedSlots < program.totalSlots) {
    throw httpError(400, "This program still has open slots, so waitlist is not needed");
  }

  const alreadyWaitlisted = program.waitlist.some((entry) => entry.userId.toString() === req.auth.userId);
  if (alreadyWaitlisted) {
    throw httpError(409, "You are already on the waitlist for this program");
  }

  const existingBooking = await Booking.findOne({
    userId: req.auth.userId,
    groupProgramId: program._id,
    status: { $in: ["requested", "accepted", "completed"] },
  });
  if (existingBooking) {
    throw httpError(409, "You already have this program in your bookings");
  }

  program.waitlist.push({ userId: req.auth.userId });
  await program.save();

  res.status(201).json({
    message: "Added to waitlist",
    waitlistCount: program.waitlist.length,
  });
});

module.exports = {
  listDiscovery,
  createProgram,
  updateProgramPlan,
  addMember,
  removeMember,
  markAttendance,
  logMeasurements,
  setIntention,
  getProgramDashboard,
  getProgramManagerDetails,
  activateProgram,
  joinWaitlist,
};
