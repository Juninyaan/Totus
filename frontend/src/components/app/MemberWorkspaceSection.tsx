import type { ReactNode } from "react";

type MemberWorkspaceSectionProps = {
  profileCard: ReactNode;
  bookingCard: ReactNode;
  bookingsCard: ReactNode;
};

export function MemberWorkspaceSection({ profileCard, bookingCard, bookingsCard }: MemberWorkspaceSectionProps) {
  return (
    <section className="sport-entrance grid gap-5" id="member-hub">
      <div>
        <p className="text-sm uppercase tracking-[0.2em] text-muted">Member hub</p>
        <h3 className="mt-3 text-2xl font-bold uppercase tracking-[0.06em] text-accent-deep">Profile and bookings in one place</h3>
        <p className="mt-2 max-w-2xl text-sm leading-7 text-muted">Members should not need to understand trainer or admin flows before they can update their account and book a session.</p>
      </div>
      <div className="grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
        <div id="member-profile">{profileCard}</div>
        <div id="booking-hub">{bookingCard}</div>
      </div>
      <div id="member-bookings">{bookingsCard}</div>
    </section>
  );
}