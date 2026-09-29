export const SOURCE_METHODS = [
  { value: "json_ld", label: "JSON-LD (sayfa verisi)" },
  { value: "browser", label: "Tarayıcı (Playwright)" },
];

export function methodLabel(value: string): string {
  return SOURCE_METHODS.find((m) => m.value === value)?.label ?? value;
}