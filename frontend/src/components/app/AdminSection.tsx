"use client";

type AdminDashboard = {
  metrics: {
    users: number;
    trainers: number;
    services: number;
    shops: number;
    bookings: number;
  };
  allUsers: Array<{
    _id: string;
    name: string;
    email: string;
    phone?: string;
    roles: string[];
    isActive: boolean;
  }>;
  allTrainers: Array<{
    _id: string;
    specialties: string[];
    experienceYears?: number;
    bio?: string;
    isActive: boolean;
    userId?: {
      name?: string;
      email?: string;
      phone?: string;
    };
  }>;
  recentBookings: Array<{
    _id: string;
    bookingDate: string;
    timeSlot: string;
    status: string;
    userId?: { name: string; email: string };
    serviceId?: { title: string; category: string; type: string };
  }>;
  recentShops: Array<{
    _id: string;
    shopName: string;
    isVerified: boolean;
    categories: string[];
    ownerId?: { name: string; email: string };
  }>;
};

type AdminSectionProps = {
  currentUser: {
    email: string;
    roles: string[];
  } | null;
  adminDashboard: AdminDashboard | null;
  onAdminBookingStatus: (bookingId: string, status: "accepted" | "completed" | "cancelled") => void;
  onVerifyShop: (shopId: string, isVerified: boolean) => void;
  onAdminUserActive: (userId: string, isActive: boolean) => void;
  onAdminTrainerActive: (trainerId: string, isActive: boolean) => void;
};

