const pinned = (i) => i.lat !== undefined && i.lng !== undefined;

// Straight-line distance, good enough to compare stops within a city.
function distance(a, b) {
  const rad = Math.PI / 180;
  const x = (b.lng - a.lng) * rad * Math.cos(((a.lat + b.lat) / 2) * rad);
  return Math.hypot(x, (b.lat - a.lat) * rad) * 6371;
}

const length = (items) => items.slice(1).reduce((sum, item, i) => sum + distance(items[i], item), 0);

// Visits the nearest remaining stop next, keeping the first one. Times stay with their
// position in the day. Returns the same array when there is nothing worth changing.
export function shortestOrder(items) {
  if (items.length < 3 || !items.every(pinned)) return items;
  const rest = items.slice(1);
  const route = [items[0]];
  while (rest.length) {
    const here = route.at(-1);
    let best = 0;
    rest.forEach((item, i) => {
      if (distance(here, item) < distance(here, rest[best])) best = i;
    });
    route.push(...rest.splice(best, 1));
  }
  // Ignore savings under half a kilometre.
  if (length(items) - length(route) < 0.5) return items;
  return route.map((item, i) => ({ ...item, time: items[i].time }));
}
