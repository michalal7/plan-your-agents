export type Invoice = {
  id: string;
  lines: { description: string; cents: number; qty: number }[];
  taxRateBp: number;
};

export function subtotalCents(inv: Invoice): number {
  return inv.lines.reduce((sum, l) => sum + l.cents * l.qty, 0);
}

export function totalCents(inv: Invoice): number {
  const sub = subtotalCents(inv);
  return sub + Math.round((sub * inv.taxRateBp) / 10_000);
}