export function AdminSection({
  currentUser,
  adminDashboard,
  onAdminBookingStatus,
  onVerifyShop,
  onAdminUserActive,
  onAdminTrainerActive,
}: AdminSectionProps) {
  const allUsers = adminDashboard?.allUsers ?? [];
  const allTrainers = adminDashboard?.allTrainers ?? [];
  const recentBookings = adminDashboard?.recentBookings ?? [];
  const recentShops = adminDashboard?.recentShops ?? [];

  return (
    <section className="sport-entrance grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
      <div className="sport-panel rounded-[2rem] p-8 sm:p-10">
        <p className="text-sm uppercase tracking-[0.2em] text-muted">Control center</p>
        <h2 className="mt-3 text-3xl font-bold uppercase tracking-[0.06em] text-accent-deep">Platform oversight</h2>
        <p className="mt-3 text-sm leading-7 text-muted">This space is reserved for moderation, account controls, and platform health checks.</p>
        <div className="sport-subpanel mt-6 rounded-[1.5rem] p-5">
          <p className="text-sm text-muted">Current user</p>
          <p className="mt-2 text-lg font-semibold text-accent-deep">{currentUser ? currentUser.email : "Not signed in"}</p>
          <p className="mt-2 text-sm text-muted">{currentUser ? `Roles: ${currentUser.roles.join(", ")}` : "Sign in with an account that has administrator access to open this area."}</p>
        </div>
      </div>
      <div className="sport-dark-panel rounded-[2rem] p-8 text-surface sm:p-10">
        {currentUser?.roles.includes("admin") && adminDashboard ? (
          <>
            <div className="grid gap-4 sm:grid-cols-5">{Object.entries(adminDashboard.metrics).map(([key, value]) => <article key={key} className="rounded-[1.5rem] border border-white/10 bg-white/8 px-4 py-5 backdrop-blur"><p className="text-xs uppercase tracking-[0.18em] text-surface/70">{key}</p><p className="mt-3 text-3xl font-black tracking-[-0.04em]">{value}</p></article>)}</div>
            <div className="mt-8 grid gap-5 lg:grid-cols-2">
              <div className="rounded-[1.5rem] border border-white/10 bg-white/8 p-5 backdrop-blur"><p className="text-lg font-semibold uppercase tracking-[0.06em]">People and access</p><p className="mt-2 text-sm text-surface/75">Quickly reactivate, pause, or inspect user accounts.</p><div className="mt-4 grid gap-3">{allUsers.map((user) => <article key={user._id} className="rounded-2xl border border-white/10 bg-white/8 p-4"><p className="font-semibold">{user.name}</p><p className="mt-1 text-sm text-surface/75">{user.email}</p><p className="mt-1 text-sm text-surface/70">{user.phone || "Phone pending"}</p><p className="mt-2 text-xs uppercase tracking-[0.18em] text-accent">{user.roles.join(", ")}</p><p className="mt-2 text-xs uppercase tracking-[0.18em] text-surface/70">{user.isActive ? "active" : "inactive"}</p><div className="mt-3 flex flex-wrap gap-2"><button className="rounded-full border border-surface/20 px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-surface hover:bg-surface/10" type="button" onClick={() => onAdminUserActive(user._id, true)}>Activate</button><button className="rounded-full border border-accent/40 px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-accent hover:bg-accent hover:text-accent-deep" type="button" onClick={() => onAdminUserActive(user._id, false)}>Deactivate</button></div></article>)}</div></div>
              <div className="rounded-[1.5rem] border border-white/10 bg-white/8 p-5 backdrop-blur"><p className="text-lg font-semibold uppercase tracking-[0.06em]">Trainer moderation</p><p className="mt-2 text-sm text-surface/75">Separate trainer oversight from everyday user management.</p><div className="mt-4 grid gap-3">{allTrainers.map((trainer) => <article key={trainer._id} className="rounded-2xl border border-white/10 bg-white/8 p-4"><p className="font-semibold">{trainer.userId?.name ?? "Trainer"}</p><p className="mt-1 text-sm text-surface/75">{trainer.userId?.email ?? "Email pending"}</p><p className="mt-1 text-sm text-surface/70">{trainer.specialties.join(", ") || "General fitness"}</p><p className="mt-1 text-sm text-surface/70">{trainer.experienceYears ?? 0} years experience</p><p className="mt-2 text-xs uppercase tracking-[0.18em] text-surface/70">{trainer.isActive ? "active" : "inactive"}</p><div className="mt-3 flex flex-wrap gap-2"><button className="rounded-full border border-surface/20 px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-surface hover:bg-surface/10" type="button" onClick={() => onAdminTrainerActive(trainer._id, true)}>Activate</button><button className="rounded-full border border-accent/40 px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-accent hover:bg-accent hover:text-accent-deep" type="button" onClick={() => onAdminTrainerActive(trainer._id, false)}>Pause</button></div></article>)}</div></div>
            </div>
            <div className="mt-5 grid gap-5 lg:grid-cols-2">
              <div className="rounded-[1.5rem] border border-white/10 bg-white/8 p-5 backdrop-blur"><p className="text-lg font-semibold uppercase tracking-[0.06em]">Recent bookings</p><div className="mt-4 grid gap-3">{recentBookings.map((booking) => <article key={booking._id} className="rounded-2xl border border-white/10 bg-white/8 p-4"><p className="font-semibold">{booking.serviceId?.title ?? "Service"}</p><p className="mt-1 text-sm text-surface/75">{booking.userId?.name ?? "Unknown user"}</p><p className="mt-2 text-xs uppercase tracking-[0.18em] text-accent">{booking.status} · {booking.timeSlot}</p><div className="mt-3 flex flex-wrap gap-2"><button className="rounded-full border border-surface/20 px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-surface hover:bg-surface/10" type="button" onClick={() => onAdminBookingStatus(booking._id, "accepted")}>Accept</button><button className="rounded-full border border-surface/20 px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-surface hover:bg-surface/10" type="button" onClick={() => onAdminBookingStatus(booking._id, "completed")}>Completed</button><button className="rounded-full border border-accent/40 px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-accent hover:bg-accent hover:text-accent-deep" type="button" onClick={() => onAdminBookingStatus(booking._id, "cancelled")}>Cancel</button></div></article>)}</div></div>
              <div className="rounded-[1.5rem] border border-white/10 bg-white/8 p-5 backdrop-blur"><p className="text-lg font-semibold uppercase tracking-[0.06em]">Shop moderation</p><div className="mt-4 grid gap-3">{recentShops.map((shop) => <article key={shop._id} className="rounded-2xl border border-white/10 bg-white/8 p-4"><p className="font-semibold">{shop.shopName}</p><p className="mt-1 text-sm text-surface/75">{shop.ownerId?.email ?? "Owner pending"}</p><p className="mt-2 text-xs uppercase tracking-[0.18em] text-accent">{shop.isVerified ? "verified" : "pending review"}</p><div className="mt-3 flex flex-wrap gap-2"><button className="rounded-full border border-surface/20 px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-surface hover:bg-surface/10" type="button" onClick={() => onVerifyShop(shop._id, true)}>Verify</button><button className="rounded-full border border-accent/40 px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-accent hover:bg-accent hover:text-accent-deep" type="button" onClick={() => onVerifyShop(shop._id, false)}>Mark pending</button></div></article>)}</div></div>
            </div>
          </>
        ) : (
          <div className="rounded-[1.5rem] border border-white/10 bg-white/8 p-6 backdrop-blur"><p className="text-lg font-semibold uppercase tracking-[0.06em]">Admin session required</p><p className="mt-3 text-sm leading-7 text-surface/75">System metrics and moderation tools appear once an administrator is signed in.</p></div>
        )}
      </div>
    </section>
  );
}