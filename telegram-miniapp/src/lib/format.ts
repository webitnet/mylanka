export function uah(kopecks: number): string {
  return `₴${(kopecks / 100).toLocaleString("uk-UA", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}
