const buildServiceText = (service) => `${service?.category ?? ""} ${service?.type ?? ""} ${service?.title ?? ""} ${service?.description ?? ""}`;

const isMembershipService = (service) => /membership|monthly|weekly|annual|yearly|quarter|pass|access|entry|open gym|drop in|drop-in|day pass|day entry/i.test(buildServiceText(service));

const isDayEntryService = (service) => /day pass|day entry|single entry|drop in|drop-in|open gym|one day/i.test(buildServiceText(service));

const isEventService = (service) => /event|race|competition|challenge|run|biggest loser|tournament/i.test(buildServiceText(service));

const getDurationDays = (service) => {
  const content = buildServiceText(service);

  if (/annual|yearly|12 month|12-month/i.test(content)) return 365;
  if (/quarter|3 month|3-month/i.test(content)) return 90;
  if (/monthly|1 month|1-month/i.test(content)) return 30;
  if (/weekly|7 day|7-day/i.test(content)) return 7;
  if (isDayEntryService(service)) return 1;
  if (isEventService(service)) return 1;
  return 30;
};

const deriveSubscriptionKind = (service) => {
  if (isEventService(service)) return "event_access";
  if (isDayEntryService(service)) return "day_entry";
  return "membership";
};

const deriveAccessWindow = (service, bookingDate) => {
  const startDate = new Date(bookingDate);
  startDate.setHours(0, 0, 0, 0);

  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + getDurationDays(service) - 1);
  endDate.setHours(23, 59, 59, 999);

  return { startDate, endDate };
};

module.exports = {
  deriveAccessWindow,
  deriveSubscriptionKind,
  isDayEntryService,
  isEventService,
  isMembershipService,
};