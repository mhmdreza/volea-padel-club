// Shared by the CLI check (used in the pre-commit hook) and the Vitest test,
// so there's one implementation of the key-flattening logic, not two.
export function flattenKeys(node, prefix = "") {
  const keys = new Set();
  for (const [key, value] of Object.entries(node)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === "object" && !Array.isArray(value)) {
      for (const nested of flattenKeys(value, fullKey)) keys.add(nested);
    } else {
      keys.add(fullKey);
    }
  }
  return keys;
}

export function diffKeys(a, b) {
  return {
    missingInB: [...a].filter((key) => !b.has(key)),
    missingInA: [...b].filter((key) => !a.has(key)),
  };
}
