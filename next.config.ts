import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  experimental: {
    // Our root layout (app/[locale]/layout.tsx) is a top-level dynamic segment,
    // which Next's own docs flag as a case where normal not-found.tsx composition
    // is unreliable — global-not-found.tsx is the documented fix.
    globalNotFound: true,
  },
};

export default withNextIntl(nextConfig);
