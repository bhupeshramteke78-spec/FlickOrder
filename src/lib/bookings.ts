export type BookingConfig = {
  enabled: boolean;
  openTime: string;
  closeTime: string;
  slotMinutes: number;
  durationMinutes: number;
  advanceDays: number;
  minNoticeMinutes: number;
  maxPartySize: number;
};

export const defaultBookingConfig: BookingConfig = {
  enabled: true,
  openTime: "11:00",
  closeTime: "23:00",
  slotMinutes: 30,
  durationMinutes: 90,
  advanceDays: 30,
  minNoticeMinutes: 60,
  maxPartySize: 20,
};

export function getBookingSlots(config: BookingConfig, bookingDate: string, now = new Date()) {
  const slots: string[] = [];
  const selectedDateStart = Date.parse(`${bookingDate}T00:00:00+05:30`);

  for (let minute = 0; minute < 24 * 60; minute += config.slotMinutes) {
    if (!isTimeWithinOpeningHours(minute, config.openTime, config.closeTime)) {
      continue;
    }

    const value = minutesToTime(minute);
    const slotTimestamp = Date.parse(`${bookingDate}T${value}:00+05:30`);

    if (slotTimestamp < now.getTime() + config.minNoticeMinutes * 60_000) {
      continue;
    }

    if (slotTimestamp < selectedDateStart) {
      continue;
    }

    slots.push(value);
  }

  return slots;
}

export function isTimeWithinOpeningHours(timeMinutes: number, open: string, close: string) {
  const openMinutes = timeToMinutes(open);
  const closeMinutes = timeToMinutes(close);

  if (openMinutes === closeMinutes) {
    return true;
  }

  if (openMinutes < closeMinutes) {
    return timeMinutes >= openMinutes && timeMinutes < closeMinutes;
  }

  return timeMinutes >= openMinutes || timeMinutes < closeMinutes;
}

export function isAlignedBookingSlot(time: string, config: BookingConfig) {
  const timeMinutes = timeToMinutes(time);
  const openMinutes = timeToMinutes(config.openTime);
  const offset = (timeMinutes - openMinutes + 24 * 60) % (24 * 60);

  return offset % config.slotMinutes === 0;
}

export function timeToMinutes(value: string) {
  const [hours = "0", minutes = "0"] = value.split(":");

  return Number(hours) * 60 + Number(minutes);
}

export function minutesToTime(value: number) {
  const normalized = ((value % (24 * 60)) + 24 * 60) % (24 * 60);
  const hours = Math.floor(normalized / 60);
  const minutes = normalized % 60;

  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

export function formatBookingTime(value: string) {
  const [hours = "0", minutes = "0"] = value.split(":");
  const date = new Date(2000, 0, 1, Number(hours), Number(minutes));

  return new Intl.DateTimeFormat("en-IN", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date);
}

export function formatBookingDate(value: string) {
  const date = new Date(`${value}T12:00:00+05:30`);

  return new Intl.DateTimeFormat("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  }).format(date);
}

export function getIndiaDateString(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "Asia/Kolkata",
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));

  return `${values.year}-${values.month}-${values.day}`;
}

export function addDaysToDateString(value: string, days: number) {
  const date = new Date(`${value}T12:00:00+05:30`);
  date.setUTCDate(date.getUTCDate() + days);

  return getIndiaDateString(date);
}
