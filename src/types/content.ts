/** A piece of structured content that must be provided in both supported languages. */
export type LocalizedText = {
  en: string;
  de: string;
};

export type Court = {
  id: string;
  kind: "doubles" | "singles";
  name: LocalizedText;
  description: LocalizedText;
  imageUrl?: string;
};

export type PricingTier = {
  id: string;
  courtKind: Court["kind"];
  label: LocalizedText;
  /** e.g. "Mon–Fri 06:00–09:00" */
  timeWindow: LocalizedText;
  priceCents: number;
  pricePerPersonCents: number;
  aiToolSurchargeCents?: number;
};

export type PricingSpecial = {
  id: string;
  title: LocalizedText;
  description: LocalizedText;
};

export type PricingAddOn = {
  id: string;
  label: LocalizedText;
  priceCents: number;
};

export type Coach = {
  id: string;
  name: string;
  bio: LocalizedText;
  photoUrl?: string;
};

export type TrainingProgram = {
  id: string;
  title: LocalizedText;
  description: LocalizedText;
  level: "beginner" | "intermediate" | "advanced" | "all-levels";
  format: "group" | "private" | "taster";
};

export type ClubEvent = {
  id: string;
  title: LocalizedText;
  description: LocalizedText;
  format: LocalizedText;
  startsAt?: string;
};

export type SponsorTier = {
  id: string;
  name: LocalizedText;
  description: LocalizedText;
};

export type Sponsor = {
  id: string;
  name: string;
  logoUrl: string;
  websiteUrl?: string;
};

export type FaqItem = {
  id: string;
  question: LocalizedText;
  answer: LocalizedText;
};

export type NavItem = {
  labelKey: string;
  href: string;
};

export type SocialLink = {
  platform: "instagram" | "facebook" | "linkedin" | "tiktok";
  url: string;
};

export type ContactInquiryType = "general" | "booking" | "corporate" | "sponsorship" | "training";
