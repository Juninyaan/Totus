const Booking = require("../../models/Booking");
const GroupFitnessProgram = require("../../models/GroupFitnessProgram");
const GroupFitnessTeam = require("../../models/GroupFitnessTeam");
const Service = require("../../models/Service");
const Trainer = require("../../models/Trainer");
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
  };
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

  program.bookedSlots += 1;
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
  activateProgram,
  joinWaitlist,
};