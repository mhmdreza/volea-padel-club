"use server";

import { contactSchema } from "./schema";

export type ContactFormState = {
  status: "idle" | "success" | "error";
  fieldErrors: Record<string, string>;
  formError?: string;
};

export async function submitContactForm(
  _prevState: ContactFormState,
  formData: FormData,
): Promise<ContactFormState> {
  const raw = Object.fromEntries(formData.entries());
  const result = contactSchema.safeParse(raw);

  if (!result.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of result.error.issues) {
      const field = issue.path[0];
      if (typeof field === "string" && !fieldErrors[field]) {
        fieldErrors[field] = issue.message;
      }
    }
    // The honeypot and consent fields never surface a user-facing message —
    // a bot won't read it, and a missing consent checkbox is shown via its own UI.
    return { status: "error", fieldErrors };
  }

  // No email/CRM integration is wired up (this is a sample site) — this is where
  // that call goes once one is chosen. Logged for now so the
  // submission path is visibly exercised end to end.
  console.log("Contact form submission:", {
    inquiryType: result.data.inquiryType,
    name: result.data.name,
    email: result.data.email,
  });

  return { status: "success", fieldErrors: {} };
}
