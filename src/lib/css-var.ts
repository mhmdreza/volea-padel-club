/** Resolved value of a CSS custom property — lets canvas/WebGL drawing read the
 * same semantic tokens as the DOM, so the theme toggle reaches them too. */
export function readCssVar(name: string, el: Element = document.documentElement) {
  return getComputedStyle(el).getPropertyValue(name).trim();
}
