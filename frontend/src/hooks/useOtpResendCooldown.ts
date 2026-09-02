"use client";

import { useCallback, useEffect, useState } from "react";

const DEFAULT_OTP_RESEND_COOLDOWN_SECONDS = 60;

export function useOtpResendCooldown() {
  const [secondsLeft, setSecondsLeft] = useState(0);

  useEffect(() => {
    if (secondsLeft <= 0) {
      return;
    }

    const timerId = window.setTimeout(() => {
      setSecondsLeft((current) => Math.max(0, current - 1));
    }, 1000);

    return () => window.clearTimeout(timerId);
  }, [secondsLeft]);

  const startCooldown = useCallback((seconds?: number) => {
    const next =
      typeof seconds === "number" && Number.isFinite(seconds) && seconds > 0
        ? Math.ceil(seconds)
        : DEFAULT_OTP_RESEND_COOLDOWN_SECONDS;
    setSecondsLeft(next);
  }, []);

  const resetCooldown = useCallback(() => {
    setSecondsLeft(0);
  }, []);

  return {
    secondsLeft,
    isCoolingDown: secondsLeft > 0,
    startCooldown,
    resetCooldown,
  };
}
