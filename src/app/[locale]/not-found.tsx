import { getTranslations } from "next-intl/server";

import { STATUS_LINK_CLASS, StatusPage } from "@/components/shared/status-page";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";

export default async function NotFound() {
  const t = await getTranslations("NotFound");
  const nav = await getTranslations("Nav");
  const footer = await getTranslations("Footer");

  const links = [
    { href: "/courts", label: nav("courts") },
    { href: "/book", label: nav("bookCourt") },
    { href: "/faq", label: footer("faq") },
    { href: "/contact", label: nav("contact") },
  ] as const;

  return (
    <StatusPage
      word="404"
      scene="out"
      eyebrow={t("eyebrow")}
      title={t("title")}
      description={t("description")}
      actions={
        <Button asChild size="lg">
          <Link href="/">{t("cta")}</Link>
        </Button>
      }
    >
      <nav aria-labelledby="not-found-links" className="mt-4 w-full max-w-md">
        <h2 id="not-found-links" className="text-sm font-semibold">
          {t("linksHeading")}
        </h2>
        <ul className="mt-3 grid grid-cols-2 gap-2">
          {links.map((link) => (
            <li key={link.href}>
              <Link href={link.href} className={STATUS_LINK_CLASS}>
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </StatusPage>
  );
}
