const dayName = (date) => new Date(`${date}T00:00`).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });

// Warnings worth acting on, from the daily forecast. With trip dates, only those days.
export function weatherAlerts(days, startDate, length) {
  let relevant = days;
  if (startDate) {
    const end = new Date(`${startDate}T00:00:00Z`);
    end.setUTCDate(end.getUTCDate() + Math.max(1, length) - 1);
    const last = end.toISOString().slice(0, 10);
    relevant = days.filter((d) => d.date >= startDate && d.date <= last);
  }
  return relevant.flatMap((d) => {
    const found = [];
    if (d.code >= 95) found.push("thunderstorm expected");
    else if (d.rain >= 70) found.push(`rain likely (${d.rain}%)`);
    if (d.max >= 40) found.push(`very hot (${Math.round(d.max)}°C), avoid midday sun`);
    if (d.min <= 5) found.push(`very cold (${Math.round(d.min)}°C), pack warm layers`);
    return found.map((text) => `${dayName(d.date)}: ${text}`);
  });
}
