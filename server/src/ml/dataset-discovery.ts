import { readdir } from "node:fs/promises";
import path from "node:path";

export const DATASETS_DIR = path.resolve(process.cwd(), "src", "Datasets");

export async function findDatasetFiles(matchers: RegExp[]): Promise<string[]> {
  const entries = await readdir(DATASETS_DIR, { withFileTypes: true });

  return entries
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name)
    .filter((name) => matchers.some((matcher) => matcher.test(name)))
    .sort((a, b) => a.localeCompare(b));
}

export function datasetPath(filename: string): string {
  return path.join(DATASETS_DIR, filename);
}
