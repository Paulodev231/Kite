// Spreadsheet export. Produces a real .csv file the user's phone can open
// in Excel / Google Sheets / Numbers.

/** Escapes one cell: quotes wrap it, inner quotes are doubled. */
function cell(value: unknown): string {
  if (value === null || value === undefined) return "";
  const text = typeof value === "boolean" ? (value ? "Yes" : "No") : String(value);
  return `"${text.replace(/"/g, '""')}"`;
}

export function toCsv(headers: string[], rows: unknown[][]): string {
  const lines = [headers.map(cell).join(","), ...rows.map((r) => r.map(cell).join(","))];
  // BOM so Excel opens UTF-8 (accents, ₦, emoji) correctly.
  return `﻿${lines.join("\r\n")}`;
}

/** Triggers a file download in the browser. */
export function downloadCsv(filename: string, csv: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** File-safe stamp for export names, e.g. community-milestones-2026-08-20.csv */
export function todayStamp(): string {
  return new Date().toISOString().slice(0, 10);
}
