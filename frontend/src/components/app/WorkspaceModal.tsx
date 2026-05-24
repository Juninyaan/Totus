"use client";

import { useEffect, type ReactNode } from "react";

type WorkspaceModalProps = {
  title: string;
  description?: string;
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
};

export function WorkspaceModal({ title, description, isOpen, onClose, children }: WorkspaceModalProps) {
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[120] overflow-y-auto bg-[radial-gradient(circle_at_top,_rgba(215,255,63,0.12),_transparent_26%),rgba(7,17,27,0.82)] px-4 py-6 backdrop-blur-sm sm:px-6 sm:py-8" onClick={onClose} role="presentation">
      <div className="flex min-h-full items-start justify-center sm:items-center">
        <div className="my-auto w-full max-w-4xl overflow-hidden rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,_rgba(255,255,255,0.96),_rgba(244,247,241,0.94))] shadow-[0_28px_90px_rgba(3,10,18,0.45)]" onClick={(event) => event.stopPropagation()} role="dialog" aria-modal="true" aria-label={title}>
        <div className="bg-[linear-gradient(155deg,_#0b1827_0%,_#123322_52%,_#1a4731_100%)] px-6 py-5 text-surface sm:px-7">
          <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-surface/68">Workspace form</p>
            <h3 className="mt-2 text-2xl font-bold tracking-[-0.03em] text-surface">{title}</h3>
            {description ? <p className="mt-2 max-w-2xl text-sm leading-7 text-surface/74">{description}</p> : null}
          </div>
          <button className="rounded-full border border-white/16 bg-white/10 px-4 py-2 text-sm font-semibold text-surface transition-colors hover:bg-white/18" onClick={onClose} type="button">Close</button>
          </div>
        </div>
          <div className="max-h-[calc(100vh-140px)] overflow-y-auto bg-[radial-gradient(circle_at_top_right,_rgba(215,255,63,0.08),_transparent_28%),linear-gradient(180deg,_rgba(255,255,255,0.98),_rgba(244,247,241,0.96))] px-6 py-6 sm:max-h-[calc(92vh-132px)] sm:px-7">{children}</div>
        </div>
      </div>
    </div>
  );
}