import { z } from "zod";

export const inquiryTypes = ["general", "booking", "corporate", "sponsorship", "training"] as const;
export type InquiryType = (typeof inquiryTypes)[number];

export const contactSchema = z.object({
  inquiryType: z.enum(inquiryTypes),
  name: z.string().trim().min(1),
  email: z.string().trim().email(),
  phone: z.string().trim().optional(),
  message: z.string().trim().min(1),
  company: z.string().trim().optional(),
  peopleCount: z.string().trim().optional(),
  preferredDate: z.string().trim().optional(),
  level: z.string().trim().optional(),
  consent: z.literal("on"),
  // Honeypot: real visitors never see or fill this field. Non-empty means a bot.
  website: z.string().max(0),
});

export type ContactFormValues = z.infer<typeof contactSchema>;
