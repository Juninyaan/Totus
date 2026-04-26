"use client";

import { useRouter, useSearchParams } from "next/navigation";

type ReturnToPreviousButtonProps = {
  fallbackHref: string;
  label: string;
  className?: string;
};

export function ReturnToPreviousButton({ fallbackHref, label, className }: ReturnToPreviousButtonProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleClick = () => {
    const returnTo = searchParams.get("returnTo");
    if (returnTo) {
      router.push(returnTo);
      return;
    }

    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
      return;
    }

    router.push(fallbackHref);
  };

  return <button className={className} onClick={handleClick} type="button">{label}</button>;
}