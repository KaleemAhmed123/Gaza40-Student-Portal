function formatCsvValue(value: unknown) {
  if (value === null || value === undefined) {
    return "";
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  const text = Array.isArray(value) ? value.join("|") : String(value);
  return `"${text.replace(/"/g, '""')}"`;
}

export function toCsv(rows: Array<Record<string, unknown>>) {
  if (rows.length === 0) {
    return "";
  }

  const headers = Object.keys(rows[0]);
  const lines = [
    headers.map(formatCsvValue).join(","),
    ...rows.map((row) => headers.map((header) => formatCsvValue(row[header])).join(","))
  ];

  return lines.join("\n");
}

export function csvFilename(prefix: string) {
  return `${prefix}-${new Date().toISOString().slice(0, 10)}.csv`;
}
