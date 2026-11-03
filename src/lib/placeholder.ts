/** Content a real club would still have to supply is marked `[[TBD: ...]]` (see src/content/site.ts). */
export const isPlaceholder = (value: string) => value.startsWith("[[");
