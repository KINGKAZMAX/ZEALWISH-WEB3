export interface CliResult {
  exitCode: number;
  json: unknown;
  error: string | null;
}

export function formatCliResult(result: CliResult) {
  return JSON.stringify(result.json, null, 2);
}
