import { useTranslations } from "next-intl";
import type { ComponentType } from "react";

import { Container } from "@/components/layout/container";
import { SectionDots } from "@/components/shared/section-dots";
import {
  FacebookIcon,
  InstagramIcon,
  LinkedinIcon,
  TiktokIcon,
} from "@/components/layout/social-icons";
import { Link } from "@/i18n/navigation";
import type { AppLinkHref } from "@/i18n/navigation";
import { siteConfig, socialLinks } from "@/content/site";
import { isPlaceholder } from "@/lib/placeholder";
import type { SocialLink } from "@/types/content";

const SOCIAL_ICONS: Partial<Record<SocialLink["platform"], ComponentType<{ className?: string }>>> =
  {
    instagram: InstagramIcon,
    facebook: FacebookIcon,
    linkedin: LinkedinIcon,
    tiktok: TiktokIcon,
  };

export function SiteFooter() {
  const t = useTranslations("Footer");
  const nav = useTranslations("Nav");

  const clubLinks: { href: AppLinkHref; label: string }[] = [
    { href: "/about", label: t("about") },
    { href: "/lounge", label: nav("lounge") },
    { href: "/sponsoring", label: nav("sponsoring") },
    { href: "/faq", label: t("faq") },
  ];

  const legalLinks: { href: AppLinkHref; label: string }[] = [
    { href: "/impressum", label: t("impressum") },
    { href: "/datenschutz", label: t("datenschutz") },
    { href: "/agb", label: t("agb") },
    { href: "/hausordnung", label: t("hausordnung") },
    { href: "/widerruf", label: t("widerruf") },
  ];

  return (
    <footer className="border-border bg-background text-muted-foreground relative isolate overflow-hidden border-t">
      <SectionDots side="right" />
      <Container className="grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <span className="font-display text-foreground text-lg font-bold [font-stretch:112%]">
            Volea Padel
          </span>
          <p className="mt-2 text-sm">
            {siteConfig.address.street}
            <br />
            {siteConfig.address.postalCode} {siteConfig.address.city}
          </p>
        </div>

        <div>
          <h3 className="text-foreground text-xs font-semibold tracking-[0.2em] uppercase">
            {t("clubHeading")}
          </h3>
          <ul className="mt-3 space-y-2 text-sm">
            {clubLinks.map((item) => (
              <li key={item.href.toString()}>
                <Link href={item.href} className="hover:text-foreground">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-foreground text-xs font-semibold tracking-[0.2em] uppercase">
            {t("legalHeading")}
          </h3>
          <ul className="mt-3 space-y-2 text-sm">
            {legalLinks.map((item) => (
              <li key={item.href.toString()}>
                <Link href={item.href} className="hover:text-foreground">
                  {item.label}
                </Link>
              </li>
            ))}
            {/* No cookie-consent tool is wired up yet — the site loads zero non-essential
                cookies, so there's nothing to configure. Listed here as a
                pending item, matching the Playtomic-link pending-state convention,
                rather than a dead link or an invented working toggle. */}
            <li>
              {/* text-muted-foreground alone already fails contrast when further
                  dimmed with opacity (confirmed by this project's own axe suite,
                  same lesson as the earlier footer-disclaimer fix) — a dashed
                  underline conveys "inactive" without reducing contrast. */}
              <span
                className="cursor-not-allowed underline decoration-dashed underline-offset-2"
                title={t("cookieSettingsPending")}
              >
                {t("cookieSettings")}
              </span>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="text-foreground text-xs font-semibold tracking-[0.2em] uppercase">
            {t("contactHeading")}
          </h3>
          <ul className="mt-3 space-y-2 text-sm">
            <li>
              <a href={`mailto:${siteConfig.email}`} className="hover:text-foreground">
                {siteConfig.email}
              </a>
            </li>
            {!isPlaceholder(siteConfig.phone) && (
              <li>
                <a href={`tel:${siteConfig.phone}`} className="hover:text-foreground">
                  {siteConfig.phone}
                </a>
              </li>
            )}
            <li>
              <Link href="/contact" className="hover:text-foreground">
                {nav("contact")}
              </Link>
            </li>
          </ul>
          <div className="mt-3 -ml-1 flex gap-1">
            {socialLinks
              .filter((social) => !isPlaceholder(social.url))
              .map((social) => {
                const Icon = SOCIAL_ICONS[social.platform];
                if (!Icon) return null;
                return (
                  <a
                    key={social.platform}
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={social.platform}
                    className="hover:text-foreground flex size-8 items-center justify-center"
                  >
                    <Icon className="size-5" />
                  </a>
                );
              })}
          </div>
        </div>
      </Container>

      {/* Decorative outlined wordmark, cut off at the bottom edge like the homepage band. */}
      <Container aria-hidden="true" className="pointer-events-none select-none">
        <p className="font-display -mb-[0.18em] text-[15vw] leading-none font-bold whitespace-nowrap text-transparent [font-stretch:125%] [-webkit-text-stroke:1px_var(--border)] lg:text-[11rem]">
          VOLEA
        </p>
      </Container>

      <div className="border-border bg-background relative border-t">
        <Container className="space-y-1 py-6 text-sm">
          <p>
            &copy; {new Date().getFullYear()} {siteConfig.legalName}. {t("rights")}
          </p>
          <p className="text-xs">{t("sampleNotice")}</p>
        </Container>
      </div>
    </footer>
  );
}
