/** A Google Maps search link — a plain link, no embed (Maps isn't in the privacy policy yet). */
export function mapsSearchUrl(address: { street: string; postalCode: string; city: string }) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${address.street}, ${address.postalCode} ${address.city}`,
  )}`;
}
