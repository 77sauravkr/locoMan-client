const q = encodeURIComponent;

const addDays = (date, days) => {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
};

// Plain search links. No affiliate ids and nothing about the user is sent.
export function bookingLinks({ destination, startDate, days }, from = "") {
  const nights = Math.max(1, days - 1);
  const stay = startDate ? `&checkin=${startDate}&checkout=${addDays(startDate, nights)}` : "";
  const route = from.trim() ? `from ${from.trim()} to ${destination}` : `to ${destination}`;
  return [
    { label: "Flights (Google Flights)", url: `https://www.google.com/travel/flights?q=${q(`Flights ${route}${startDate ? ` on ${startDate}` : ""}`)}` },
    { label: "Trains (search)", url: `https://www.google.com/search?q=${q(`trains ${route}`)}` },
    { label: "Buses (search)", url: `https://www.google.com/search?q=${q(`bus tickets ${route}`)}` },
    { label: "Hotels (Booking.com)", url: `https://www.booking.com/searchresults.html?ss=${q(destination)}${stay}` },
    { label: "Hotels on Google Maps", url: `https://www.google.com/maps/search/?api=1&query=${q(`hotels in ${destination}`)}` },
  ];
}
