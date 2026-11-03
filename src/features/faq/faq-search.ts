/** Lower-cased, diacritics stripped — so "gebuhr" finds "Gebühr" and "cafe" finds "Café". */
export function fold(text: string) {
  return text
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}

export type Segment = { text: string; match: boolean };

/**
 * Splits `text` into matching / non-matching runs for `query`, compared folded but
 * returned in the original spelling. Folds one character at a time so every folded
 * index maps back to the original string, even where NFD changes the length.
 */
export function highlight(text: string, query: string): Segment[] {
  const needle = fold(query.trim());
  if (!needle) return [{ text, match: false }];

  let folded = "";
  const origin: number[] = [];
  let i = 0;
  for (const char of text) {
    const f = fold(char);
    for (let k = 0; k < f.length; k++) origin.push(i);
    folded += f;
    i += char.length;
  }
  origin.push(text.length);

  const segments: Segment[] = [];
  let last = 0;
  let from = folded.indexOf(needle);
  while (from !== -1) {
    const start = origin[from]!;
    const end = origin[from + needle.length]!;
    if (start > last) segments.push({ text: text.slice(last, start), match: false });
    segments.push({ text: text.slice(start, end), match: true });
    last = end;
    from = folded.indexOf(needle, from + needle.length);
  }
  if (last < text.length) segments.push({ text: text.slice(last), match: false });
  return segments;
}

export function matches(query: string, ...texts: string[]) {
  const needle = fold(query.trim());
  return !needle || texts.some((text) => fold(text).includes(needle));
}
