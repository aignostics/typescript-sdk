import Table from 'cli-table3';

/** Output format for CLI command results: human-friendly text (default) or raw JSON. */
export type OutputFormat = 'text' | 'json';

/** Print data as pretty-printed JSON. */
export function printJson(data: unknown): void {
  console.log(JSON.stringify(data, null, 2));
}

/** Print rows as an aligned text table with the given column headers. */
export function printTable(head: string[], rows: (string | number)[][]): void {
  const table = new Table({ head });
  table.push(...rows);
  console.log(table.toString());
}

/** Print a single resource as a list of `Key: value` lines. */
export function printKeyValue(pairs: [string, string | number][]): void {
  for (const [key, value] of pairs) {
    console.log(`${key}: ${value}`);
  }
}

/**
 * Print `data` in the requested format: raw JSON when `format` is `'json'`,
 * otherwise delegate to `printText` for human-friendly output.
 */
export function printResult<T>(format: OutputFormat, data: T, printText: (data: T) => void): void {
  if (format === 'json') {
    printJson(data);
  } else {
    printText(data);
  }
}

/**
 * Compose fetching and printing: awaits `data` (typically a call to a
 * format-agnostic CLI function) and prints the resolved value in the
 * requested format. If `data` resolves to `undefined` (the CLI function
 * already reported an error and is about to exit), nothing is printed.
 *
 * @example
 * ```typescript
 * return format(argv.format as OutputFormat, listApplications(env, authService), applications =>
 *   printTable(['ID', 'Name'], applications.map(app => [app.application_id, app.name]))
 * );
 * ```
 */
export async function format<T>(
  outputFormat: OutputFormat,
  data: Promise<T | undefined> | T | undefined,
  printText: (data: T) => void
): Promise<void> {
  const resolved = await data;
  if (resolved === undefined) {
    return;
  }
  printResult(outputFormat, resolved, printText);
}
