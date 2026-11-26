// Amounts are whole paise throughout.
export function balances(people, expenses) {
  const net = new Map(people.map((p) => [p, 0]));
  const add = (name, amount) => net.set(name, (net.get(name) || 0) + amount);
  for (const { amount, paidBy, splitAmong } of expenses) {
    add(paidBy, amount);
    const share = Math.floor(amount / splitAmong.length);
    let extra = amount - share * splitAmong.length; // leftover paise, one each
    for (const person of splitAmong) add(person, -(share + (extra-- > 0 ? 1 : 0)));
  }
  return [...net].map(([name, amount]) => ({ name, amount }));
}

// Few payments that settle everyone: the biggest debtor pays the biggest creditor first.
export function settlements(list) {
  const owed = list.filter((b) => b.amount > 0).map((b) => ({ ...b }));
  const owes = list.filter((b) => b.amount < 0).map((b) => ({ name: b.name, amount: -b.amount }));
  const result = [];
  owed.sort((a, b) => b.amount - a.amount);
  owes.sort((a, b) => b.amount - a.amount);
  for (let i = 0, j = 0; i < owes.length && j < owed.length; ) {
    const amount = Math.min(owes[i].amount, owed[j].amount);
    result.push({ from: owes[i].name, to: owed[j].name, amount });
    owes[i].amount -= amount;
    owed[j].amount -= amount;
    if (!owes[i].amount) i++;
    if (!owed[j].amount) j++;
  }
  return result;
}

export const rupees = (paise) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2, minimumFractionDigits: 0 }).format(paise / 100);
