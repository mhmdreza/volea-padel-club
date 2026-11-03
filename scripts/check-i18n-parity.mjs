#!/usr/bin/env node
// Fails if messages/en.json and messages/de.json don't have identical key trees.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

import { diffKeys, flattenKeys } from "./i18n-parity.mjs";

const root = path.resolve(fileURLToPath(import.meta.url), "../..");

function loadKeys(file) {
  const json = JSON.parse(readFileSync(path.join(root, "messages", file), "utf8"));
  return flattenKeys(json);
}

const en = loadKeys("en.json");
const de = loadKeys("de.json");
const { missingInB: missingInDe, missingInA: missingInEn } = diffKeys(en, de);

if (missingInDe.length > 0 || missingInEn.length > 0) {
  console.error("i18n key parity check failed: messages/en.json and messages/de.json differ.\n");
  if (missingInDe.length > 0) {
    console.error("Missing in messages/de.json:");
    for (const key of missingInDe) console.error(`  - ${key}`);
  }
  if (missingInEn.length > 0) {
    console.error("Missing in messages/en.json:");
    for (const key of missingInEn) console.error(`  - ${key}`);
  }
  process.exit(1);
}

console.log(`i18n key parity OK (${en.size} keys in each locale).`);
