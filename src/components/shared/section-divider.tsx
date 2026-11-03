import { Container } from "@/components/layout/container";

/** A quiet transition between two plain (boundary-less) sections — not the
 * default shadcn Separator's hard full-bleed line, which reads as too heavy
 * used sparingly on a long page. Not for use between sections that already
 * have their own visual container (a border, a tinted background). */
export function SectionDivider() {
  return (
    <Container>
      <div
        role="separator"
        aria-hidden="true"
        className="via-border h-px w-full bg-gradient-to-r from-transparent to-transparent"
      />
    </Container>
  );
}
