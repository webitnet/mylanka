export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function formatUah(kopecks: number, locale: string = "uk") {
  const uah = kopecks / 100;
  return new Intl.NumberFormat(locale === "uk" ? "uk-UA" : "en-US", {
    style: "currency",
    currency: "UAH",
    maximumFractionDigits: 0,
  }).format(uah);
}
