import { describe, expect, it } from "vitest";
import { subtotalCents, totalCents, type Invoice } from "../src/invoice.js";

const inv: Invoice = {
  id: "inv_7Kq2",
  lines: [
    { description: "Consulting", cents: 12_500, qty: 3 },
    { description: "Travel", cents: 4_215, qty: 1 },
  ],
  taxRateBp: 1900,
};

describe("invoice totals", () => {
  it("sums line items in cents", () => {
    expect(subtotalCents(inv)).toBe(41_715);
  });

  it("rounds tax once, at the total", () => {
    expect(totalCents(inv)).toBe(49_641);
  });
});
