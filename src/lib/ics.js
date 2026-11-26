// Calendar file (RFC 5545). Times are "floating": they mean local time at the destination.
const escape = (s = "") => s.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/([,;])/g, "\\$1");
const pad = (n) => String(n).padStart(2, "0");

const dayStamp = (start, offset) => {
  const d = new Date(`${start}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + offset);
  return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}`;
};

export function toIcs({ id, startDate, destination, days }, now = new Date()) {
  const stamp = now.toISOString().replace(/[-:]|\.\d{3}/g, "");
  const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//LocoMan//Trip//EN"];
  days.forEach((day, d) => {
    day.items.forEach((item, i) => {
      const time = /^([01]?\d|2[0-3]):([0-5]\d)$/.exec(item.time || "");
      const date = dayStamp(startDate, d);
      lines.push(
        "BEGIN:VEVENT",
        `UID:${id}-${d}-${i}@locoman`,
        `DTSTAMP:${stamp}`,
        time ? `DTSTART:${date}T${pad(time[1])}${time[2]}00` : `DTSTART;VALUE=DATE:${date}`,
        ...(time ? ["DURATION:PT1H"] : []),
        `SUMMARY:${escape(item.name)}`,
        `LOCATION:${escape(`${item.name}, ${destination}`)}`,
        ...(item.notes ? [`DESCRIPTION:${escape(item.notes)}`] : []),
        "END:VEVENT",
      );
    });
  });
  lines.push("END:VCALENDAR");
  return `${lines.join("\r\n")}\r\n`;
}
