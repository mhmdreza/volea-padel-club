import { createNavigation } from "next-intl/navigation";
import type { ComponentProps } from "react";

import { routing } from "./routing";

export const { Link, redirect, usePathname, useRouter, getPathname } = createNavigation(routing);

// Query strings aren't locale-aware, so next-intl doesn't wrap this one; re-exported
// here so components keep a single navigation import.
export { useSearchParams } from "next/navigation";

/** Shared href type for nav-item props passed between server and client layout components. */
export type AppLinkHref = ComponentProps<typeof Link>["href"];
