import type { SocialLink } from "@/types/content";

// Volea Padel Club is fictional; [[TBD: ...]] marks links a real club would fill in.
export const siteConfig = {
  name: "Volea Padel",
  legalName: "Volea Sport GmbH",
  address: {
    street: "Musterstraße 12",
    postalCode: "12345",
    city: "Lindenau",
    country: "Germany",
  },
  email: "hello@volea-padel.example",
  phone: "[[TBD: phone number]]",
  playtomicUrl: "[[TBD: Playtomic booking link]]",
  whatsappCommunityUrl: "[[TBD: WhatsApp community link]]",
} as const;

export const socialLinks: SocialLink[] = [
  { platform: "instagram", url: "[[TBD: Instagram link]]" },
];
