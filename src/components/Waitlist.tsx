"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type ChangeEvent, type FormEvent, type InputHTMLAttributes } from "react";
import { gsap, prefersReducedMotion } from "@/lib/gsap";
import { getLenis } from "@/lib/lenis";
import {
  CONSENT_TEXT,
  NAME_MAX,
  EMAIL_MAX,
  cleanName,
  validateConsent,
  validateEmail,
  validateName,
  type FieldErrors,
  type FieldName,
  type WaitlistResponse,
} from "@/lib/waitlist";
import Blink, { OWL_EYES } from "./Blink";
import s from "./Stack.module.css";

type Guest = { name: string; email: string; kind: "joined" | "already"; emailSent: boolean };
type Note = { tone: "error" | "info"; text: string };

const FIELDS: FieldName[] = ["name", "email", "consent"];
const NETWORK_ERROR = "We couldn't reach the server. Check your connection and try again.";

/**
 * The waitlist form. It checks the fields as you go (red line, red label, the reason underneath), then sends
 * them to /api/waitlist, which adds the visitor to the Brevo list and emails a confirmation. A good result
 * hands the guest their ticket in a dialog; anything else is explained under the form.
 */
export default function Waitlist() {
  const [errors, setErrors] = useState<FieldErrors>({});
  const [sending, setSending] = useState(false);
  const [note, setNote] = useState<Note | null>(null);
  const [guest, setGuest] = useState<Guest | null>(null);
  const shownAt = useRef(0);

  // When the form first appeared; the server ignores submissions filled in faster than a person could.
  useEffect(() => {
    shownAt.current = Date.now();
  }, []);

  const validate = (form: HTMLFormElement): FieldErrors => {
    const get = (k: string) => form.elements.namedItem(k) as HTMLInputElement;
    return { name: validateName(get("name").value), email: validateEmail(get("email").value), consent: validateConsent(get("consent").checked) };
  };

  const flag = (form: HTMLFormElement, next: FieldErrors) => {
    setErrors(next);
    const bad = FIELDS.filter((k) => next[k]);
    if (!bad.length) return false;
    (form.elements.namedItem(bad[0]) as HTMLInputElement).focus();
    if (!prefersReducedMotion()) {
      gsap.fromTo(
        bad.map((k) => form.querySelector(`[data-field=${k}]`)),
        { x: 0 },
        { keyframes: { x: [0, -7, 6, -4, 2, 0] }, duration: 0.45, ease: "power2.out" },
      );
    }
    return true;
  };

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (sending) return;
    const form = e.currentTarget;
    setNote(null);
    if (flag(form, validate(form))) return;

    const get = (k: string) => form.elements.namedItem(k) as HTMLInputElement;
    const name = cleanName(get("name").value);
    const email = get("email").value.trim();

    setSending(true);
    let result: WaitlistResponse;
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          consent: get("consent").checked,
          company: get("company").value,
          elapsed: Date.now() - shownAt.current,
        }),
        signal: AbortSignal.timeout(20000),
      });
      result = (await res.json()) as WaitlistResponse;
    } catch {
      result = { status: "error", message: NETWORK_ERROR };
    } finally {
      setSending(false);
    }

    switch (result.status) {
      case "joined":
      case "already":
        setGuest({ name: result.firstName || name, email, kind: result.status, emailSent: result.status === "joined" && result.emailSent });
        setErrors({});
        form.reset();
        break;
      case "invalid":
        flag(form, result.errors);
        break;
      case "suppressed":
        setNote({ tone: "info", text: result.message });
        break;
      default:
        setNote({ tone: "error", text: result.message || NETWORK_ERROR });
    }
  };

  // Once a field has been flagged, re-check it as they go so the red clears the moment it's right.
  const onChange = (e: ChangeEvent<HTMLInputElement>) => {
    const k = e.target.name as FieldName;
    if (!errors[k]) return;
    const fix = k === "name" ? validateName(e.target.value) : k === "email" ? validateEmail(e.target.value) : validateConsent(e.target.checked);
    setErrors((prev) => ({ ...prev, [k]: fix }));
  };

  return (
    <div className={s.formWrap}>
      <form className={s.form} onSubmit={onSubmit} noValidate aria-busy={sending}>
        <div className={s.fields}>
          <Field
            name="name"
            label="Name"
            error={errors.name}
            onChange={onChange}
            autoComplete="name"
            placeholder="What we call you"
            maxLength={NAME_MAX}
          />
          <Field
            name="email"
            label="Email"
            error={errors.email}
            onChange={onChange}
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="Where the drop lands"
            maxLength={EMAIL_MAX}
          />
        </div>

        <div className={s.consent} data-field="consent" data-invalid={errors.consent ? "" : undefined}>
          <input
            id="notify-consent"
            name="consent"
            type="checkbox"
            onChange={onChange}
            aria-invalid={errors.consent ? true : undefined}
            aria-describedby="notify-consent-error"
          />
          <label htmlFor="notify-consent">{CONSENT_TEXT}</label>
          <ErrorText id="notify-consent-error" error={errors.consent} />
        </div>

        {/* For bots only: people never see or reach this field. */}
        <div className={s.trap} aria-hidden="true">
          <label>
            Company
            <input name="company" type="text" tabIndex={-1} autoComplete="off" defaultValue="" />
          </label>
        </div>

        <button className={s.button} type="submit" disabled={sending} data-sending={sending || undefined}>
          {sending ? (
            <>
              <span className={s.spinner} aria-hidden="true" />
              Saving your spot
            </>
          ) : (
            "Notify Me!"
          )}
        </button>
      </form>

      <p className={s.formNote} data-tone={note?.tone} role={note?.tone === "error" ? "alert" : "status"}>
        {note?.text}
      </p>

      <TicketDialog guest={guest} onClosed={() => setGuest(null)} />
    </div>
  );
}

