import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import { diffKeys, flattenKeys } from "../scripts/i18n-parity.mjs";

const dirname = path.dirname(fileURLToPath(import.meta.url));

function loadKeys(file: string) {
  const json = JSON.parse(readFileSync(path.resolve(dirname, "../messages", file), "utf8"));
  return flattenKeys(json);
}

describe("i18n key parity", () => {
  it("has identical key sets in en.json and de.json", () => {
    const en = loadKeys("en.json");
    const de = loadKeys("de.json");
    const { missingInB: missingInDe, missingInA: missingInEn } = diffKeys(en, de);

    expect(missingInDe, `Missing in de.json: ${missingInDe.join(", ")}`).toEqual([]);
    expect(missingInEn, `Missing in en.json: ${missingInEn.join(", ")}`).toEqual([]);
  });
});
