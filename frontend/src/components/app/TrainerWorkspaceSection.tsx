import type { ReactNode } from "react";

type TrainerWorkspaceSectionProps = {
  profileCard: ReactNode;
  serviceCard: ReactNode;
  servicesCard: ReactNode;
  sessionsCard: ReactNode;
};

export function TrainerWorkspaceSection({
  profileCard,
  serviceCard,
  servicesCard,
  sessionsCard,
}: TrainerWorkspaceSectionProps) {
  return (
    <section className="sport-entrance grid gap-5" id="trainer-hub">
      <div>
        <p className="text-sm uppercase tracking-[0.2em] text-muted">Trainer studio</p>
        <h3 className="mt-3 text-2xl font-bold uppercase tracking-[0.06em] text-accent-deep">Services, availability, and assigned sessions</h3>
        <p className="mt-2 max-w-2xl text-sm leading-7 text-muted">Trainer tools stay grouped together so publishing services and handling member sessions feel like one workflow.</p>
      </div>
      <div className="grid gap-5 xl:grid-cols-2">
        <div id="trainer-profile">{profileCard}</div>
        <div id="trainer-services">{serviceCard}</div>
      </div>
      <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
        <div>{servicesCard}</div>
        <div id="trainer-sessions">{sessionsCard}</div>
      </div>
    </section>
  );
}