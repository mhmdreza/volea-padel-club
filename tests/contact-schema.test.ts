import { describe, expect, it } from "vitest";

import { contactSchema } from "@/features/contact/schema";

const validBase = {
  inquiryType: "general",
  name: "Test User",
  email: "test@example.com",
  message: "Hello there.",
  consent: "on",
  website: "", // honeypot, must stay empty
};

describe("contactSchema", () => {
  it("accepts valid input", () => {
    const result = contactSchema.safeParse(validBase);
    expect(result.success).toBe(true);
  });

  it("rejects a missing name", () => {
    const result = contactSchema.safeParse({ ...validBase, name: "" });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid email address", () => {
    const result = contactSchema.safeParse({ ...validBase, email: "not-an-email" });
    expect(result.success).toBe(false);
  });

  it("rejects a missing message", () => {
    const result = contactSchema.safeParse({ ...validBase, message: "" });
    expect(result.success).toBe(false);
  });

  it("rejects when consent isn't checked", () => {
    const result = contactSchema.safeParse({ ...validBase, consent: "" });
    expect(result.success).toBe(false);
  });

  it("rejects when the honeypot field is filled in (bot behavior)", () => {
    const result = contactSchema.safeParse({ ...validBase, website: "https://spam.example" });
    expect(result.success).toBe(false);
  });

  it("accepts any of the five inquiry types", () => {
    for (const inquiryType of ["general", "booking", "corporate", "sponsorship", "training"]) {
      const result = contactSchema.safeParse({ ...validBase, inquiryType });
      expect(result.success, `inquiryType "${inquiryType}" should be valid`).toBe(true);
    }
  });
});
