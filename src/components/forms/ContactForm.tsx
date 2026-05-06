"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";

export function ContactForm() {
  const t = useTranslations("Pages.contact");
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", message: "" });

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    // Wired to a real endpoint (or Telegram bot relay) in a later phase.
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      setSent(true);
      setForm({ name: "", email: "", message: "" });
    }, 600);
  }

  if (sent) {
    return (
      <p className="rounded-sm border border-olive/40 bg-olive/10 p-4 text-sm text-bark">
        {t("sent")}
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <label className="block">
        <span className="font-[family-name:var(--font-ui)] text-[10px] uppercase tracking-wider text-muted">
          {t("name")}
        </span>
        <input
          required
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="input mt-1"
        />
      </label>
      <label className="block">
        <span className="font-[family-name:var(--font-ui)] text-[10px] uppercase tracking-wider text-muted">
          {t("email")}
        </span>
        <input
          required
          type="email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          className="input mt-1"
        />
      </label>
      <label className="block">
        <span className="font-[family-name:var(--font-ui)] text-[10px] uppercase tracking-wider text-muted">
          {t("message")}
        </span>
        <textarea
          required
          rows={5}
          value={form.message}
          onChange={(e) => setForm({ ...form, message: e.target.value })}
          className="input mt-1"
        />
      </label>
      <Button type="submit" disabled={submitting}>
        {t("send")}
      </Button>
    </form>
  );
}
