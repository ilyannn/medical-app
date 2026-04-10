export function formatMoney(amountCents: number, currency = "EUR"): string {
  return new Intl.NumberFormat("en-DE", {
    style: "currency",
    currency,
  }).format(amountCents / 100);
}
