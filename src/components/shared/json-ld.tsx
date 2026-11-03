/** Renders a JSON-LD structured-data script. `data` is always our own static
 * content, never user input, so this is safe despite the raw HTML injection. */
export function JsonLd({ data }: { data: object }) {
  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />
  );
}
