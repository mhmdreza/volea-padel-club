"use client";

import { useTranslations } from "next-intl";
import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Link } from "@/i18n/navigation";

import { submitContactForm, type ContactFormState } from "./actions";
import { inquiryTypes, type InquiryType } from "./schema";

const initialState: ContactFormState = { status: "idle", fieldErrors: {} };

function SubmitButton({ label, pendingLabel }: { label: string; pendingLabel: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" disabled={pending}>
      {pending ? pendingLabel : label}
    </Button>
  );
}

export function ContactForm({
  defaultInquiryType,
  defaultMessage,
}: {
  defaultInquiryType: InquiryType;
  defaultMessage?: string;
}) {
  const t = useTranslations("Contact");
  const [inquiryType, setInquiryType] = useState<InquiryType>(defaultInquiryType);
  const [state, formAction] = useActionState(submitContactForm, initialState);

  if (state.status === "success") {
    return (
      <div role="status" className="border-border bg-muted/40 rounded-lg border px-6 py-8">
        <h2 className="text-lg font-semibold">{t("successTitle")}</h2>
        <p className="text-muted-foreground mt-2 text-sm">{t("successText")}</p>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-5" noValidate>
      {/* Honeypot: hidden from real visitors, invisible to screen readers, but present
          in the DOM/tab order for naive bots that fill every field. */}
      <div className="absolute -left-[9999px]" aria-hidden="true">
        <label htmlFor="website">Website</label>
        <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="inquiryType">{t("typeLabel")}</Label>
        <input type="hidden" name="inquiryType" value={inquiryType} />
        <Select value={inquiryType} onValueChange={(v) => setInquiryType(v as InquiryType)}>
          <SelectTrigger id="inquiryType" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {inquiryTypes.map((type) => (
              <SelectItem key={type} value={type}>
                {t(`type.${type}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="name">{t("nameLabel")}</Label>
          <Input
            id="name"
            name="name"
            required
            aria-invalid={Boolean(state.fieldErrors.name)}
            aria-describedby={state.fieldErrors.name ? "name-error" : undefined}
          />
          {state.fieldErrors.name && (
            <p id="name-error" className="text-destructive text-sm">
              {t("requiredError")}
            </p>
          )}
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="email">{t("emailLabel")}</Label>
          <Input
            id="email"
            name="email"
            type="email"
            required
            aria-invalid={Boolean(state.fieldErrors.email)}
            aria-describedby={state.fieldErrors.email ? "email-error" : undefined}
          />
          {state.fieldErrors.email && (
            <p id="email-error" className="text-destructive text-sm">
              {t("emailError")}
            </p>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="phone">{t("phoneLabel")}</Label>
        <Input id="phone" name="phone" type="tel" />
      </div>

      {(inquiryType === "corporate" || inquiryType === "sponsorship") && (
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="company">{t("companyLabel")}</Label>
          <Input id="company" name="company" />
        </div>
      )}

      {inquiryType === "corporate" && (
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="peopleCount">{t("peopleCountLabel")}</Label>
            <Input id="peopleCount" name="peopleCount" type="number" min={1} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="preferredDate">{t("preferredDateLabel")}</Label>
            <Input id="preferredDate" name="preferredDate" type="date" />
          </div>
        </div>
      )}

      {inquiryType === "booking" && (
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="preferredDate">{t("preferredDateLabel")}</Label>
          <Input id="preferredDate" name="preferredDate" type="date" />
        </div>
      )}

      {inquiryType === "training" && (
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="level">{t("levelLabel")}</Label>
          <Select name="level">
            <SelectTrigger id="level" className="w-full">
              <SelectValue placeholder={t("levelPlaceholder")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="beginner">{t("levelBeginner")}</SelectItem>
              <SelectItem value="intermediate">{t("levelIntermediate")}</SelectItem>
              <SelectItem value="advanced">{t("levelAdvanced")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="message">{t("messageLabel")}</Label>
        <Textarea
          id="message"
          name="message"
          rows={5}
          defaultValue={defaultMessage}
          required
          aria-invalid={Boolean(state.fieldErrors.message)}
          aria-describedby={state.fieldErrors.message ? "message-error" : undefined}
        />
        {state.fieldErrors.message && (
          <p id="message-error" className="text-destructive text-sm">
            {t("requiredError")}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <div className="flex items-start gap-2">
          <Checkbox
            id="consent"
            name="consent"
            required
            className="mt-0.5"
            aria-invalid={Boolean(state.fieldErrors.consent)}
            aria-describedby={state.fieldErrors.consent ? "consent-error" : undefined}
          />
          <Label htmlFor="consent" className="text-muted-foreground text-sm font-normal">
            {t("consentText")}{" "}
            <Link
              href="/datenschutz"
              className="text-foreground hover:text-primary underline underline-offset-2"
            >
              {t("consentLink")}
            </Link>
          </Label>
        </div>
        {state.fieldErrors.consent && (
          <p id="consent-error" className="text-destructive text-sm">
            {t("consentError")}
          </p>
        )}
      </div>

      {state.status === "error" && Object.keys(state.fieldErrors).length === 0 && (
        <p className="text-destructive text-sm">{t("errorGeneric")}</p>
      )}

      <SubmitButton label={t("submit")} pendingLabel={t("submitting")} />
    </form>
  );
}
