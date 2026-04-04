"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const COOKIE_CONSENT_KEY = "towg-cookie-consent";

export default function CookieConsent() {
  const [isMounted, setIsMounted] = useState(false);
  const [isAccepted, setIsAccepted] = useState(false);

  useEffect(() => {
    setIsMounted(true);

    const savedConsent = window.localStorage.getItem(COOKIE_CONSENT_KEY);
    if (savedConsent === "accepted") {
      setIsAccepted(true);
    }
  }, []);

  const handleAccept = () => {
    window.localStorage.setItem(COOKIE_CONSENT_KEY, "accepted");
    setIsAccepted(true);
  };

  if (!isMounted || isAccepted) {
    return null;
  }

  return (
    <div className="fixed inset-x-4 bottom-4 z-[60] md:inset-x-6 lg:bottom-6 lg:left-6 lg:right-24">
      <div className="mx-auto flex max-w-5xl flex-col gap-4 rounded-[28px] border border-[#d8dfd5] bg-white/95 p-4 text-[#18261f] shadow-[0_20px_50px_rgba(24,38,31,0.16)] backdrop-blur md:flex-row md:items-center md:justify-between md:p-5">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#5e725f]">
            Cookie Notice
          </p>
          <p className="mt-2 text-sm leading-6 text-[#314437] md:text-[15px]">
            We use cookies to improve site performance, remember your
            preferences, and support a smoother shopping experience.
            <Link
              href="/policy"
              className="ml-1 font-semibold text-[#1f6b45] transition hover:text-[#174f34]"
            >
              Learn more
            </Link>
          </p>
        </div>

        <button
          type="button"
          onClick={handleAccept}
          className="inline-flex min-h-11 items-center justify-center rounded-full bg-[#1f6b45] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#174f34]"
        >
          Accept cookies
        </button>
      </div>
    </div>
  );
}
