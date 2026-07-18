// Nearest-neighbour route planning. Deliberately naive: the test suite is the
// contract, and a smarter solver has to keep these cases passing.

export function planRoute(stops, startAt) {
  const remaining = [...stops];
  const order = [];
  let current = startAt;

  while (remaining.length > 0) {
    let best = 0;
    for (let i = 1; i < remaining.length; i++) {
      if (distance(current, remaining[i]) < distance(current, remaining[best])) {
        best = i;
      }
    }
    current = remaining[best];
    order.push(remaining.splice(best, 1)[0]);
  }

  return { order, totalKm: legLengths(startAt, order) };
}

function distance(a, b) {
  return Math.hypot(a.lat - b.lat, a.lon - b.lon) * 111;
}

function legLengths(startAt, order) {
  let total = 0;
  let prev = startAt;
  for (const stop of order) {
    total += distance(prev, stop);
    prev = stop;
  }
  return Math.round(total * 10) / 10;
}
