import Link from "next/link";

type HeaderUser = {
  name?: string;
  email: string;
};

type ActiveKey = "home" | "profile" | "gyms" | "pt" | "group" | null;

type SiteHeaderProps = {
  currentUser: HeaderUser | null;
  activeKey: ActiveKey;
  onCreateUserClick?: () => void;
  onLoginClick?: () => void;
  onLogout?: () => void;
};

const navItemClass = "shrink-0 rounded-full border border-white/12 bg-white/80 px-4 py-2.5 text-sm font-semibold uppercase tracking-[0.16em] text-accent-deep shadow-[0_10px_24px_rgba(8,19,32,0.08)] backdrop-blur hover:border-accent hover:bg-accent hover:text-accent-deep";
const activeNavItemClass = "shrink-0 rounded-full border border-accent/70 bg-accent px-4 py-2.5 text-sm font-semibold uppercase tracking-[0.16em] text-accent-deep shadow-[0_0_0_1px_rgba(8,19,32,0.04),0_14px_30px_rgba(215,255,63,0.28)]";

export function SiteHeader({ currentUser, activeKey, onCreateUserClick, onLoginClick, onLogout }: SiteHeaderProps) {
  const showGuestAuthActions = !currentUser && activeKey === "home";

  return (
    <div className="border-b border-white/10 px-6 py-5 sm:px-8 lg:px-10">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <Link href="/" className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-full border border-accent/40 bg-accent text-sm font-black uppercase tracking-[0.22em] text-accent-deep shadow-[0_10px_24px_rgba(215,255,63,0.28)]">F</span>
          <div>
            <p className="text-xl font-bold uppercase tracking-[0.12em] text-accent-deep">Fithub</p>
            <p className="text-sm text-muted">Train harder. Move faster. Book smarter.</p>
          </div>
        </Link>

        <div className="flex flex-wrap items-center gap-3">
          {currentUser ? <span className="rounded-full border border-white/12 bg-white/80 px-5 py-3 text-sm font-semibold uppercase tracking-[0.12em] text-accent-deep shadow-[0_10px_24px_rgba(8,19,32,0.08)]">{currentUser.name || currentUser.email}</span> : showGuestAuthActions ? <>{onCreateUserClick ? <button className="rounded-full border border-white/12 bg-white/80 px-5 py-3 text-sm font-semibold uppercase tracking-[0.12em] text-accent-deep shadow-[0_10px_24px_rgba(8,19,32,0.08)] hover:border-accent hover:bg-accent hover:text-accent-deep" onClick={onCreateUserClick} type="button">Create user</button> : <Link className="rounded-full border border-white/12 bg-white/80 px-5 py-3 text-sm font-semibold uppercase tracking-[0.12em] text-accent-deep shadow-[0_10px_24px_rgba(8,19,32,0.08)] hover:border-accent hover:bg-accent hover:text-accent-deep" href="/#create-account">Create user</Link>}{onLoginClick ? <button className="rounded-full border border-accent/70 bg-accent px-5 py-3 text-sm font-semibold uppercase tracking-[0.12em] text-accent-deep shadow-[0_14px_30px_rgba(215,255,63,0.28)] hover:translate-y-[-1px]" onClick={onLoginClick} type="button">Login</button> : <Link className="rounded-full border border-accent/70 bg-accent px-5 py-3 text-sm font-semibold uppercase tracking-[0.12em] text-accent-deep shadow-[0_14px_30px_rgba(215,255,63,0.28)] hover:translate-y-[-1px]" href="/#sign-in">Login</Link>}</> : <Link className="rounded-full border border-accent/70 bg-accent px-5 py-3 text-sm font-semibold uppercase tracking-[0.12em] text-accent-deep shadow-[0_14px_30px_rgba(215,255,63,0.28)] hover:translate-y-[-1px]" href="/">Go to home</Link>}
          {currentUser && onLogout ? <button className="rounded-full border border-accent/70 bg-accent px-5 py-3 text-sm font-semibold uppercase tracking-[0.12em] text-accent-deep shadow-[0_14px_30px_rgba(215,255,63,0.28)] hover:translate-y-[-1px]" onClick={onLogout} type="button">Sign out</button> : null}
        </div>
      </div>

      <nav className="mt-4 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <Link href="/" className={activeKey === "home" ? activeNavItemClass : navItemClass}>Home</Link>
        <Link href="/discover?view=gyms" className={activeKey === "gyms" ? activeNavItemClass : navItemClass}>Gyms</Link>
        <Link href="/discover?view=pt" className={activeKey === "pt" ? activeNavItemClass : navItemClass}>Personal trainers</Link>
        <Link href="/discover?view=group" className={activeKey === "group" ? activeNavItemClass : navItemClass}>Group fitness</Link>
      </nav>
    </div>
  );
}