function ErrorText({ id, error }: { id: string; error?: string }) {
  return (
    <p id={id} className={s.error}>
      {error && (
        <>
          <svg width="15" height="15" viewBox="0 0 16 16" aria-hidden="true">
            <circle cx="8" cy="8" r="7.25" fill="none" stroke="currentColor" strokeWidth="1.5" />
            <path d="M8 4.2v4.6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
            <circle cx="8" cy="11.4" r="1" fill="currentColor" />
          </svg>
          {error}
        </>
      )}
    </p>
  );
}

function Field({ name, label, error, ...input }: { name: FieldName; label: string; error?: string } & InputHTMLAttributes<HTMLInputElement>) {
  const id = `notify-${name}`;
  return (
    <div className={s.field} data-field={name} data-invalid={error ? "" : undefined}>
      <label htmlFor={id}>{label}</label>
      <input id={id} name={name} aria-invalid={error ? true : undefined} aria-describedby={`${id}-error`} {...input} />
      <ErrorText id={`${id}-error`} error={error} />
    </div>
  );
}

/**
 * The confirmation: an admission ticket with the guest's name on it rises out of the dark and gets stamped
 * ON THE LIST. Esc, the backdrop, the close button or "Back to the night" put it away.
 */
function TicketDialog({ guest, onClosed }: { guest: Guest | null; onClosed: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const closing = useRef(false);

  useEffect(() => {
    const d = dialog.current;
    if (!d || !guest || d.open) return;
    d.showModal();
    getLenis()?.stop();
    if (prefersReducedMotion()) return;

    const q = gsap.utils.selector(d);
    const tl = gsap
      .timeline()
      .fromTo(q("[data-scrim]"), { opacity: 0 }, { opacity: 1, duration: 0.5, ease: "power2.out" })
      .fromTo(q("[data-ticket]"), { y: 110, rotate: -6, scale: 0.9, opacity: 0 }, { y: 0, rotate: 0, scale: 1, opacity: 1, duration: 1, ease: "expo.out" }, 0.05)
      .fromTo(q("[data-t-line]"), { y: 18, opacity: 0 }, { y: 0, opacity: 1, stagger: 0.07, duration: 0.6, ease: "power3.out" }, 0.3)
      // The stamp comes down hard, the ticket gives under it, a ring of ink spreads.
      .fromTo(q("[data-stamp]"), { scale: 2.6, rotate: -32, opacity: 0 }, { scale: 1, rotate: -12, opacity: 1, duration: 0.34, ease: "power4.in" }, 0.85)
      .fromTo(q("[data-ticket]"), { y: 0 }, { keyframes: { y: [0, 5, 0] }, duration: 0.32, ease: "power2.out" }, 1.19)
      .fromTo(q("[data-burst]"), { scale: 0.6, opacity: 0.55 }, { scale: 1.9, opacity: 0, duration: 0.6, ease: "expo.out" }, 1.19)
      .fromTo(q("[data-t-after]"), { y: 12, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, ease: "power2.out" }, 1.05);
    return () => {
      tl.kill();
    };
  }, [guest]);

  const close = () => {
    const d = dialog.current;
    if (!d?.open || closing.current) return;
    closing.current = true;
    const q = gsap.utils.selector(d);
    const done = () => {
      d.close();
      getLenis()?.start();
      gsap.set(q("[data-scrim], [data-ticket], [data-t-line], [data-stamp], [data-burst], [data-t-after]"), { clearProps: "all" });
      closing.current = false;
    };
    if (prefersReducedMotion()) return done();
    gsap
      .timeline({ onComplete: done })
      .to(q("[data-t-after]"), { opacity: 0, duration: 0.2, ease: "power2.in" }, 0)
      .to(q("[data-ticket]"), { y: 50, scale: 0.95, opacity: 0, duration: 0.34, ease: "power2.in" }, 0)
      .to(q("[data-scrim]"), { opacity: 0, duration: 0.34, ease: "power2.in" }, 0.08);
  };

  const already = guest?.kind === "already";

  return (
    <dialog
      ref={dialog}
      className={s.dialog}
      aria-labelledby="ticket-title"
      aria-describedby="ticket-msg"
      data-lenis-prevent
      onCancel={(e) => {
        e.preventDefault();
        close();
      }}
      onClose={() => {
        getLenis()?.start();
        onClosed();
      }}
    >
      <div className={s.dialogScrim} data-scrim onClick={close} aria-hidden="true" />
      <div className={s.dialogBody}>
        <div className={s.pass} data-ticket>
          <div className={s.passMain}>
            <div className={s.passHead} data-t-line>
              <span className={s.passOwl}>
                <Image src="/images/owl-badge.png" alt="" width={88} height={88} />
                <Blink eyes={OWL_EYES.badge} />
              </span>
              <span className={s.passBrand}>
                NOCTVRNA
                <small>The Lagos Life</small>
              </span>
            </div>
            <h2 id="ticket-title" className={s.passTitle} data-t-line>
              {already ? "Still on the list, " : "Noted, "}
              <span className={s.passName}>{guest?.name}</span>.
            </h2>
            <p id="ticket-msg" className={s.passMsg} data-t-line>
              {already ? "You'd already joined, so nothing's changed. Watch your inbox when tickets drop." : "Watch your inbox when tickets drop."}
            </p>
            {guest?.emailSent && (
              <p className={s.passNote} data-t-line>
                Confirmation sent to <span>{guest.email}</span>
              </p>
            )}
            <dl className={s.passFacts} data-t-line>
              <div>
                <dt>Date</dt>
                <dd>12.12.26</dd>
              </div>
              <div>
                <dt>City</dt>
                <dd>Lagos</dd>
              </div>
            </dl>
            <div className={s.stamp} aria-hidden="true">
              <span className={s.burst} data-burst />
              <span className={s.stampIn} data-stamp>
                On the list
              </span>
            </div>
          </div>
          <div className={s.passStub} aria-hidden="true">
            <span className={s.passAdmit}>Admit one</span>
            <span className={s.passCode} />
            <span className={s.passDate}>12.12.26</span>
          </div>
        </div>
        <button type="button" className={s.passDone} data-t-after onClick={close} autoFocus>
          Back to the night
          <svg width="18" height="12" viewBox="0 0 18 12" aria-hidden="true">
            <path d="M1 6h15M11 1l5 5-5 5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
      <button type="button" className={s.passClose} data-t-after onClick={close} aria-label="Close">
        <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
          <path d="M2 2l12 12M14 2L2 14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      </button>
    </dialog>
  );
}
