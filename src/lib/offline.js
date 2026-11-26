// A read-only copy of viewed trips, so they open without internet. Cleared on logout.
const PREFIX = "lm:";

const read = (key) => {
  try {
    return JSON.parse(localStorage.getItem(PREFIX + key));
  } catch {
    return null;
  }
};
const write = (key, value) => {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    /* storage full or blocked: offline copy is optional */
  }
};

export const offline = {
  user: () => read("user"),
  saveUser: (user) => write("user", { username: user.username }),
  trips: () => read("trips") || [],
  saveTrips: (trips) => write("trips", trips),
  trip: (id) => read(`trip:${id}`),
  // The invite link grants access, so it is not kept on the device.
  saveTrip: (trip) => write(`trip:${trip.id}`, { ...trip, inviteToken: undefined }),
  removeTrip: (id) => {
    try {
      localStorage.removeItem(`${PREFIX}trip:${id}`);
    } catch {
      /* storage blocked */
    }
  },
  clear: () => {
    try {
      Object.keys(localStorage)
        .filter((k) => k.startsWith(PREFIX))
        .forEach((k) => localStorage.removeItem(k));
    } catch {
      /* storage blocked */
    }
  },
};
