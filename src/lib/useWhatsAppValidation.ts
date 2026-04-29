"use client";

import { useState, useCallback, useRef } from "react";

export type WhatsAppValidationStatus =
  | "idle"
  | "checking"
  | "valid"
  | "invalid"
  | "error";

interface UseWhatsAppValidationReturn {
  /** Current validation status */
  status: WhatsAppValidationStatus;
  /** Error message to display when invalid */
  errorMessage: string;
  /** Trigger validation for a phone number (call on blur) */
  validate: (phone: string) => Promise<boolean>;
  /** Reset the validation state (e.g., when user starts typing again) */
  reset: () => void;
  /** Whether the form submit should be blocked */
  isBlocked: boolean;
}

/**
 * Hook to validate WhatsApp numbers via Evolution API.
 * Call `validate(phone)` on the phone input's onBlur event.
 * Use `status` to show visual feedback and `isBlocked` to disable form submission.
 */
export function useWhatsAppValidation(): UseWhatsAppValidationReturn {
  const [status, setStatus] = useState<WhatsAppValidationStatus>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const abortRef = useRef<AbortController | null>(null);

  const reset = useCallback(() => {
    setStatus("idle");
    setErrorMessage("");
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
  }, []);

  const validate = useCallback(async (phone: string): Promise<boolean> => {
    // Clean the phone for validation
    const clean = phone.replace(/[^0-9]/g, "");

    // Don't validate too-short numbers (user probably hasn't finished typing)
    if (!clean || clean.length < 8) {
      setStatus("idle");
      setErrorMessage("");
      return true; // Don't block on incomplete numbers
    }

    // Cancel any in-flight request
    if (abortRef.current) {
      abortRef.current.abort();
    }

    const controller = new AbortController();
    abortRef.current = controller;

    setStatus("checking");
    setErrorMessage("");

    try {
      const res = await fetch("/api/validate-whatsapp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: clean }),
        signal: controller.signal,
      });

      const data = await res.json();

      if (data.valid) {
        setStatus("valid");
        setErrorMessage("");
        return true;
      } else {
        setStatus("invalid");
        setErrorMessage("Debe ser un número válido para poder continuar");
        return false;
      }
    } catch (err) {
      // If aborted (user triggered a new validation), don't update state
      if (err instanceof DOMException && err.name === "AbortError") {
        return true;
      }
      console.error("WhatsApp validation error:", err);
      // On network error, fail-open
      setStatus("error");
      setErrorMessage("");
      return true;
    }
  }, []);

  const isBlocked = status === "invalid";

  return { status, errorMessage, validate, reset, isBlocked };
}
