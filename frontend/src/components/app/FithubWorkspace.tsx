"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";

import { AdminSection } from "@/components/app/AdminSection";
import { MemberWorkspaceSection } from "@/components/app/MemberWorkspaceSection";
import { SiteHeader } from "@/components/app/SiteHeader";
import { ShopWorkspaceSection } from "@/components/app/ShopWorkspaceSection";
import { TrainerWorkspaceSection } from "@/components/app/TrainerWorkspaceSection";
import { WorkspaceModal } from "@/components/app/WorkspaceModal";
import { ApiError, apiRequest } from "@/lib/api";

type AuthUser = {
  _id: string;
  name: string;
  email: string;
  roles: string[];
  phone?: string;
  dateOfBirth?: string;
  address?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  allergies?: string;
  medicalConditions?: string;
  medications?: string;
  medicalNotes?: string;
  profileImage?: string;
};


type AuthModalView = "login" | "register";

type TrainingDeliveryMode = "in_person" | "online" | "outdoor";

type ServiceScheduleSlot = {
  day: string;
  startTime: string;
  endTime: string;
};

type ServiceDeliveryOption = {
  mode: TrainingDeliveryMode;
  label: string;
  details?: string;
};

type Trainer = {
  _id: string;
  userId?: AuthUser;
  specialties: string[];
  experienceYears: number;
  bio?: string;
  portfolio?: {
    headline?: string;
    coachingStyle?: string;
    certifications?: string[];
    achievements?: string[];
  };
  isActive?: boolean;
};

type Service = {
  _id: string;
  category: string;
  type: string;
  title: string;
  description?: string;
  audience?: "all" | "ladies";
  price: number;
  currency?: string;
  isActive?: boolean;
  trainerId?: Trainer;
  shopId?: Shop;
  location?: {
    name?: string;
    city?: string;
  };
  schedule?: ServiceScheduleSlot[];
  deliveryOptions?: ServiceDeliveryOption[];
  capacity?: number;
};

type GroupFitnessTeam = {
  _id: string;
  name: string;
  location?: string;
  focus?: string;
  description?: string;
};

type GroupFitnessProgram = {
  _id: string;
  teamId: string;
  title: string;
  subtitle?: string;
  description?: string;
  days: string[];
  startTime: string;
  endTime: string;
  startDate: string;
  endDate: string;
  availableSlots: number;
  isFull?: boolean;
  isComplete?: boolean;
  coach?: string;
  venue?: string;
  currency?: string;
  price?: number;
  linkedServiceId?: string;
};

type Shop = {
  _id: string;
  shopName: string;
  categories: string[];
  location?: string;
  description?: string;
  ownerId?: { _id?: string; name?: string; email?: string };
  isVerified?: boolean;
  websiteLink?: string;
  logoUrl?: string;
  peakHoursBusy?: string;
  peakHoursQuiet?: string;
  peakHoursNotes?: string;
};

type Product = {
  _id: string;
  name: string;
  price: number;
  currency?: string;
  description?: string;
  externalLink?: string;
  availability?: boolean;
};

type Booking = {
  _id: string;
  bookingDate: string;
  timeSlot: string;
  status: string;
  attendanceStatus?: "pending" | "attended" | "missed" | "excused";
  attendanceNote?: string;
  paymentStatus?: string;
  paymentMethod?: "cash" | "card" | "bank_transfer" | "wallet" | "apple_pay" | "google_pay";
  paymentReference?: string;
  accessStartDate?: string;
  accessEndDate?: string;
  serviceId?: { _id?: string; title?: string; category?: string; type?: string };
  trainerId?: { _id?: string; userId?: { name?: string; email?: string } };
  userId?: { _id?: string; name?: string; email?: string };
  groupProgramId?: { _id?: string; title?: string; subtitle?: string; teamId?: { name?: string } };
  notes?: string;
  sessionMode?: TrainingDeliveryMode;
  sessionLocation?: string;
  rescheduleStatus?: "none" | "requested_by_client" | "counter_proposed_by_host" | "counter_proposed_by_client" | "approved" | "declined";
  rescheduleReason?: string;
  proposedBookingDate?: string;
  proposedTimeSlot?: string;
  proposedSlots?: Array<{ bookingDate: string; timeSlot: string }>;
};

type MealProgressEntry = {
  _id: string;
  userId: string;
  date: string;
  status: "followed" | "partial" | "missed";
  note?: string;
};

type BodyMeasurementEntry = {
  _id: string;
  userId: string;
  measuredAt: string;
  weightKg?: number;
  bodyFatPercent?: number;
  chestCm?: number;
  waistCm?: number;
  hipsCm?: number;
  thighCm?: number;
  armCm?: number;
  note?: string;
};

type Subscription = {
  _id: string;
  title?: string;
  kind?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  shopId?: { shopName?: string; location?: string };
};

type Notification = {
  _id: string;
  type: string;
  title: string;
  message: string;
  readAt?: string;
  createdAt: string;
};

type AuthResponse = {
  token: string;
  user: AuthUser;
};

type SavedItem = {
  id: string;
  kind: "trainer" | "gym" | "program" | "shop";
  title: string;
  subtitle: string;
  href: string;
};

type TrainerVenueLink = {
  shop: Shop;
  services: Service[];
};

type DiscoverPanelKey = "groupSchedule" | "ptDelivery" | "ptSlots" | "gymSetup" | "gymSlots";

type WorkspaceView = "all" | "trainer" | "shop" | "admin";

type WorkspaceModalKey = "trainerProfile" | "trainerService" | "shopProfile" | "shopProduct" | "shopVenueOffer" | null;

type TrainerBookingDraft = {
  bookingId: string;
  slotOptions: Array<{ bookingDate: string; timeSlot: string }>;
  notes: string;
};

type RatingSummary = {
  average: number | null;
  count: number;
};

type RatingModal = {
  targetType: "trainer" | "shop" | "service";
  targetId: string;
  targetLabel: string;
};

type TrainerMeasurementDraft = {
  measuredAt: string;
  weightKg: string;
  bodyFatPercent: string;
  chestCm: string;
  waistCm: string;
  hipsCm: string;
  thighCm: string;
  armCm: string;
  note: string;
};

type MemberRescheduleDraft = {
  bookingId: string;
  bookingDate: string;

  timeSlot: string;
  reason: string;
};

type QuickAction = {
  id: string;
  title: string;
  description: string;
  keywords: string[];
  run: () => void;
};

type AdminDashboard = {
  metrics: {
    users: number;
    trainers: number;
    services: number;
    shops: number;
    bookings: number;
  };
  recentUsers: Array<{
    _id: string;
    name: string;
    email: string;
    roles: string[];
    phone?: string;
    isActive: boolean;
    createdAt: string;
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
  allUsers: Array<{
    _id: string;
    name: string;
    email: string;
    phone?: string;
    roles: string[];
    isActive: boolean;
    createdAt: string;
  }>;
  allTrainers: Array<{
    _id: string;
    specialties: string[];
    experienceYears?: number;
    bio?: string;
    isActive: boolean;
    userId?: { name?: string; email?: string; phone?: string };
  }>;
};

type RegisterFormState = {
  name: string;
  email: string;
  password: string;
  phone: string;
  dateOfBirth: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  allergies: string;
  medicalConditions: string;
  medications: string;
  medicalNotes: string;
};

const emptyRegisterForm: RegisterFormState = {
  name: "",
  email: "",
  password: "",
  phone: "",
  dateOfBirth: "",
  emergencyContactName: "",
  emergencyContactPhone: "",
  allergies: "",
  medicalConditions: "",
  medications: "",
  medicalNotes: "",
};

const tokenStorageKey = "fithub-token";
const savedItemsStorageKey = "fithub-saved-items";

const formFieldClass = "min-h-12 rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm text-accent-deep outline-none transition-colors focus:border-accent";
const formTextareaClass = "min-h-28 rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm text-accent-deep outline-none transition-colors focus:border-accent";
const fieldLabelClass = "text-xs font-semibold uppercase tracking-[0.16em] text-muted";
const primaryButtonClass = "rounded-full bg-accent-deep px-5 py-3 text-sm font-semibold uppercase tracking-[0.12em] text-white transition-colors hover:bg-[#204938] disabled:cursor-not-allowed disabled:opacity-60";
const secondaryButtonClass = "rounded-full border border-black/10 bg-white px-5 py-3 text-sm font-semibold uppercase tracking-[0.12em] text-accent-deep transition-colors hover:border-accent hover:bg-accent";
const discoverCardClass = "rounded-[1.75rem] border border-white/12 bg-surface/10 p-6 text-left shadow-[0_20px_50px_rgba(3,10,18,0.14)] transition-transform hover:-translate-y-1";
const discoverCardActiveClass = "rounded-[1.75rem] border border-accent/60 bg-surface/18 p-6 text-left shadow-[0_24px_60px_rgba(3,10,18,0.18)] ring-1 ring-accent/35";
const discoverDetailCardClass = "rounded-[1.5rem] border border-white/12 bg-surface/10 p-5 text-left shadow-[0_16px_40px_rgba(3,10,18,0.12)] transition-colors hover:bg-surface/14";
const discoverDetailCardActiveClass = "rounded-[1.5rem] border border-accent/60 bg-surface/18 p-5 text-left shadow-[0_20px_48px_rgba(3,10,18,0.16)] ring-1 ring-accent/35";
const discoverChipClass = "rounded-full border border-white/14 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-surface/80";
const discoverMiniSlotClass = "rounded-xl border border-white/10 bg-white/10 px-3 py-3 text-sm text-surface/78";
const emptyStateClass = "rounded-2xl border border-dashed border-black/10 bg-white px-4 py-4 text-sm text-muted";
const chartCardClass = "rounded-2xl border border-black/8 bg-white px-4 py-4";

const emptyTrainerMeasurementDraft: TrainerMeasurementDraft = {
  measuredAt: new Date().toISOString().slice(0, 10),
  weightKg: "",
  bodyFatPercent: "",
  chestCm: "",
  waistCm: "",
  hipsCm: "",
  thighCm: "",
  armCm: "",
  note: "",
};

const trainerMeasurementMetrics: Array<{
  title: string;
  unit: string;
  stroke: string;
  accessor: (item: BodyMeasurementEntry) => number | undefined;
}> = [
  { title: "Weight trend", unit: "kg", stroke: "#123322", accessor: (item) => item.weightKg },
  { title: "Body fat trend", unit: "%", stroke: "#7699ff", accessor: (item) => item.bodyFatPercent },
  { title: "Chest trend", unit: "cm", stroke: "#6c4ab6", accessor: (item) => item.chestCm },
  { title: "Waist trend", unit: "cm", stroke: "#ff6a2c", accessor: (item) => item.waistCm },
  { title: "Hips trend", unit: "cm", stroke: "#13a3b8", accessor: (item) => item.hipsCm },
  { title: "Thigh trend", unit: "cm", stroke: "#2f6f2f", accessor: (item) => item.thighCm },
  { title: "Arm trend", unit: "cm", stroke: "#b85c38", accessor: (item) => item.armCm },
];

const getDeliveryModeLabel = (mode: TrainingDeliveryMode) => mode === "online"
  ? "Online"
  : mode === "outdoor"
    ? "Outdoor"
    : "In person";

const toDateInputValue = (value: string) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 10);
};

type Section = "home" | "auth" | "discover" | "manage" | "admin";

const sectionMeta: Record<Section, { eyebrow: string; title: string; description: string }> = {
  home: {
    eyebrow: "Home",
    title: "Your Fithub dashboard",
    description: "See today’s meals, upcoming sessions, coach or gym details, and the shortcuts you use most.",
  },
  auth: {
    eyebrow: "Access",
    title: "Welcome to Fithub",
    description: "Login to continue with the experience that matches your role.",
  },
  discover: {
    eyebrow: "Explore",
    title: "Fitness booking that feels simple from the first screen",
    description: "See what Fithub offers, then move straight into booking personal training, group programs, or gyms.",
  },
  manage: {
    eyebrow: "Workspace",
    title: "Your tools by role",
    description: "Trainer, gym, shop, and admin tools stay here, while member booking status lives on home and profile.",
  },
  admin: {
    eyebrow: "Control center",
    title: "Moderate and monitor the platform",
    description: "Administrative controls are reserved for approved staff accounts.",
  },
};

const weekdayIndex: Record<string, number> = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
};

const getNextSessionDate = (slot: ServiceScheduleSlot) => {
  const bookingDate = new Date();
  bookingDate.setHours(0, 0, 0, 0);

  const targetDay = weekdayIndex[slot.day.trim().toLowerCase()];

  if (typeof targetDay === "number") {
    const daysAhead = (targetDay - bookingDate.getDay() + 7) % 7;
    bookingDate.setDate(bookingDate.getDate() + daysAhead);
  }

  return bookingDate.toISOString().slice(0, 10);
};

const getBookingStartAt = (booking: Pick<Booking, "bookingDate" | "timeSlot">) => {
  const startsAt = new Date(booking.bookingDate);
  if (Number.isNaN(startsAt.getTime())) {
    return null;
  }

  const [startTokenRaw] = `${booking.timeSlot ?? ""}`.split("-");
  const timeMatch = startTokenRaw?.trim().match(/(\d{1,2}):(\d{2})/);
  if (timeMatch) {
    startsAt.setHours(Number(timeMatch[1]), Number(timeMatch[2]), 0, 0);
  }

  return startsAt;
};

const formatBookingDateTime = (booking: Pick<Booking, "bookingDate" | "timeSlot">) => {
  const startsAt = getBookingStartAt(booking);
  if (!startsAt) {
    return `${new Date(booking.bookingDate).toLocaleDateString()} at ${booking.timeSlot}`;
  }

  return `${startsAt.toLocaleDateString()} at ${startsAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
};

const getNameInitials = (value: string) => value
  .split(/\s+/)
  .filter(Boolean)
  .slice(0, 2)
  .map((part) => part[0]?.toUpperCase() ?? "")
  .join("") || "GY";

const normalizeMatchValue = (value: string | undefined) => (value ?? "")
  .trim()
  .toLowerCase();

const isMembershipOffer = (service: Service) => /membership|access|day pass|monthly|weekly|drop in|drop-in|entry|open gym|pass/i.test(`${service.category} ${service.type} ${service.title} ${service.description ?? ""}`);

const isClassOffer = (service: Service) => /class|session|bootcamp|yoga|pilates|boxing|crossfit|spin|cycle|mobility|strength|conditioning|dance|hiit|circuit|zumba/i.test(`${service.category} ${service.type} ${service.title} ${service.description ?? ""}`);

const isPersonalTrainingBooking = (booking: Booking) => /\bpt\b|personal/i.test(`${booking.serviceId?.category ?? ""} ${booking.serviceId?.type ?? ""} ${booking.serviceId?.title ?? ""}`) && !booking.groupProgramId?._id;

const isGroupFitnessBooking = (booking: Booking) => Boolean(booking.groupProgramId?._id) || /group|class|bootcamp|program|cohort|team|yoga|pilates|boxing|spin|cycle|dance|zumba|hiit/i.test(`${booking.serviceId?.category ?? ""} ${booking.serviceId?.type ?? ""} ${booking.serviceId?.title ?? ""}`);

const isReschedulableBooking = (booking: Booking) => Boolean(booking.trainerId?._id || booking.serviceId?.category && /pt|personal|class|group/i.test(`${booking.serviceId?.category ?? ""} ${booking.serviceId?.type ?? ""} ${booking.serviceId?.title ?? ""}`));

const canRequestBookingReschedule = (booking: Booking) => {
  const startsAt = getBookingStartAt(booking);
  if (!startsAt) {
    return false;
  }

  return startsAt.getTime() - Date.now() >= 3 * 60 * 60 * 1000;
};

const formatProposedSlotKey = (bookingDate: string, timeSlot: string) => `${new Date(bookingDate).toISOString()}::${timeSlot}`;

const buildPolylinePoints = (values: number[]) => {
  if (values.length === 0) {
    return "";
  }

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  return values.map((value, index) => {
    const x = values.length === 1 ? 50 : (index / (values.length - 1)) * 100;
    const y = 30 - ((value - min) / range) * 24 + 3;
    return `${x},${y}`;
  }).join(" ");
};

function MeasurementTrendChart({
  title,
  unit,
  stroke,
  items,
  accessor,
}: {
  title: string;
  unit: string;
  stroke: string;
  items: BodyMeasurementEntry[];
  accessor: (item: BodyMeasurementEntry) => number | undefined;
}) {
  const series = items
    .slice()
    .reverse()
    .map((item) => ({ label: item.measuredAt, value: accessor(item) }))
    .filter((item): item is { label: string; value: number } => typeof item.value === "number");

  if (series.length === 0) {
    return <div className={chartCardClass}><p className="font-semibold text-accent-deep">{title}</p><p className="mt-3 text-sm text-muted">No measurement history logged yet.</p></div>;
  }

  const values = series.map((item) => item.value);
  const latest = series[series.length - 1];
  const points = buildPolylinePoints(values);

  return (
    <div className={chartCardClass}>
      <div className="flex items-center justify-between gap-3">
        <p className="font-semibold text-accent-deep">{title}</p>
        <p className="text-sm font-semibold text-accent-deep">{latest.value.toFixed(1)} {unit}</p>
      </div>
      <svg className="mt-4 h-28 w-full" preserveAspectRatio="none" viewBox="0 0 100 36">
        <path d="M 0 33 H 100" fill="none" stroke="rgba(8,19,32,0.08)" strokeWidth="1" />
        <polyline fill="none" points={points} stroke={stroke} strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" />
        {points.split(" ").filter(Boolean).map((point) => {
          const [cx, cy] = point.split(",");
          return <circle key={point} cx={cx} cy={cy} fill={stroke} r="1.9" />;
        })}
      </svg>
      <div className="mt-2 flex items-center justify-between text-[11px] uppercase tracking-[0.16em] text-muted">
        <span>{series[0].label}</span>
        <span>{latest.label}</span>
      </div>
    </div>
  );
}

const dashboardMealPlans: Record<string, { focus: string; entries: Array<{ label: string; time: string; summary: string }> }> = {
  Monday: {
    focus: "Fat loss and appetite control",
    entries: [
      { label: "Breakfast", time: "07:30", summary: "Greek yogurt, berries, chia, and boiled eggs" },
      { label: "Lunch", time: "13:00", summary: "Grilled chicken bowl with rice, greens, and cucumber" },
      { label: "Snack", time: "16:30", summary: "Apple, almonds, and water" },
      { label: "Dinner", time: "19:30", summary: "Baked fish, sweet potato, and steamed vegetables" },
    ],
  },
  Tuesday: {
    focus: "Strength day recovery",
    entries: [
      { label: "Breakfast", time: "07:00", summary: "Oats, whey, banana, and peanut butter" },
      { label: "Lunch", time: "12:30", summary: "Turkey wrap, salad, and yogurt" },
      { label: "Snack", time: "17:00", summary: "Low-fat cheese and crackers" },
      { label: "Dinner", time: "20:00", summary: "Beef stir-fry with vegetables and jasmine rice" },
    ],
  },
  Wednesday: {
    focus: "Lower-calorie rest day",
    entries: [
      { label: "Breakfast", time: "08:00", summary: "Omelette, avocado, and tomatoes" },
      { label: "Lunch", time: "13:00", summary: "Tuna salad with mixed greens and olive oil" },
      { label: "Snack", time: "15:30", summary: "Protein shake and strawberries" },
      { label: "Dinner", time: "19:00", summary: "Chicken soup with roasted vegetables" },
    ],
  },
  Thursday: {
    focus: "High-output coaching day",
    entries: [
      { label: "Breakfast", time: "07:15", summary: "Smoothie with oats, banana, and spinach" },
      { label: "Lunch", time: "13:15", summary: "Chicken pasta with greens" },
      { label: "Snack", time: "17:30", summary: "Boiled eggs and fruit" },
      { label: "Dinner", time: "20:15", summary: "Shrimp couscous and green beans" },
    ],
  },
  Friday: {
    focus: "Balanced day with one planned treat",
    entries: [
      { label: "Breakfast", time: "07:30", summary: "Scrambled eggs, toast, and mixed fruit" },
      { label: "Lunch", time: "13:00", summary: "Grilled chicken wrap with salad and yogurt dip" },
      { label: "Snack", time: "16:30", summary: "Planned treat and hydration check-in" },
      { label: "Dinner", time: "19:30", summary: "Salmon, potatoes, and roasted vegetables" },
    ],
  },
  Saturday: {
    focus: "Social day with structure",
    entries: [
      { label: "Breakfast", time: "08:30", summary: "Protein pancakes with berries" },
      { label: "Lunch", time: "13:30", summary: "Rice bowl with lean beef and vegetables" },
      { label: "Snack", time: "16:00", summary: "Greek yogurt and nuts" },
      { label: "Dinner", time: "20:00", summary: "Chicken skewers, flatbread, and salad" },
    ],
  },
  Sunday: {
    focus: "Reset and prep for the next week",
    entries: [
      { label: "Breakfast", time: "08:30", summary: "Oats, banana, and boiled eggs" },
      { label: "Lunch", time: "13:00", summary: "Chicken soup with bread and side salad" },
      { label: "Snack", time: "16:00", summary: "Apple slices with peanut butter" },
      { label: "Dinner", time: "19:00", summary: "Turkey meatballs with rice and vegetables" },
    ],
  },
};

export function FithubWorkspace({ section }: { section: Section }) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnToCurrentPage = `${pathname}${searchParams.toString() ? `?${searchParams.toString()}` : ""}`;
  const [isPending, startTransition] = useTransition();
  const [token, setToken] = useState<string | null>(() => (typeof window !== "undefined" ? window.localStorage.getItem(tokenStorageKey) : null));
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [groupFitnessTeams, setGroupFitnessTeams] = useState<GroupFitnessTeam[]>([]);
  const [groupFitnessPrograms, setGroupFitnessPrograms] = useState<GroupFitnessProgram[]>([]);
  const [shops, setShops] = useState<Shop[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [trainerBookings, setTrainerBookings] = useState<Booking[]>([]);
  const [shopBookings, setShopBookings] = useState<Booking[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [mealProgressEntries, setMealProgressEntries] = useState<MealProgressEntry[]>([]);
  const [bodyMeasurements, setBodyMeasurements] = useState<BodyMeasurementEntry[]>([]);
  const [trainerMealProgressByUser, setTrainerMealProgressByUser] = useState<Record<string, MealProgressEntry[]>>({});
  const [trainerBodyMeasurementsByUser, setTrainerBodyMeasurementsByUser] = useState<Record<string, BodyMeasurementEntry[]>>({});
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [adminDashboard, setAdminDashboard] = useState<AdminDashboard | null>(null);
  const [registerForm, setRegisterForm] = useState<RegisterFormState>(emptyRegisterForm);
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [trainerForm, setTrainerForm] = useState({ specialties: "fitness, mobility", experienceYears: "3", bio: "", headline: "", coachingStyle: "", certifications: "", achievements: "" });
  const [shopForm, setShopForm] = useState({
    shopName: "",
    categories: "fitness gear, recovery",
    location: "",
    description: "",
    logoUrl: "",
    websiteLink: "",
    peakHoursBusy: "",
    peakHoursQuiet: "",
    peakHoursNotes: "",
  });
  const [serviceForm, setServiceForm] = useState({ category: "fitness", type: "PT", title: "", description: "", audience: "all" as "all" | "ladies", price: "", city: "Male", venueName: "", linkedShopId: "", supportsInPerson: true, supportsOnline: false, onlineLabel: "", outdoorLocations: "", day: "Monday", startTime: "07:00", endTime: "08:00", capacity: "1" });
  const [productForm, setProductForm] = useState({ name: "", price: "", description: "", externalLink: "" });
  const [bookingForm, setBookingForm] = useState({ serviceId: "", bookingDate: "", timeSlot: "07:00-08:00", sessionMode: "" as "" | TrainingDeliveryMode, sessionLocation: "", paymentMethod: "card" as "cash" | "card" | "bank_transfer" | "wallet" | "apple_pay" | "google_pay", paymentReference: "" });
  const [discoverQuery, setDiscoverQuery] = useState("");
  const [discoverScope, setDiscoverScope] = useState<"all" | "trainers" | "services" | "shops">("all");
  const [discoverView, setDiscoverView] = useState<"overview" | "gyms" | "pt" | "group" | "shops">(() => {
    const requestedView = searchParams.get("view");
    return requestedView === "gyms" || requestedView === "pt" || requestedView === "group" || requestedView === "shops" || requestedView === "overview"
      ? requestedView
      : "overview";
  });
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
  const [selectedTrainerId, setSelectedTrainerId] = useState<string | null>(null);
  const [selectedShopId, setSelectedShopId] = useState<string | null>(null);
  const [selectedGroupTeamId, setSelectedGroupTeamId] = useState("");
  const [selectedGroupProgramId, setSelectedGroupProgramId] = useState<string | null>(null);
  const [waitlistedProgramIds, setWaitlistedProgramIds] = useState<string[]>([]);
  const [savedItems, setSavedItems] = useState<SavedItem[]>([]);
  const [expandedDiscoverPanels, setExpandedDiscoverPanels] = useState<Record<DiscoverPanelKey, boolean>>({
    groupSchedule: true,
    ptDelivery: true,
    ptSlots: true,
    gymSetup: true,
    gymSlots: true,
  });
  const [activeWorkspaceView, setWorkspaceView] = useState<WorkspaceView>("all");
  const [activeWorkspaceModal, setActiveWorkspaceModal] = useState<WorkspaceModalKey>(null);
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [trainerBookingDraft, setTrainerBookingDraft] = useState<TrainerBookingDraft | null>(null);
  const [selectedTrainerClientId, setSelectedTrainerClientId] = useState<string | null>(null);
  const [trainerMeasurementDraft, setTrainerMeasurementDraft] = useState<TrainerMeasurementDraft>(emptyTrainerMeasurementDraft);
  const [isTrainerMeasurementModalOpen, setIsTrainerMeasurementModalOpen] = useState(false);
  const [memberMeasurementDraft, setMemberMeasurementDraft] = useState<TrainerMeasurementDraft>(emptyTrainerMeasurementDraft);
  const [isMemberMeasurementModalOpen, setIsMemberMeasurementModalOpen] = useState(false);
  const [memberRescheduleDraft, setMemberRescheduleDraft] = useState<MemberRescheduleDraft | null>(null);
  const [memberRescheduleChoice, setMemberRescheduleChoice] = useState<Record<string, string>>({});
  const [selectedMemberBookingId, setSelectedMemberBookingId] = useState<string | null>(null);
  const [showMemberBookingHistory, setShowMemberBookingHistory] = useState(false);
  const [isPtPortfolioOpen, setIsPtPortfolioOpen] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState("");
  const [isWorking, setIsWorking] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalView, setAuthModalView] = useState<AuthModalView>("login");
  const [isQuickActionsOpen, setIsQuickActionsOpen] = useState(false);
  const [quickActionQuery, setQuickActionQuery] = useState("");
  const [dashboardLayout, setDashboardLayout] = useState<"stacked" | "side-by-side">("stacked");
  const [homeRoleView, setHomeRoleView] = useState<"trainer" | "member">("member");
  const [ratingSummaries, setRatingSummaries] = useState<Record<string, RatingSummary>>({});
  const [ratingModal, setRatingModal] = useState<RatingModal | null>(null);
  const [ratingForm, setRatingForm] = useState({ score: 0, comment: "" });
  const [ratingSubmitting, setRatingSubmitting] = useState(false);
  const [alreadyRatedIds, setAlreadyRatedIds] = useState<Set<string>>(new Set());
  const quickActionInputRef = useRef<HTMLInputElement | null>(null);
  const seenNotificationIdsRef = useRef<Set<string>>(new Set());
  const activeNotificationUserIdRef = useRef<string | null>(null);
  const gymDiscoverRef = useRef<HTMLDivElement | null>(null);
  const trainingDiscoverRef = useRef<HTMLDivElement | null>(null);
  const normalizedDiscoverQuery = discoverQuery.trim().toLowerCase();
  const sessionToken = token;
  const isTrainingView = discoverView === "pt" || discoverView === "group";
  const trainingView = discoverView === "group" ? "group" : "pt";
  const activeSectionMeta = sectionMeta[section];
  const activeHeaderKey = section === "home"
    ? "home"
    : section === "discover"
      ? discoverView === "gyms"
        ? "gyms"
        : discoverView === "pt"
          ? "pt"
          : discoverView === "group"
            ? "group"
            : null
      : "profile";
  const todayLabel = new Intl.DateTimeFormat("en-US", { weekday: "long" }).format(new Date());
  const todayMealPlan = dashboardMealPlans[todayLabel] ?? dashboardMealPlans.Monday;

  useEffect(() => {
    const requestedView = searchParams.get("view");
    if (section !== "discover") {
      setDiscoverView("overview");
      return;
    }

    if (requestedView === "gyms" || requestedView === "pt" || requestedView === "group" || requestedView === "shops" || requestedView === "overview") {
      setDiscoverView(requestedView);
      return;
    }

    setDiscoverView("overview");
  }, [searchParams, section]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    if (token) {
      window.localStorage.setItem(tokenStorageKey, token);
      return;
    }

    window.localStorage.removeItem(tokenStorageKey);
  }, [token]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(savedItemsStorageKey, JSON.stringify(savedItems));
  }, [savedItems]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const saved = window.localStorage.getItem(savedItemsStorageKey);
    if (!saved) {
      return;
    }

    try {
      const parsed = JSON.parse(saved) as SavedItem[];
      if (Array.isArray(parsed)) {
        setSavedItems(parsed);
      }
    } catch {
      window.localStorage.removeItem(savedItemsStorageKey);
    }
  }, []);
  const overviewCards = [
    {
      href: "/discover?view=pt",
      title: "Personal training",
      description: "Find coaches and request sessions from one place.",
      accent: "from-[#123322]/88 via-[#1f4e34]/80 to-[#2e6b48]/72",
      image: true,
    },
    {
      href: "/discover?view=gyms",
      title: "Gyms",
      description: "Browse venues first, then open the offers attached to each place.",
      accent: "bg-[linear-gradient(145deg,_rgba(215,255,63,0.26),_rgba(255,255,255,0.85))]",
    },
    {
      href: "/discover?view=group",
      title: "Group fitness",
      description: "Jump straight into fixed-duration programs and activate a cohort from this tab.",
      accent: "bg-white",
    },
  ] as const;
  const upcomingOverviewCards = [
    { title: "Meal plans", href: "/meal-plans", enabled: true },
    { title: "Body measurements", enabled: false },
    { title: "Shops", enabled: false },
    { title: "Profile", enabled: false },
    { title: "Reports", enabled: false },
    { title: "Subscriptions", enabled: false },
  ] as const;

  const matchesDiscoverQuery = useCallback(
    (values: Array<string | undefined>) => {
      if (!normalizedDiscoverQuery) {
        return true;
      }

      return values.some((value) => value?.toLowerCase().includes(normalizedDiscoverQuery));
    },
    [normalizedDiscoverQuery]
  );
  const filteredTrainers = useMemo(
    () => trainers.filter((trainer) => matchesDiscoverQuery([trainer.userId?.name, trainer.userId?.email, trainer.specialties.join(" "), trainer.bio])),
    [matchesDiscoverQuery, trainers]
  );
  const filteredServices = useMemo(
    () => services.filter((service) => matchesDiscoverQuery([service.title, service.category, service.type, service.description, service.location?.city, service.trainerId?.userId?.name])),
    [matchesDiscoverQuery, services]
  );
  const filteredShops = useMemo(
    () => shops.filter((shop) => matchesDiscoverQuery([shop.shopName, shop.categories.join(" "), shop.location, shop.description])),
    [matchesDiscoverQuery, shops]
  );
  const filteredGroupFitnessTeams = useMemo(
    () => groupFitnessTeams.filter((team) => {
      const relatedPrograms = groupFitnessPrograms.filter((program) => program.teamId === team._id);
      return matchesDiscoverQuery([team.name, team.location, team.focus, team.description, ...relatedPrograms.flatMap((program) => [program.title, program.subtitle, program.description])]);
    }),
    [groupFitnessPrograms, groupFitnessTeams, matchesDiscoverQuery]
  );
  const showTrainerResults = discoverScope === "all" || discoverScope === "trainers";
  const showServiceResults = discoverScope === "all" || discoverScope === "services";
  const showShopResults = discoverScope === "all" || discoverScope === "shops";
  const discoverResultCount = (showTrainerResults ? filteredTrainers.length : 0) + (showServiceResults ? filteredServices.length : 0) + (showShopResults ? filteredShops.length : 0);
  const activeServices = useMemo(() => filteredServices.filter((service) => service.isActive !== false), [filteredServices]);
  const ptServices = useMemo(() => activeServices.filter((service) => /pt|personal|online|private/i.test(`${service.type} ${service.category} ${service.title} ${service.description ?? ""}`)), [activeServices]);
  const matchesVenueService = useCallback(
    (service: Service, shop: Shop | null) => {
      if (!shop) {
        return false;
      }

      const venueName = normalizeMatchValue(service.location?.name);
      const venueCity = normalizeMatchValue(service.location?.city);
      const shopName = normalizeMatchValue(shop.shopName);
      const shopLocation = normalizeMatchValue(shop.location);
      const description = normalizeMatchValue(service.description);

      return service.shopId?._id === shop._id
        || venueName === shopName
        || venueName.includes(shopName)
        || shopName.includes(venueName)
        || (Boolean(shopLocation) && venueCity === shopLocation)
        || description.includes(shopName);
    },
    []
  );
  const getBookableDeliveryOptions = useCallback((service: Service): ServiceDeliveryOption[] => {
    if (Array.isArray(service.deliveryOptions) && service.deliveryOptions.length > 0) {
      return service.deliveryOptions;
    }

    const fallbackLabel = service.location?.name ?? service.location?.city ?? "In-person location";
    return [{ mode: "in_person" as TrainingDeliveryMode, label: fallbackLabel }];
  }, []);
  const gymShops = useMemo(
    () => filteredShops.filter((shop) => /gym|studio|club|wellness|fitness center|fitness centre/i.test(`${shop.shopName} ${shop.description ?? ""} ${shop.location ?? ""}`) || shop.categories.some((category) => /gym|studio|club|wellness|membership|venue/i.test(category))),
    [filteredShops]
  );
  const gymServices = useMemo(
    () => activeServices.filter((service) => {
      const content = `${service.category} ${service.type} ${service.title} ${service.description ?? ""} ${service.location?.name ?? ""}`.toLowerCase();
      const isGymOffer = /gym|studio|membership|club|access|day pass|monthly/i.test(content);
      const isPtOffer = /pt|personal|online|private/i.test(content);
      return isGymOffer && !isPtOffer;
    }),
    [activeServices]
  );
  const groupPrograms = useMemo(
    () => groupFitnessPrograms.map((program) => ({
      ...program,
      timeSlot: `${program.startTime}-${program.endTime}`,
    })),
    [groupFitnessPrograms]
  );
  const selectedGroupTeam = useMemo(
    () => filteredGroupFitnessTeams.find((team) => team._id === selectedGroupTeamId) ?? null,
    [filteredGroupFitnessTeams, selectedGroupTeamId]
  );
  const selectedGroupPrograms = useMemo(
    () => groupPrograms.filter((program) => program.teamId === selectedGroupTeam?._id),
    [groupPrograms, selectedGroupTeam?._id]
  );
  const selectedGroupProgram = useMemo(
    () => selectedGroupPrograms.find((program) => program._id === selectedGroupProgramId) ?? null,
    [selectedGroupProgramId, selectedGroupPrograms]
  );
  const ptTrainers = useMemo(
    () => filteredTrainers.filter((trainer) => ptServices.some((service) => service.trainerId?._id === trainer._id)),
    [filteredTrainers, ptServices]
  );
  const trainerVenueLinks = useMemo(() => {
    const links = new Map<string, TrainerVenueLink[]>();

    trainers.forEach((trainer) => {
      const trainerServices = activeServices.filter((service) => service.trainerId?._id === trainer._id);
      const trainerGymLinks = gymShops.flatMap((shop) => {
        const venueServices = trainerServices.filter((service) => matchesVenueService(service, shop));

        if (venueServices.length === 0) {
          return [];
        }

        return [{ shop, services: venueServices }];
      });

      links.set(trainer._id, trainerGymLinks);
    });

    return links;
  }, [activeServices, gymShops, matchesVenueService, trainers]);
  const selectedPtTrainer = useMemo(
    () => ptTrainers.find((trainer) => trainer._id === selectedTrainerId) ?? null,
    [ptTrainers, selectedTrainerId]
  );
  const selectedPtTrainerGyms = useMemo(
    () => selectedPtTrainer ? trainerVenueLinks.get(selectedPtTrainer._id) ?? [] : [],
    [selectedPtTrainer, trainerVenueLinks]
  );
  const selectedPtTrainerServices = useMemo(
    () => selectedPtTrainer ? ptServices.filter((service) => service.trainerId?._id === selectedPtTrainer._id) : [],
    [ptServices, selectedPtTrainer]
  );
  const selectedPtDetailService = useMemo(
    () => selectedPtTrainerServices.find((service) => service._id === selectedServiceId) ?? null,
    [selectedPtTrainerServices, selectedServiceId]
  );
  const selectedPtDeliveryOptions = useMemo(
    () => selectedPtDetailService ? getBookableDeliveryOptions(selectedPtDetailService) : [],
    [getBookableDeliveryOptions, selectedPtDetailService]
  );
  const selectedShop = useMemo(() => filteredShops.find((shop) => shop._id === selectedShopId) ?? filteredShops[0] ?? null, [filteredShops, selectedShopId]);
  const selectedGymShop = useMemo(() => gymShops.find((shop) => shop._id === selectedShopId) ?? null, [gymShops, selectedShopId]);
  const selectedGymVenueServices = useMemo(
    () => selectedGymShop ? gymServices.filter((service) => matchesVenueService(service, selectedGymShop)) : [],
    [gymServices, matchesVenueService, selectedGymShop]
  );
  const selectedGymTrainerServicesCatalog = useMemo(
    () => selectedGymShop
      ? activeServices.filter((service) => service.trainerId?._id && !isMembershipOffer(service) && matchesVenueService(service, selectedGymShop))
      : [],
    [activeServices, matchesVenueService, selectedGymShop]
  );
  const selectedGymTrainers = useMemo(
    () => selectedGymShop
      ? filteredTrainers.filter((trainer) => selectedGymTrainerServicesCatalog.some((service) => service.trainerId?._id === trainer._id))
      : [],
    [filteredTrainers, selectedGymShop, selectedGymTrainerServicesCatalog]
  );
  const selectedGymTrainer = useMemo(
    () => selectedGymTrainers.find((trainer) => trainer._id === selectedTrainerId) ?? null,
    [selectedGymTrainers, selectedTrainerId]
  );
  const selectedGymTrainerServices = useMemo(
    () => selectedGymTrainer ? selectedGymTrainerServicesCatalog.filter((service) => service.trainerId?._id === selectedGymTrainer._id) : [],
    [selectedGymTrainer, selectedGymTrainerServicesCatalog]
  );
  const selectedGymMembershipServices = useMemo(
    () => selectedGymVenueServices.filter((service) => isMembershipOffer(service)),
    [selectedGymVenueServices]
  );
  const selectedGymClassServices = useMemo(
    () => selectedGymVenueServices.filter((service) => !isMembershipOffer(service) && isClassOffer(service)),
    [selectedGymVenueServices]
  );
  const selectedGymOtherServices = useMemo(
    () => selectedGymVenueServices.filter((service) => !isMembershipOffer(service) && !isClassOffer(service)).slice(0, 4),
    [selectedGymVenueServices]
  );
  const selectedGymDetailService = useMemo(
    () => selectedGymVenueServices.find((service) => service._id === selectedServiceId) ?? null,
    [selectedGymVenueServices, selectedServiceId]
  );
  const selectedGymTrainerDetailService = useMemo(
    () => selectedGymTrainerServices.find((service) => service._id === selectedServiceId) ?? null,
    [selectedGymTrainerServices, selectedServiceId]
  );
  const selectedGymActiveService = selectedGymDetailService ?? selectedGymTrainerDetailService;
  const selectedGymDeliveryOptions = useMemo(
    () => selectedGymActiveService ? getBookableDeliveryOptions(selectedGymActiveService) : [],
    [getBookableDeliveryOptions, selectedGymActiveService]
  );
  const selectedListedGymOption = serviceForm.linkedShopId;
  const applyBookableServiceSlot = useCallback((service: Service, slot: ServiceScheduleSlot) => {
    const deliveryOptions = getBookableDeliveryOptions(service);
    const preferredOption = deliveryOptions[0];
    setBookingForm((current) => ({
      ...current,
      serviceId: service._id,
      bookingDate: getNextSessionDate(slot),
      timeSlot: `${slot.startTime}-${slot.endTime}`,
      sessionMode: preferredOption?.mode ?? current.sessionMode,
      sessionLocation: preferredOption?.label ?? current.sessionLocation,
    }));
  }, [getBookableDeliveryOptions]);
  const getAudienceBadge = useCallback((service: Service) => service.audience === "ladies" ? "Ladies hour" : null, []);
  const selectedGroupWaitlisted = selectedGroupProgram ? waitlistedProgramIds.includes(selectedGroupProgram._id) : false;

  const ownedTrainer = useMemo(
    () => trainers.find((trainer) => trainer.userId?._id === currentUser?._id),
    [currentUser?._id, trainers]
  );
  const ownedShop = useMemo(
    () => shops.find((shop) => shop.ownerId?._id === currentUser?._id),
    [currentUser?._id, shops]
  );
  const ownedServices = useMemo(
    () => services.filter((service) => service.trainerId?._id === ownedTrainer?._id),
    [ownedTrainer?._id, services]
  );
  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) {
        return;
      }

      if (discoverView === "gyms" && selectedGymShop && gymDiscoverRef.current && !gymDiscoverRef.current.contains(target)) {
        setSelectedShopId(null);
        setSelectedTrainerId(null);
        setSelectedServiceId(null);
      }

      if ((discoverView === "pt" || discoverView === "group") && trainingDiscoverRef.current && !trainingDiscoverRef.current.contains(target)) {
        if (trainingView === "group" && selectedGroupTeam) {
          setSelectedGroupTeamId("");
          setSelectedGroupProgramId(null);
        }

        if (trainingView === "pt" && selectedPtTrainer) {
          setSelectedTrainerId(null);
          setSelectedServiceId(null);
        }
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [discoverView, selectedGymShop, selectedGroupTeam, selectedPtTrainer, trainingView]);

  const isAdmin = currentUser?.roles.includes("admin") ?? false;
  const hasTrainerAccess = Boolean(ownedTrainer || currentUser?.roles.includes("trainer"));
  const hasShopAccess = Boolean(ownedShop || currentUser?.roles.includes("shop"));
  const showMemberTools = Boolean(currentUser);
  const showTrainerTools = Boolean(currentUser && (hasTrainerAccess || isAdmin));
  const showShopTools = Boolean(currentUser && (hasShopAccess || isAdmin));
  const canToggleHomeRole = Boolean(currentUser && hasTrainerAccess && !isAdmin);
  const homeShowsTrainerView = showTrainerTools && (!canToggleHomeRole || homeRoleView === "trainer");
  const homeShowsMemberView = !isAdmin && showMemberTools && !showShopTools && (!showTrainerTools || (canToggleHomeRole && homeRoleView === "member"));
  const defaultWorkspaceView: WorkspaceView = !currentUser
    ? "all"
    : showTrainerTools && !showShopTools && !isAdmin
      ? "trainer"
      : showShopTools && !showTrainerTools && !isAdmin
        ? "shop"
        : isAdmin && !showTrainerTools && !showShopTools
          ? "admin"
          : "all";
  const roleLabel = isAdmin ? "Admin" : hasTrainerAccess ? "Trainer" : hasShopAccess ? "Gym owner" : currentUser ? "Member" : "Guest";
          const currentUserName = currentUser?.name ?? "Guest";
          const currentUserEmail = currentUser?.email ?? "";

  useEffect(() => {
    if (canToggleHomeRole) {
      setHomeRoleView("trainer");
      return;
    }

    setHomeRoleView("member");
  }, [canToggleHomeRole, currentUser?._id]);
  const homeMeta = currentUser
    ? {
        eyebrow: "Home",
        title: `${currentUser.name.split(" ")[0] || currentUser.name}, here’s your day`,
        description: `Track ${roleLabel.toLowerCase()} priorities, meals, sessions, access, and the next actions without leaving the dashboard.`,
      }
    : {
        eyebrow: "Welcome",
        title: "Fithub overview",
        description: "Gyms, trainers, classes, and bookings in one place.",
      };
  const resolvedSectionMeta = section === "home" ? homeMeta : activeSectionMeta;
  const todayStart = useMemo(() => {
    const value = new Date();
    value.setHours(0, 0, 0, 0);
    return value;
  }, []);
  const upcomingMemberBookings = useMemo(
    () => bookings
      .filter((booking) => new Date(booking.bookingDate) >= todayStart && booking.status !== "cancelled")
      .sort((left, right) => new Date(left.bookingDate).getTime() - new Date(right.bookingDate).getTime()),
    [bookings, todayStart]
  );
  const upcomingTrainerSessions = useMemo(
    () => trainerBookings
      .filter((booking) => new Date(booking.bookingDate) >= todayStart && booking.status !== "cancelled")
      .sort((left, right) => new Date(left.bookingDate).getTime() - new Date(right.bookingDate).getTime()),
    [todayStart, trainerBookings]
  );
  const ownedShopVenueServices = useMemo(
    () => !ownedShop ? [] : activeServices.filter((service) => matchesVenueService(service, ownedShop)),
    [activeServices, matchesVenueService, ownedShop]
  );
  const todayVenueHours = useMemo(
    () => ownedShopVenueServices.flatMap((service) => (service.schedule ?? [])
      .filter((slot) => slot.day === todayLabel)
      .map((slot) => ({
        serviceId: service._id,
        title: service.title,
        type: service.type,
        slot,
        audience: service.audience,
      }))),
    [ownedShopVenueServices, todayLabel]
  );
  const todaysTrainerServiceSlots = useMemo(
    () => ownedServices.flatMap((service) => (service.schedule ?? [])
      .filter((slot) => slot.day === todayLabel)
      .map((slot) => ({
        serviceId: service._id,
        title: service.title,
        type: service.type,
        slot,
      }))),
    [ownedServices, todayLabel]
  );
  const spotlightTrainer = useMemo(() => {
    if (ownedTrainer) {
      return ownedTrainer;
    }

    const trainerId = upcomingMemberBookings[0]?.trainerId?._id;
    return trainerId ? trainers.find((trainer) => trainer._id === trainerId) ?? null : null;
  }, [ownedTrainer, trainers, upcomingMemberBookings]);
  const latestMemberBooking = useMemo(
    () => upcomingMemberBookings[0] ?? bookings.slice().sort((left, right) => new Date(right.bookingDate).getTime() - new Date(left.bookingDate).getTime())[0] ?? null,
    [bookings, upcomingMemberBookings]
  );
  const nextMemberSession = useMemo(
    () => upcomingMemberBookings.find((booking) => booking.status === "accepted" && isReschedulableBooking(booking)) ?? upcomingMemberBookings.find((booking) => booking.status === "accepted") ?? upcomingMemberBookings[0] ?? null,
    [upcomingMemberBookings]
  );
  const nextMemberSessionLabel = useMemo(
    () => (nextMemberSession ? formatBookingDateTime(nextMemberSession) : null),
    [nextMemberSession]
  );
  const nextMemberSessionDetails = useMemo(() => {
    if (!nextMemberSession) {
      return null;
    }

    const linkedService = activeServices.find((service) => service._id === nextMemberSession.serviceId?._id);
    return {
      title: nextMemberSession.serviceId?.title ?? "Class / training",
      time: formatBookingDateTime(nextMemberSession),
      trainer: nextMemberSession.trainerId?.userId?.name ?? linkedService?.trainerId?.userId?.name ?? "TBD",
      venue: nextMemberSession.sessionLocation ?? linkedService?.location?.name ?? linkedService?.shopId?.shopName ?? "Venue TBA",
      status: nextMemberSession.status,
    };
  }, [activeServices, nextMemberSession]);
  const selectedMemberBooking = useMemo(() => {
    if (selectedMemberBookingId) {
      const selected = bookings.find((booking) => booking._id === selectedMemberBookingId);
      if (selected) {
        return selected;
      }
    }

    return nextMemberSession ?? upcomingMemberBookings[0] ?? bookings[0] ?? null;
  }, [bookings, nextMemberSession, selectedMemberBookingId, upcomingMemberBookings]);
  const completedMemberBookings = useMemo(
    () => upcomingMemberBookings.filter((booking) => booking.status === "completed"),
    [upcomingMemberBookings]
  );
  const todayIsoDate = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const mealProgressSummary = useMemo(() => {
    const followed = mealProgressEntries.filter((item) => item.status === "followed").length;
    const partial = mealProgressEntries.filter((item) => item.status === "partial").length;
    const missed = mealProgressEntries.filter((item) => item.status === "missed").length;
    const today = mealProgressEntries.find((item) => item.date === todayIsoDate) ?? null;
    return {
      followed,
      partial,
      missed,
      today,
    };
  }, [mealProgressEntries, todayIsoDate]);
  const todayCompletedMealLabels = useMemo(() => {
    const note = mealProgressSummary.today?.note ?? "";
    if (!note.startsWith("completed:")) {
      return [] as string[];
    }

    const validLabels = new Set(todayMealPlan.entries.map((entry) => entry.label));
    return Array.from(new Set(note
      .slice("completed:".length)
      .split("|")
      .map((item) => item.trim())
      .filter((item) => item.length > 0 && validLabels.has(item))));
  }, [mealProgressSummary.today?.note, todayMealPlan.entries]);
  const memberAttendanceSummary = useMemo(() => ({
    missed: bookings.filter((booking) => booking.attendanceStatus === "missed").length,
    rescheduleRequests: bookings.filter((booking) => ["requested_by_client", "counter_proposed_by_host", "counter_proposed_by_client"].includes(booking.rescheduleStatus ?? "none")).length,
  }), [bookings]);
  const pendingTrainerApprovals = useMemo(
    () => trainerBookings.filter((booking) => booking.status === "requested").length,
    [trainerBookings]
  );
  const pendingShopApprovals = useMemo(
    () => shopBookings.filter((booking) => booking.status === "requested").length,
    [shopBookings]
  );
  const roleNowPanel = useMemo(() => {
    if (!currentUser) {
      return {
        title: "Now",
        ctaHref: "/",
        ctaLabel: "Login",
        highlights: [
          { label: "Trainers", value: String(trainers.length), note: "Browse coaches" },
          { label: "Gyms", value: String(gymShops.length), note: "Compare venues" },
          { label: "Programs", value: String(groupFitnessPrograms.length), note: "Join a group" },
        ],
      };
    }

    if (isAdmin) {
      return {
        title: "Now: Admin operations",
        ctaHref: "/manage",
        ctaLabel: "Open admin",
        highlights: [
          { label: "Bookings", value: String(adminDashboard?.metrics.bookings ?? 0), note: "Platform total" },
          { label: "Users", value: String(adminDashboard?.metrics.users ?? 0), note: "Active accounts" },
          { label: "Services", value: String(adminDashboard?.metrics.services ?? 0), note: "Live listings" },
        ],
      };
    }

    if (homeShowsTrainerView) {
      const trainerClientCount = new Set(trainerBookings.map((booking) => booking.userId?._id).filter(Boolean) as string[]).size;
      return {
        title: "Now: Trainer workflow",
        ctaHref: "/manage",
        ctaLabel: "Open trainer",
        highlights: [
          { label: "Upcoming", value: String(upcomingTrainerSessions.length), note: "Sessions queued" },
          { label: "Needs approval", value: String(pendingTrainerApprovals), note: "Requests waiting" },
          { label: "Clients", value: String(trainerClientCount), note: "Active roster" },
        ],
      };
    }

    if (showShopTools) {
      return {
        title: "Now: Venue workflow",
        ctaHref: "/manage",
        ctaLabel: "Open venue",
        highlights: [
          { label: "Hours today", value: String(todayVenueHours.length), note: "Published blocks" },
          { label: "Needs approval", value: String(pendingShopApprovals), note: "Requests waiting" },
          { label: "Offers", value: String(ownedShopVenueServices.length), note: "Live catalog" },
        ],
      };
    }

    return {
      title: "Now: Member plan",
      ctaHref: "/",
      ctaLabel: "Open dashboard",
      highlights: [
        { label: "Next session", value: nextMemberSessionLabel ? "Ready" : "None", note: nextMemberSessionLabel ?? "Book a session" },
        { label: "Meal status", value: mealProgressSummary.today?.status ?? "pending", note: "Today's check" },
        { label: "Reschedules", value: String(memberAttendanceSummary.rescheduleRequests), note: "Open threads" },
      ],
    };
  }, [
    adminDashboard?.metrics.bookings,
    adminDashboard?.metrics.services,
    adminDashboard?.metrics.users,
    currentUser,
    gymShops.length,
    groupFitnessPrograms.length,
    isAdmin,
    mealProgressSummary.today?.status,
    memberAttendanceSummary.rescheduleRequests,
    nextMemberSessionLabel,
    ownedShopVenueServices.length,
    pendingShopApprovals,
    pendingTrainerApprovals,
    homeShowsTrainerView,
    showShopTools,
    todayVenueHours.length,
    trainerBookings,
    trainers.length,
    upcomingTrainerSessions.length,
  ]);
  const trainerClientInsights = useMemo(() => {
    const grouped = new Map<string, { missedSessions: number; rescheduleRequests: number }>();
    trainerBookings.forEach((booking) => {
      const clientId = booking.userId?._id;
      if (!clientId) {
        return;
      }

      const current = grouped.get(clientId) ?? { missedSessions: 0, rescheduleRequests: 0 };
      if (booking.attendanceStatus === "missed") {
        current.missedSessions += 1;
      }
      if (["requested_by_client", "counter_proposed_by_host", "counter_proposed_by_client"].includes(booking.rescheduleStatus ?? "none")) {
        current.rescheduleRequests += 1;
      }
      grouped.set(clientId, current);
    });

    const result: Record<string, { missedSessions: number; rescheduleRequests: number; mealsFollowed: number; mealsPartial: number; mealsMissed: number }> = {};
    grouped.forEach((counts, userId) => {
      const entries = trainerMealProgressByUser[userId] ?? [];
      result[userId] = {
        ...counts,
        mealsFollowed: entries.filter((item) => item.status === "followed").length,
        mealsPartial: entries.filter((item) => item.status === "partial").length,
        mealsMissed: entries.filter((item) => item.status === "missed").length,
      };
    });

    return result;
  }, [trainerBookings, trainerMealProgressByUser]);
  const trainerClientPrograms = useMemo(() => {
    const ptPrograms = new Map<string, { key: string; label: string; sublabel: string; members: Map<string, { id: string; name: string; email: string; nextSession: string | null; totalSessions: number }> }>();
    const groupPrograms = new Map<string, { key: string; label: string; sublabel: string; members: Map<string, { id: string; name: string; email: string; nextSession: string | null; totalSessions: number }> }>();

    trainerBookings.forEach((booking) => {
      const clientId = booking.userId?._id;
      if (!clientId) {
        return;
      }

      const bucket = isGroupFitnessBooking(booking) && !isPersonalTrainingBooking(booking) ? groupPrograms : ptPrograms;
      const programKey = booking.groupProgramId?._id ?? booking.serviceId?._id ?? `${booking.serviceId?.title ?? "program"}-${bucket === groupPrograms ? "group" : "pt"}`;
      const label = booking.groupProgramId?.title ?? booking.serviceId?.title ?? (bucket === groupPrograms ? "Group fitness" : "Personal training");
      const sublabel = booking.groupProgramId?.teamId?.name ?? booking.serviceId?.type ?? booking.serviceId?.category ?? "Assigned clients";
      const program = bucket.get(programKey) ?? { key: programKey, label, sublabel, members: new Map() };
      const existingMember = program.members.get(clientId);

      program.members.set(clientId, {
        id: clientId,
        name: booking.userId?.name ?? booking.userId?.email ?? "Member",
        email: booking.userId?.email ?? "",
        nextSession: existingMember?.nextSession ?? formatBookingDateTime(booking),
        totalSessions: (existingMember?.totalSessions ?? 0) + 1,
      });

      bucket.set(programKey, program);
    });

    const toList = (source: typeof ptPrograms) => Array.from(source.values())
      .map((program) => ({
        ...program,
        members: Array.from(program.members.values()).sort((left, right) => left.name.localeCompare(right.name)),
      }))
      .sort((left, right) => right.members.length - left.members.length || left.label.localeCompare(right.label));

    return {
      ptPrograms: toList(ptPrograms),
      groupPrograms: toList(groupPrograms),
    };
  }, [trainerBookings]);
  const selectedTrainerClientBookings = useMemo(
    () => trainerBookings.filter((booking) => booking.userId?._id === selectedTrainerClientId),
    [selectedTrainerClientId, trainerBookings]
  );
  const selectedTrainerClient = selectedTrainerClientBookings[0]?.userId ?? null;
  const selectedTrainerClientMeals = selectedTrainerClientId ? trainerMealProgressByUser[selectedTrainerClientId] ?? [] : [];
  const selectedTrainerClientMeasurements = selectedTrainerClientId ? trainerBodyMeasurementsByUser[selectedTrainerClientId] ?? [] : [];
  const selectedTrainerClientAttendance = useMemo(() => {
    const attended = selectedTrainerClientBookings.filter((booking) => booking.attendanceStatus === "attended").length;
    const missed = selectedTrainerClientBookings.filter((booking) => booking.attendanceStatus === "missed").length;
    const excused = selectedTrainerClientBookings.filter((booking) => booking.attendanceStatus === "excused").length;
    const completed = attended + missed + excused;
    const rate = completed > 0 ? Math.round((attended / completed) * 100) : 0;
    return { attended, missed, excused, completed, rate };
  }, [selectedTrainerClientBookings]);
  const selectedTrainerClientMealSummary = useMemo(() => {
    const followed = selectedTrainerClientMeals.filter((item) => item.status === "followed").length;
    const partial = selectedTrainerClientMeals.filter((item) => item.status === "partial").length;
    const missed = selectedTrainerClientMeals.filter((item) => item.status === "missed").length;
    const total = followed + partial + missed;
    const adherence = total > 0 ? Math.round((followed / total) * 100) : 0;
    return { followed, partial, missed, total, adherence };
  }, [selectedTrainerClientMeals]);
  const selectedMeasurementSnapshot = useMemo(() => {
    const latest = selectedTrainerClientMeasurements[0] ?? null;
    const previous = selectedTrainerClientMeasurements[1] ?? null;
    return {
      latest,
      previous,
      weightChange: typeof latest?.weightKg === "number" && typeof previous?.weightKg === "number" ? latest.weightKg - previous.weightKg : null,
      waistChange: typeof latest?.waistCm === "number" && typeof previous?.waistCm === "number" ? latest.waistCm - previous.waistCm : null,
    };
  }, [selectedTrainerClientMeasurements]);
  const trainerClientSuggestions = useMemo(() => {
    if (!selectedTrainerClientId) {
      return [] as string[];
    }

    const suggestions: string[] = [];
    if (selectedTrainerClientMeasurements.length === 0) {
      suggestions.push("Log a baseline body measurement so weight, waist, and circumference changes can be tracked week to week.");
    }
    if (selectedTrainerClientMealSummary.total > 0 && selectedTrainerClientMealSummary.adherence < 60) {
      suggestions.push("Meal adherence is below 60%. Reduce nutrition complexity or tighten the check-in cadence before changing the training block.");
    }
    if (selectedTrainerClientAttendance.missed >= 2) {
      suggestions.push("Missed sessions are starting to stack up. Pre-book the next session and send a short reminder after each workout.");
    }
    if (selectedMeasurementSnapshot.waistChange !== null && selectedMeasurementSnapshot.waistChange > 0 && selectedTrainerClientMealSummary.missed > selectedTrainerClientMealSummary.followed) {
      suggestions.push("Waist trend is moving up while meals are being missed. Review weekend food decisions and sleep recovery before increasing training volume.");
    }
    if (suggestions.length === 0) {
      suggestions.push("This client looks stable. Keep weekly measurements and meal check-ins running so early regression shows up before attendance drops.");
    }

    return suggestions.slice(0, 3);
  }, [selectedMeasurementSnapshot.waistChange, selectedTrainerClientAttendance.missed, selectedTrainerClientId, selectedTrainerClientMealSummary.adherence, selectedTrainerClientMealSummary.followed, selectedTrainerClientMealSummary.missed, selectedTrainerClientMealSummary.total, selectedTrainerClientMeasurements.length]);
  const memberMeasurementSnapshot = useMemo(() => {
    const latest = bodyMeasurements[0] ?? null;
    const previous = bodyMeasurements[1] ?? null;
    return {
      latest,
      previous,
      weightChange: typeof latest?.weightKg === "number" && typeof previous?.weightKg === "number" ? latest.weightKg - previous.weightKg : null,
      waistChange: typeof latest?.waistCm === "number" && typeof previous?.waistCm === "number" ? latest.waistCm - previous.waistCm : null,
    };
  }, [bodyMeasurements]);
  const dashboardStats = currentUser
    ? [
        { label: "Role", value: roleLabel },
        { label: isAdmin ? "Platform bookings" : showTrainerTools ? "Upcoming sessions" : "Active bookings", value: String(isAdmin ? adminDashboard?.metrics.bookings ?? 0 : showTrainerTools ? upcomingTrainerSessions.length : upcomingMemberBookings.length).padStart(2, "0") },
        { label: "Meals today", value: String(todayMealPlan.entries.length).padStart(2, "0") },
        { label: isAdmin ? "Users" : hasShopAccess ? "Venue offers" : "Subscriptions", value: String(isAdmin ? adminDashboard?.metrics.users ?? 0 : hasShopAccess ? ownedShopVenueServices.length : bookings.filter((booking) => booking.paymentStatus === "paid").length).padStart(2, "0") },
      ]
    : [
        { label: "Meals today", value: String(todayMealPlan.entries.length).padStart(2, "0") },
        { label: "Booking paths", value: "03" },
        { label: "Gym views", value: String(gymShops.length).padStart(2, "0") },
        { label: "Live trainers", value: String(trainers.length).padStart(2, "0") },
      ];
  const stats = [
    { label: "Trainers", value: String(trainers.length).padStart(2, "0") },
    { label: "Services", value: String(services.length).padStart(2, "0") },
    { label: "Venues", value: String(shops.length).padStart(2, "0") },
  ];
  const memberSummary = [
    { label: "Bookings", value: String(upcomingMemberBookings.length).padStart(2, "0") },
    { label: "Trainer sessions", value: String(upcomingTrainerSessions.length).padStart(2, "0") },
    { label: "Venue hours", value: String(todayVenueHours.length).padStart(2, "0") },
  ];
  const workspacePanels = [
    { title: "Trainer tools", description: "Profiles, services, and session approvals.", accent: "border-black/6 bg-background", visible: showTrainerTools, view: "trainer" as WorkspaceView },
    { title: "Venue tools", description: "Products, memberships, classes, and booking requests.", accent: "border-black/6 bg-background", visible: showShopTools, view: "shop" as WorkspaceView },
    { title: "Admin tools", description: "Moderation and platform-level controls.", accent: "border-black/6 bg-background", visible: isAdmin, view: "admin" as WorkspaceView },
  ];
  const shouldShowOperatorWorkspace = section !== "home" || homeShowsTrainerView;
  const shouldShowMemberWorkspace = Boolean(currentUser) && !shouldShowOperatorWorkspace;
  const filteredWorkspacePanels = workspacePanels.filter((panel) => panel.visible && (activeWorkspaceView === "all" || activeWorkspaceView === panel.view));
  const workspaceViewOptions = [
    { key: "all" as WorkspaceView, label: "All", visible: workspacePanels.filter((panel) => panel.visible).length > 1 },
    { key: "trainer" as WorkspaceView, label: "Trainer", visible: showTrainerTools },
    { key: "shop" as WorkspaceView, label: "Venue", visible: showShopTools },
    { key: "admin" as WorkspaceView, label: "Admin", visible: isAdmin },
  ].filter((option) => option.visible);
  const showTrainerWorkspaceSection = shouldShowOperatorWorkspace && showTrainerTools && (activeWorkspaceView === "all" || activeWorkspaceView === "trainer");
  const showShopWorkspaceSection = shouldShowOperatorWorkspace && showShopTools && (activeWorkspaceView === "all" || activeWorkspaceView === "shop");

  useEffect(() => {
    setWorkspaceView(defaultWorkspaceView);
  }, [defaultWorkspaceView]);

  useEffect(() => {
    if (!selectedMemberBookingId && (nextMemberSession?._id || upcomingMemberBookings[0]?._id || bookings[0]?._id)) {
      setSelectedMemberBookingId(nextMemberSession?._id ?? upcomingMemberBookings[0]?._id ?? bookings[0]?._id ?? null);
      return;
    }

    if (selectedMemberBookingId && !bookings.some((booking) => booking._id === selectedMemberBookingId)) {
      setSelectedMemberBookingId(nextMemberSession?._id ?? upcomingMemberBookings[0]?._id ?? bookings[0]?._id ?? null);
    }
  }, [bookings, nextMemberSession?._id, selectedMemberBookingId, upcomingMemberBookings]);
  // Only show workspace quick access for trainers, shop owners, or admin
  const dashboardQuickLinks = [
    { title: "Dashboard", href: "/", visible: Boolean(currentUser), description: "Review bookings, meal plans, subscriptions, and account details." },
    { title: "Meal plans", href: "/meal-plans", visible: true, description: "See your meal plan for today and the week." },
    // Remove workspace for normal users
    { title: "My workspace", href: "/manage", visible: hasTrainerAccess || hasShopAccess || isAdmin, description: "Access management tools if you are a trainer, shop owner, or admin." },
    { title: "Personal trainers", href: "/discover?view=pt", visible: true, description: "Request a PT session directly from the trainer tab." },
    { title: "Group fitness", href: "/discover?view=group", visible: true, description: "Compare group programs and activate a cohort from the group fitness tab." },
    { title: "Gyms", href: "/discover?view=gyms", visible: true, description: "Browse gyms and venues, and view their offers." },
    { title: "Admin", href: "/manage", visible: isAdmin, description: "Open admin tools if you have admin access." },
  ].filter((item) => item.visible);
  const adminRecentSchedule = adminDashboard?.recentBookings.slice(0, 3) ?? [];
  const isItemSaved = useCallback((id: string, kind: SavedItem["kind"]) => savedItems.some((item) => item.id === id && item.kind === kind), [savedItems]);
  const toggleSavedItem = useCallback((item: SavedItem) => {
    setSavedItems((current) => current.some((entry) => entry.id === item.id && entry.kind === item.kind)
      ? current.filter((entry) => !(entry.id === item.id && entry.kind === item.kind))
      : [item, ...current].slice(0, 12));
  }, []);
  const toggleDiscoverPanel = useCallback((key: DiscoverPanelKey) => {
    setExpandedDiscoverPanels((current) => ({ ...current, [key]: !current[key] }));
  }, []);
  const refreshDiscovery = useCallback(async () => {
    const [trainerData, serviceData, groupFitnessData, shopData] = await Promise.all([
      apiRequest<Trainer[]>("/trainers").catch(() => []),
      apiRequest<Service[]>("/services").catch(() => []),
      apiRequest<{ teams: GroupFitnessTeam[]; programs: GroupFitnessProgram[] }>("/group-fitness")
        .catch(() => ({ teams: [], programs: [] })),
      apiRequest<Shop[]>("/shops").catch(() => []),
    ]);

    setTrainers(trainerData);
    setServices(serviceData);
    setGroupFitnessTeams(groupFitnessData.teams ?? []);
    setGroupFitnessPrograms(groupFitnessData.programs ?? []);
    setShops(shopData);

    // Fetch bulk ratings for all trainers, shops, and services
    const items = [
      ...trainerData.map((t: Trainer) => ({ targetType: "trainer", targetId: t._id })),
      ...shopData.map((s: Shop) => ({ targetType: "shop", targetId: s._id })),
      ...serviceData.map((sv: Service) => ({ targetType: "service", targetId: sv._id })),
    ];
    if (items.length > 0) {
      apiRequest<{ summaries: Array<{ targetType: string; targetId: string; average: number; count: number }> }>(
        "/ratings/bulk",
        { method: "POST", body: { items } }
      ).then((data) => {
        const map: Record<string, RatingSummary> = {};
        for (const s of data.summaries) {
          map[`${s.targetType}:${s.targetId}`] = { average: s.average, count: s.count };
        }
        setRatingSummaries(map);
      }).catch(() => undefined);
    }
  }, []);
  const refreshBookings = useCallback(async (activeToken: string, userId: string) => {
    const data = await apiRequest<Booking[]>(`/bookings/user/${userId}`, { token: activeToken });
    setBookings(data);
  }, []);
  const refreshTrainerBookings = useCallback(async (activeToken: string, trainerId: string) => {
    if (!trainerId) {
      setTrainerBookings([]);
      return;
    }

    const data = await apiRequest<Booking[]>(`/bookings/trainer/${trainerId}`, { token: activeToken });
    setTrainerBookings(data);
  }, []);
  const refreshShopBookings = useCallback(async (activeToken: string, shopId: string) => {
    if (!shopId) {
      setShopBookings([]);
      return;
    }

    const data = await apiRequest<Booking[]>(`/bookings/shop/${shopId}`, { token: activeToken });
    setShopBookings(data);
  }, []);
  const refreshShopProducts = useCallback(async (shopId: string) => {
    if (!shopId) {
      setProducts([]);
      return;
    }

    const data = await apiRequest<Product[]>(`/shops/${shopId}/products`, { token: sessionToken ?? undefined }).catch(() => []);
    setProducts(data);
  }, [sessionToken]);
  const refreshSession = useCallback(async (activeToken: string) => {
    const profile = await apiRequest<{ user: AuthUser }>("/auth/me", { token: activeToken });
    const user = profile.user;
    setToken(activeToken);
    setCurrentUser(user);
    return user;
  }, []);

  const activityFeed = useMemo(() => {
    const mapBookingEvent = (booking: Booking, scope: "member" | "trainer" | "shop" | "admin") => ({
      id: `${scope}-${booking._id}`,
      time: new Date(booking.bookingDate).getTime(),
      title: booking.status === "requested"
        ? "Request waiting"
        : booking.status === "accepted"
          ? "Approved"
          : booking.status === "completed"
            ? "Completed"
            : booking.status === "cancelled"
              ? "Cancelled"
              : "Updated",
      description: `${booking.serviceId?.title ?? "Booking"} · ${new Date(booking.bookingDate).toLocaleDateString()} at ${booking.timeSlot}`,
      href: scope === "member" ? "/#booking-status" : "/manage",
      accent: booking.status === "requested"
        ? "text-[#9c4a24]"
        : booking.paymentStatus === "awaiting_payment"
          ? "text-[#9c4a24]"
          : "text-accent-deep",
    });

    if (isAdmin) {
      const adminEvents = (adminDashboard?.recentBookings ?? []).slice(0, 4).map((booking) => mapBookingEvent(booking as Booking, "admin"));
      return adminEvents.sort((left, right) => right.time - left.time).slice(0, 4);
    }

    if (showTrainerTools) {
      const trainerEvents = trainerBookings.slice(0, 6).map((booking) => mapBookingEvent(booking, "trainer"));
      return trainerEvents.sort((left, right) => right.time - left.time).slice(0, 4);
    }

    if (showShopTools) {
      const shopEvents = shopBookings.slice(0, 6).map((booking) => mapBookingEvent(booking, "shop"));
      return shopEvents.sort((left, right) => right.time - left.time).slice(0, 4);
    }

    const memberEvents = bookings.slice(0, 6).map((booking) => mapBookingEvent(booking, "member"));
    return memberEvents.sort((left, right) => right.time - left.time).slice(0, 4);
  }, [adminDashboard?.recentBookings, bookings, isAdmin, shopBookings, showShopTools, showTrainerTools, trainerBookings]);

  const refreshSubscriptions = async (activeToken: string, userId: string) => {
    const data = await apiRequest<Subscription[]>(`/subscriptions/user/${userId}`, { token: activeToken });
    setSubscriptions(data);
  };

  const refreshMealProgress = useCallback(async (activeToken: string, userId: string) => {
    const data = await apiRequest<MealProgressEntry[]>(`/meal-progress/user/${userId}?days=30`, { token: activeToken });
    setMealProgressEntries(data);
  }, []);

  const refreshBodyMeasurements = useCallback(async (activeToken: string, userId: string) => {
    const data = await apiRequest<BodyMeasurementEntry[]>(`/body-measurements/user/${userId}?days=180`, { token: activeToken }).catch(() => []);
    setBodyMeasurements(data);
  }, []);

  const refreshTrainerMealProgress = useCallback(async (activeToken: string, userIds: string[]) => {
    if (userIds.length === 0) {
      setTrainerMealProgressByUser({});
      return;
    }

    const entries = await Promise.all(userIds.map(async (userId) => {
      const data = await apiRequest<MealProgressEntry[]>(`/meal-progress/user/${userId}?days=30`, { token: activeToken }).catch(() => []);
      return [userId, data] as const;
    }));

    setTrainerMealProgressByUser(Object.fromEntries(entries));
  }, []);

  const refreshTrainerBodyMeasurements = useCallback(async (activeToken: string, userIds: string[]) => {
    if (userIds.length === 0) {
      setTrainerBodyMeasurementsByUser({});
      return;
    }

    const entries = await Promise.all(userIds.map(async (userId) => {
      const data = await apiRequest<BodyMeasurementEntry[]>(`/body-measurements/user/${userId}?days=180`, { token: activeToken }).catch(() => []);
      return [userId, data] as const;
    }));

    setTrainerBodyMeasurementsByUser(Object.fromEntries(entries));
  }, []);

  const refreshNotifications = useCallback(async (activeToken: string, userId: string) => {
    const data = await apiRequest<Notification[]>(`/notifications/user/${userId}`, { token: activeToken });
    setNotifications(data);
  }, []);

  const refreshAdmin = useCallback(
    async (activeToken: string, roles?: string[]) => {
      if (!(roles ?? currentUser?.roles)?.includes("admin")) {
        setAdminDashboard(null);
        return;
      }

      const data = await apiRequest<AdminDashboard>("/admin/dashboard", { token: activeToken });
      setAdminDashboard(data);
    },
    [currentUser?.roles]
  );

  useEffect(() => {
    startTransition(async () => {
      try {
        await refreshDiscovery();
      } catch (requestError) {
        setError(requestError instanceof Error ? requestError.message : "Failed to load discovery data");
      }
    });
  }, [refreshDiscovery]);

  useEffect(() => {
    if (!sessionToken) {
      return;
    }

    let ignore = false;

    void (async () => {
      try {
        const profile = await apiRequest<{ user: AuthUser }>("/auth/me", { token: sessionToken });
        if (ignore) {
          return;
        }

        const user = profile.user;
        setCurrentUser(user);
        await Promise.all([
          refreshBookings(sessionToken, user._id),
          refreshSubscriptions(sessionToken, user._id),
          refreshMealProgress(sessionToken, user._id),
          refreshBodyMeasurements(sessionToken, user._id),
          refreshNotifications(sessionToken, user._id),
          refreshAdmin(sessionToken, user.roles),
        ]);
      } catch (requestError) {
        if (ignore) {
          return;
        }

        if (requestError instanceof ApiError && requestError.status === 401) {
          setToken(null);
          setCurrentUser(null);
          setProducts([]);
          setBookings([]);
          setTrainerBookings([]);
          setShopBookings([]);
          setSubscriptions([]);
          setMealProgressEntries([]);
          setBodyMeasurements([]);
          setTrainerMealProgressByUser({});
          setTrainerBodyMeasurementsByUser({});
          setNotifications([]);
          setTrainerBookingDraft(null);
          setSelectedTrainerClientId(null);
          setTrainerMeasurementDraft(emptyTrainerMeasurementDraft);
          setAdminDashboard(null);
          setError(requestError.message);
          return;
        }

        setError(requestError instanceof Error ? requestError.message : "Session refresh failed");
      }
    })();

    return () => {
      ignore = true;
    };
  }, [refreshAdmin, refreshBodyMeasurements, refreshMealProgress, sessionToken]);

  useEffect(() => {
    if (!ownedShop) {
      return;
    }

    startTransition(async () => {
      try {
        await refreshShopProducts(ownedShop._id);
      } catch (requestError) {
        setError(requestError instanceof Error ? requestError.message : "Failed to load products");
      }
    });
  }, [ownedShop]);

  useEffect(() => {
    if (!sessionToken || !ownedTrainer) {
      return;
    }

    startTransition(async () => {
      try {
        await refreshTrainerBookings(sessionToken, ownedTrainer._id);
      } catch (requestError) {
        setError(requestError instanceof Error ? requestError.message : "Failed to load trainer bookings");
      }
    });
  }, [ownedTrainer, sessionToken]);

  useEffect(() => {
    if (!sessionToken || !ownedTrainer) {
      setTrainerMealProgressByUser({});
      setTrainerBodyMeasurementsByUser({});
      return;
    }

    const clientIds = Array.from(new Set(trainerBookings.map((booking) => booking.userId?._id).filter(Boolean) as string[]));
    void refreshTrainerMealProgress(sessionToken, clientIds);
    void refreshTrainerBodyMeasurements(sessionToken, clientIds);
  }, [ownedTrainer, refreshTrainerBodyMeasurements, refreshTrainerMealProgress, sessionToken, trainerBookings]);

  useEffect(() => {
    const trainerClientIds = Array.from(new Set(trainerBookings.map((booking) => booking.userId?._id).filter(Boolean) as string[]));

    if (trainerClientIds.length === 0) {
      setSelectedTrainerClientId(null);
      return;
    }

    if (!selectedTrainerClientId || !trainerClientIds.includes(selectedTrainerClientId)) {
      setSelectedTrainerClientId(trainerClientIds[0]);
    }
  }, [selectedTrainerClientId, trainerBookings]);

  useEffect(() => {
    setTrainerMeasurementDraft({
      ...emptyTrainerMeasurementDraft,
      measuredAt: new Date().toISOString().slice(0, 10),
    });
  }, [selectedTrainerClientId]);

  useEffect(() => {
    if (!sessionToken || !ownedShop) {
      return;
    }

    startTransition(async () => {
      try {
        await refreshShopBookings(sessionToken, ownedShop._id);
      } catch (requestError) {
        setError(requestError instanceof Error ? requestError.message : "Failed to load venue bookings");
      }
    });
  }, [ownedShop, sessionToken]);

  useEffect(() => {
    if (!sessionToken || !currentUser) {
      return;
    }

    const pollId = window.setInterval(() => {
      void refreshNotifications(sessionToken, currentUser._id).catch(() => {
        // Keep polling resilient without interrupting the session UX.
      });
    }, 60_000);

    return () => {
      window.clearInterval(pollId);
    };
  }, [currentUser, refreshNotifications, sessionToken]);

  useEffect(() => {
    if (!currentUser) {
      activeNotificationUserIdRef.current = null;
      seenNotificationIdsRef.current = new Set();
      return;
    }

    if (activeNotificationUserIdRef.current !== currentUser._id) {
      activeNotificationUserIdRef.current = currentUser._id;
      seenNotificationIdsRef.current = new Set(notifications.map((item) => item._id));
      return;
    }

    const unseen = notifications.filter((item) => !seenNotificationIdsRef.current.has(item._id));
    notifications.forEach((item) => seenNotificationIdsRef.current.add(item._id));

    if (unseen.length === 0 || typeof window === "undefined" || !("Notification" in window)) {
      return;
    }

    if (window.Notification.permission === "default") {
      void window.Notification.requestPermission();
      return;
    }

    if (window.Notification.permission !== "granted") {
      return;
    }

    unseen.slice(0, 2).forEach((item) => {
      new window.Notification(item.title, { body: item.message });
    });
  }, [currentUser, notifications]);

  const runAction = (action: () => Promise<void>) => {
    setFeedback("");
    setError("");
    setIsWorking(true);
    void action()
      .catch((requestError) => {
        setError(requestError instanceof Error ? requestError.message : "Request failed");
      })
      .finally(() => {
        setIsWorking(false);
      });
  };

  const buildRegisterPayload = () => {
    const name = registerForm.name.trim();
    const email = registerForm.email.trim().toLowerCase();
    const password = registerForm.password;
    const phone = registerForm.phone.trim();
    const dateOfBirth = registerForm.dateOfBirth;
    const emergencyContactName = registerForm.emergencyContactName.trim();
    const emergencyContactPhone = registerForm.emergencyContactPhone.trim();
    const allergies = registerForm.allergies.trim();
    const medicalConditions = registerForm.medicalConditions.trim();
    const medications = registerForm.medications.trim();
    const medicalNotes = registerForm.medicalNotes.trim();

    if (name.length < 2) {
      throw new Error("Name must be at least 2 characters.");
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new Error("Enter a valid email address.");
    }

    if (password.trim().length < 8) {
      throw new Error("Password must be at least 8 characters.");
    }

    if (!dateOfBirth) {
      throw new Error("Date of birth is required.");
    }

    if (emergencyContactName.length < 2) {
      throw new Error("Emergency contact name is required.");
    }

    if (emergencyContactPhone.length < 7) {
      throw new Error("Emergency contact phone is required.");
    }

    if (!allergies || !medicalConditions || !medications) {
      throw new Error("Complete the medical form before creating an account. Use 'None' where needed.");
    }

    return {
      name,
      email,
      password,
      dateOfBirth,
      emergencyContactName,
      emergencyContactPhone,
      allergies,
      medicalConditions,
      medications,
      medicalNotes,
      ...(phone ? { phone } : {}),
    };
  };

  const buildLoginPayload = () => {
    const email = loginForm.email.trim().toLowerCase();
    const password = loginForm.password;

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new Error("Enter a valid email address.");
    }

    if (password.trim().length < 8) {
      throw new Error("Password must be at least 8 characters.");
    }

    return {
      email,
      password,
    };
  };

  const handleRegister = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    runAction(async () => {
      const registerPayload = buildRegisterPayload();
      const response = await apiRequest<AuthResponse>("/auth/register", { method: "POST", body: registerPayload });
      setToken(response.token);
      await refreshSession(response.token);
      setBookings([]);
      setLoginForm({ email: response.user.email, password: registerPayload.password });
      setRegisterForm(emptyRegisterForm);
      setIsAuthModalOpen(false);
      setAuthModalView("login");
      setFeedback("Account created and signed in. Opening management tools.");
      router.push("/manage");
    });
  };

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    runAction(async () => {
      const loginPayload = buildLoginPayload();
      const response = await apiRequest<AuthResponse>("/auth/login", { method: "POST", body: loginPayload });
      setToken(response.token);
      const user = await refreshSession(response.token);
      await Promise.all([
        refreshBookings(response.token, user._id),
        refreshMealProgress(response.token, user._id),
        refreshAdmin(response.token, user.roles),
      ]);
      setIsAuthModalOpen(false);
      setFeedback("Signed in successfully.");
      router.push(user.roles.includes("admin") ? "/admin" : "/manage");
    });
  };

  const openAuthModal = (view: AuthModalView) => {
    setAuthModalView(view);
    setIsAuthModalOpen(true);
    setError("");
    setFeedback("");
  };

  const handleLogout = () => {
    setToken(null);
    setCurrentUser(null);
    setProducts([]);
    setBookings([]);
    setTrainerBookings([]);
    setMealProgressEntries([]);
    setBodyMeasurements([]);
    setTrainerMealProgressByUser({});
    setTrainerBodyMeasurementsByUser({});
    setTrainerBookingDraft(null);
    setSelectedTrainerClientId(null);
    setTrainerMeasurementDraft(emptyTrainerMeasurementDraft);
    setAdminDashboard(null);
    setFeedback("Signed out.");
    setError("");
    router.push("/");
  };

  const handleSaveTrainerMeasurement = () => {
    if (!sessionToken || !selectedTrainerClientId) {
      setError("Select a client before saving a measurement.");
      return;
    }

    if (!trainerMeasurementDraft.measuredAt || trainerMeasurementDraft.measuredAt.trim().length < 10) {
      setError("Select the measured day before saving.");
      return;
    }

    runAction(async () => {
      const numericFields = {
        weightKg: trainerMeasurementDraft.weightKg,
        bodyFatPercent: trainerMeasurementDraft.bodyFatPercent,
        chestCm: trainerMeasurementDraft.chestCm,
        waistCm: trainerMeasurementDraft.waistCm,
        hipsCm: trainerMeasurementDraft.hipsCm,
        thighCm: trainerMeasurementDraft.thighCm,
        armCm: trainerMeasurementDraft.armCm,
      };

      const body = Object.fromEntries(
        Object.entries(numericFields)
          .filter(([, value]) => value.trim().length > 0)
          .map(([key, value]) => [key, Number(value)])
      );

      await apiRequest(`/body-measurements/user/${selectedTrainerClientId}`, {
        method: "POST",
        token: sessionToken,
        body: {
          measuredAt: trainerMeasurementDraft.measuredAt,
          note: trainerMeasurementDraft.note.trim() || undefined,
          ...body,
        },
      });

      await refreshTrainerBodyMeasurements(sessionToken, [selectedTrainerClientId]);
      setTrainerMeasurementDraft({
        ...emptyTrainerMeasurementDraft,
        measuredAt: new Date().toISOString().slice(0, 10),
      });
      setIsTrainerMeasurementModalOpen(false);
      setFeedback("Body measurements updated for the selected client.");
    });
  };

  const handleSaveMemberMeasurement = () => {
    if (!sessionToken || !currentUser) {
      setError("Login first.");
      return;
    }

    if (!memberMeasurementDraft.measuredAt || memberMeasurementDraft.measuredAt.trim().length < 10) {
      setError("Select the measured day before saving.");
      return;
    }

    runAction(async () => {
      const numericFields = {
        weightKg: memberMeasurementDraft.weightKg,
        bodyFatPercent: memberMeasurementDraft.bodyFatPercent,
        chestCm: memberMeasurementDraft.chestCm,
        waistCm: memberMeasurementDraft.waistCm,
        hipsCm: memberMeasurementDraft.hipsCm,
        thighCm: memberMeasurementDraft.thighCm,
        armCm: memberMeasurementDraft.armCm,
      };

      const body = Object.fromEntries(
        Object.entries(numericFields)
          .filter(([, value]) => value.trim().length > 0)
          .map(([key, value]) => [key, Number(value)])
      );

      if (Object.keys(body).length === 0) {
        throw new Error("Enter at least one measurement value.");
      }

      await apiRequest(`/body-measurements/user/${currentUser._id}`, {
        method: "POST",
        token: sessionToken,
        body: {
          measuredAt: memberMeasurementDraft.measuredAt,
          note: memberMeasurementDraft.note.trim() || undefined,
          ...body,
        },
      });

      await refreshBodyMeasurements(sessionToken, currentUser._id);
      setMemberMeasurementDraft({
        ...emptyTrainerMeasurementDraft,
        measuredAt: new Date().toISOString().slice(0, 10),
      });
      setIsMemberMeasurementModalOpen(false);
      setFeedback("Body measurement saved.");
    });
  };

  const handleLoadTrainerProfile = () => {
    if (!ownedTrainer) {
      return;
    }

    setTrainerForm({
      specialties: ownedTrainer.specialties.join(", "),
      experienceYears: String(ownedTrainer.experienceYears ?? 0),
      bio: ownedTrainer.bio ?? "",
      headline: ownedTrainer.portfolio?.headline ?? "",
      coachingStyle: ownedTrainer.portfolio?.coachingStyle ?? "",
      certifications: ownedTrainer.portfolio?.certifications?.join(", ") ?? "",
      achievements: ownedTrainer.portfolio?.achievements?.join(", ") ?? "",
    });
    setFeedback("Loaded current trainer profile.");
    setError("");
  };

  const openTrainerProfileModal = () => {
    if (ownedTrainer) {
      handleLoadTrainerProfile();
    }
    setActiveWorkspaceModal("trainerProfile");
  };

  const handleSaveTrainerProfile = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!sessionToken || !currentUser) {
      setError("Login first.");
      return;
    }
    runAction(async () => {
      const body = {
        userId: currentUser._id,
        specialties: trainerForm.specialties.split(",").map((item) => item.trim()).filter(Boolean),
        experienceYears: Number(trainerForm.experienceYears),
        bio: trainerForm.bio,
        portfolio: {
          headline: trainerForm.headline,
          coachingStyle: trainerForm.coachingStyle,
          certifications: trainerForm.certifications.split(",").map((item) => item.trim()).filter(Boolean),
          achievements: trainerForm.achievements.split(",").map((item) => item.trim()).filter(Boolean),
        },
      };

      if (ownedTrainer) {
        await apiRequest(`/trainers/${ownedTrainer._id}`, {
          method: "PATCH",
          token: sessionToken,
          body,
        });
      } else {
        await apiRequest("/trainers", {
          method: "POST",
          token: sessionToken,
          body,
        });
      }

      const user = await refreshSession(sessionToken);
      await Promise.all([
        refreshDiscovery(),
        refreshAdmin(sessionToken, user.roles),
        refreshTrainerBookings(sessionToken, ownedTrainer?._id ?? "").catch(() => undefined),
      ]);
      setActiveWorkspaceModal(null);
      setFeedback(ownedTrainer ? "Trainer profile updated." : "Trainer profile created.");
    });
  };

  const resetServiceForm = () => {
    setServiceForm({ category: "fitness", type: "PT", title: "", description: "", audience: "all", price: "", city: "Male", venueName: "", linkedShopId: "", supportsInPerson: true, supportsOnline: false, onlineLabel: "", outdoorLocations: "", day: "Monday", startTime: "07:00", endTime: "08:00", capacity: "1" });
    setEditingServiceId(null);
  };

  const openTrainerServiceModal = () => {
    resetServiceForm();
    setActiveWorkspaceModal("trainerService");
  };

  const openVenueOfferModal = () => {
    resetServiceForm();
    if (ownedShop) {
      setServiceForm((current) => ({
        ...current,
        linkedShopId: ownedShop._id,
        venueName: ownedShop.shopName,
        city: ownedShop.location ?? current.city,
      }));
    }
    setActiveWorkspaceModal("shopVenueOffer");
  };

  const resetProductForm = () => {
    setProductForm({ name: "", price: "", description: "", externalLink: "" });
    setEditingProductId(null);
  };

  const openShopProductModal = () => {
    resetProductForm();
    setActiveWorkspaceModal("shopProduct");
  };

  const openShopProfileModal = () => {
    if (ownedShop) {
      handleLoadOwnedShop();
    }
    setActiveWorkspaceModal("shopProfile");
  };

  const handleSaveShop = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!sessionToken || !currentUser) {
      setError("Login first.");
      return;
    }
    runAction(async () => {
      const body = {
        shopName: shopForm.shopName,
        ownerId: currentUser._id,
        categories: shopForm.categories.split(",").map((item) => item.trim()).filter(Boolean),
        location: shopForm.location,
        description: shopForm.description,
        logoUrl: shopForm.logoUrl,
        websiteLink: shopForm.websiteLink,
        peakHoursBusy: shopForm.peakHoursBusy,
        peakHoursQuiet: shopForm.peakHoursQuiet,
        peakHoursNotes: shopForm.peakHoursNotes,
      };

      if (ownedShop) {
        await apiRequest(`/shops/${ownedShop._id}`, {
          method: "PATCH",
          token: sessionToken,
          body,
        });
      } else {
        await apiRequest("/shops", {
          method: "POST",
          token: sessionToken,
          body,
        });
      }

      const user = await refreshSession(sessionToken);
      await Promise.all([refreshDiscovery(), refreshAdmin(sessionToken, user.roles)]);
      setActiveWorkspaceModal(null);
      setFeedback(ownedShop ? "Shop updated." : "Shop created.");
    });
  };

  const handleSaveService = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!sessionToken || (!ownedTrainer && !ownedShop)) {
      setError("Create a trainer profile or venue first.");
      return;
    }
    runAction(async () => {
      const hostingShopId = serviceForm.linkedShopId || ownedShop?._id || undefined;
      const deliveryOptions = [
        ...(serviceForm.supportsInPerson ? [{ mode: "in_person", label: serviceForm.venueName || (serviceForm.city ? `${serviceForm.city} Studio` : "In-person location"), details: hostingShopId ? "Hosted at listed venue" : undefined }] : []),
        ...(serviceForm.supportsOnline ? [{ mode: "online", label: serviceForm.onlineLabel || "Online session", details: "Meeting link is shared by the trainer after approval." }] : []),
        ...serviceForm.outdoorLocations.split(",").map((item) => item.trim()).filter(Boolean).map((item) => ({ mode: "outdoor", label: item })),
      ];

      const body = {
        category: serviceForm.category,
        type: serviceForm.type,
        title: serviceForm.title,
        description: serviceForm.description,
        audience: serviceForm.audience,
        price: Number(serviceForm.price),
        trainerId: ownedTrainer?._id,
        shopId: hostingShopId,
        location: { name: serviceForm.venueName || (serviceForm.city ? `${serviceForm.city} Studio` : "Fithub Studio"), city: serviceForm.city },
        schedule: [{ day: serviceForm.day, startTime: serviceForm.startTime, endTime: serviceForm.endTime }],
        deliveryOptions,
        capacity: Number(serviceForm.capacity) || 1,
      };

      if (editingServiceId) {
        await apiRequest(`/services/${editingServiceId}`, {
          method: "PATCH",
          token: sessionToken,
          body,
        });
      } else {
        await apiRequest("/services", {
          method: "POST",
          token: sessionToken,
          body,
        });
      }

      await Promise.all([
        refreshDiscovery(),
        refreshAdmin(sessionToken),
        ownedShop ? refreshShopBookings(sessionToken, ownedShop._id).catch(() => undefined) : Promise.resolve(),
      ]);
      resetServiceForm();
      setActiveWorkspaceModal(null);
      setFeedback(editingServiceId ? "Service updated." : "Service created.");
    });
  };

  const handleListedGymChange = (shopId: string) => {
    if (!shopId) {
      setServiceForm((current) => ({
        ...current,
        linkedShopId: "",
      }));
      return;
    }

    const selectedGym = gymShops.find((shop) => shop._id === shopId);

    if (!selectedGym) {
      return;
    }

    setServiceForm((current) => ({
      ...current,
      linkedShopId: selectedGym._id,
      supportsInPerson: true,
      city: selectedGym.location || current.city,
      venueName: selectedGym.shopName,
    }));
  };

  const handleSaveProduct = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!sessionToken || !ownedShop) {
      setError("Create a shop first.");
      return;
    }
    runAction(async () => {
      const body = {
        name: productForm.name,
        price: Number(productForm.price),
        description: productForm.description,
        externalLink: productForm.externalLink,
      };

      if (editingProductId) {
        await apiRequest(`/shops/${ownedShop._id}/products/${editingProductId}`, {
          method: "PATCH",
          token: sessionToken,
          body,
        });
      } else {
        await apiRequest(`/shops/${ownedShop._id}/products`, {
          method: "POST",
          token: sessionToken,
          body,
        });
      }

      await Promise.all([refreshShopProducts(ownedShop._id), refreshAdmin(sessionToken)]);
      resetProductForm();
      setActiveWorkspaceModal(null);
      setFeedback(editingProductId ? "Product updated." : "Product added to shop.");
    });
  };

  const getRatingSummary = useCallback((targetType: "trainer" | "shop" | "service", targetId: string): RatingSummary => {
    return ratingSummaries[`${targetType}:${targetId}`] ?? { average: null, count: 0 };
  }, [ratingSummaries]);

  const openRatingModal = useCallback((targetType: "trainer" | "shop" | "service", targetId: string, targetLabel: string) => {
    if (!currentUser || !sessionToken) {
      setError("Login to rate.");
      openAuthModal("login");
      return;
    }
    setRatingForm({ score: 0, comment: "" });
    setRatingModal({ targetType, targetId, targetLabel });
  }, [currentUser, sessionToken, openAuthModal]);

  const handleSubmitRating = useCallback(async () => {
    if (!ratingModal || !currentUser || !sessionToken) return;
    if (ratingForm.score < 1 || ratingForm.score > 5) {
      setError("Choose a star rating from 1 to 5.");
      return;
    }
    setRatingSubmitting(true);
    try {
      await apiRequest("/ratings", {
        method: "POST",
        token: sessionToken,
        body: {
          targetType: ratingModal.targetType,
          targetId: ratingModal.targetId,
          score: ratingForm.score,
          comment: ratingForm.comment.trim() || undefined,
        },
      });
      // Update local summary
      const key = `${ratingModal.targetType}:${ratingModal.targetId}`;
      setRatingSummaries((current) => {
        const prev = current[key] ?? { average: null, count: 0 };
        const newCount = prev.count + 1;
        const newAverage = prev.average == null
          ? ratingForm.score
          : Math.round(((prev.average * prev.count) + ratingForm.score) / newCount * 10) / 10;
        return { ...current, [key]: { average: newAverage, count: newCount } };
      });
      setAlreadyRatedIds((current) => new Set([...current, `${ratingModal.targetType}:${ratingModal.targetId}`]));
      setFeedback(`Your rating for ${ratingModal.targetLabel} was submitted. Thank you!`);
      setRatingModal(null);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      }
    } finally {
      setRatingSubmitting(false);
    }
  }, [ratingModal, currentUser, sessionToken, ratingForm]);

  const handleSubmitBookingRequest = () => {
    if (!currentUser || !sessionToken) {
      setError("Login to request a booking.");
      openAuthModal("login");
      return;
    }

    if (!bookingForm.serviceId || !bookingForm.timeSlot || !bookingForm.bookingDate) {
      setError("Choose a service, slot, and preferred date first.");
      return;
    }

    if (!bookingForm.sessionMode || !bookingForm.sessionLocation) {
      setError("Choose how you want to train before sending the booking request.");
      return;
    }

    runAction(async () => {
      const sessionModeLabel = bookingForm.sessionMode ? getDeliveryModeLabel(bookingForm.sessionMode) : "Preferred mode";
      await apiRequest("/bookings", {
        method: "POST",
        token: sessionToken,
        body: {
          userId: currentUser._id,
          serviceId: bookingForm.serviceId,
          bookingDate: new Date(bookingForm.bookingDate).toISOString(),
          timeSlot: bookingForm.timeSlot,
          sessionMode: bookingForm.sessionMode,
          sessionLocation: bookingForm.sessionLocation,
          notes: `Requested from ${trainingView === "group" ? "Group Fitness" : discoverView === "gyms" ? "Gyms" : "Personal Training"} tab. Preferred setup: ${sessionModeLabel} at ${bookingForm.sessionLocation}.`,
        },
      });
      await Promise.all([
        refreshBookings(sessionToken, currentUser._id),
        refreshAdmin(sessionToken),
        ownedTrainer ? refreshTrainerBookings(sessionToken, ownedTrainer._id) : Promise.resolve(),
      ]);
      setFeedback("Booking request sent. Wait for acceptance before payment.");
      router.push("/manage");
    });
  };

  const handleSubmitGroupProgramRequest = () => {
    if (!selectedGroupProgram) {
      setError("Choose a group fitness program first.");
      return;
    }

    if (selectedGroupProgram.isComplete) {
      setError("That program has already ended. Join the next listed cohort instead.");
      return;
    }

    if (selectedGroupProgram.isFull) {
      setError("That cohort is full. Join the waitlist for the next program.");
      return;
    }

    if (!selectedGroupProgram.linkedServiceId) {
      setError("This program is listed, but its booking record is not linked yet.");
      return;
    }

    if (!currentUser || !sessionToken) {
      setError("Login to activate a group program.");
      openAuthModal("login");
      return;
    }

    runAction(async () => {
      await apiRequest(`/group-fitness/programs/${selectedGroupProgram._id}/activate`, {
        method: "POST",
        token: sessionToken,
      });
      await Promise.all([
        refreshBookings(sessionToken, currentUser._id),
        refreshAdmin(sessionToken),
        refreshDiscovery(),
        ownedTrainer ? refreshTrainerBookings(sessionToken, ownedTrainer._id) : Promise.resolve(),
      ]);
      setFeedback("Group fitness program activated and sent for approval.");
      router.push("/manage");
    });
  };

  const handleJoinGroupWaitlist = () => {
    if (!selectedGroupProgram) {
      setError("Choose a full program first.");
      return;
    }

    if (!currentUser) {
      setError("Login to join the waitlist.");
      openAuthModal("login");
      return;
    }

    if (!sessionToken) {
      setError("Login to join the waitlist.");
      openAuthModal("login");
      return;
    }

    runAction(async () => {
      await apiRequest(`/group-fitness/programs/${selectedGroupProgram._id}/waitlist`, {
        method: "POST",
        token: sessionToken,
      });
      setWaitlistedProgramIds((current) => (current.includes(selectedGroupProgram._id) ? current : [...current, selectedGroupProgram._id]));
      await refreshDiscovery();
      setFeedback(`You are on the waitlist for the next ${selectedGroupProgram.title} cohort.`);
    });
  };

  const handleEditService = (service: Service) => {
    setEditingServiceId(service._id);
    setServiceForm({
      category: service.category,
      type: service.type,
      title: service.title,
      description: service.description ?? "",
      audience: service.audience ?? "all",
      price: String(service.price),
      city: service.location?.city ?? "Male",
      venueName: service.location?.name ?? "",
      linkedShopId: service.shopId?._id ?? gymShops.find((shop) => normalizeMatchValue(shop.shopName) === normalizeMatchValue(service.location?.name))?._id ?? "",
      supportsInPerson: service.deliveryOptions?.some((option) => option.mode === "in_person") ?? true,
      supportsOnline: service.deliveryOptions?.some((option) => option.mode === "online") ?? false,
      onlineLabel: service.deliveryOptions?.find((option) => option.mode === "online")?.label ?? "",
      outdoorLocations: service.deliveryOptions?.filter((option) => option.mode === "outdoor").map((option) => option.label).join(", ") ?? "",
      day: service.schedule?.[0]?.day ?? "Monday",
      startTime: service.schedule?.[0]?.startTime ?? "07:00",
      endTime: service.schedule?.[0]?.endTime ?? "08:00",
      capacity: String(service.capacity ?? 1),
    });
    setActiveWorkspaceModal(service.shopId ? "shopVenueOffer" : "trainerService");
  };

  const handleDeleteService = (serviceId: string) => {
    if (!sessionToken) {
      setError("Login first.");
      return;
    }

    runAction(async () => {
      await apiRequest(`/services/${serviceId}`, {
        method: "DELETE",
        token: sessionToken,
      });
      await Promise.all([refreshDiscovery(), refreshAdmin(sessionToken)]);
      if (editingServiceId === serviceId) {
        resetServiceForm();
      }
      setFeedback("Service deleted.");
    });
  };

  const handleEditProduct = (product: Product) => {
    setEditingProductId(product._id);
    setProductForm({
      name: product.name,
      price: String(product.price),
      description: product.description ?? "",
      externalLink: product.externalLink ?? "",
    });
    setActiveWorkspaceModal("shopProduct");
  };

  const handleDeleteProduct = (productId: string) => {
    if (!sessionToken || !ownedShop) {
      setError("Create a shop first.");
      return;
    }

    runAction(async () => {
      await apiRequest(`/shops/${ownedShop._id}/products/${productId}`, {
        method: "DELETE",
        token: sessionToken,
      });
      await refreshShopProducts(ownedShop._id);
      if (editingProductId === productId) {
        resetProductForm();
      }
      setFeedback("Product deleted.");
    });
  };

  const quickActions = useMemo<QuickAction[]>(() => {
    const actions: QuickAction[] = [
      {
        id: "browse-pt",
        title: "Browse personal trainers",
        description: "Open the PT discovery view and compare coach listings.",
        keywords: ["trainer", "pt", "book", "coach"],
        run: () => router.push("/discover?view=pt"),
      },
      {
        id: "browse-gyms",
        title: "Browse gyms and passes",
        description: "Open venue discovery for memberships, classes, and day entry.",
        keywords: ["gym", "venue", "membership", "pass"],
        run: () => router.push("/discover?view=gyms"),
      },
      {
        id: "browse-groups",
        title: "Browse group programs",
        description: "Compare teams and activate a cohort from the group tab.",
        keywords: ["group", "program", "cohort", "team"],
        run: () => router.push("/discover?view=group"),
      },
      {
        id: "open-profile",
        title: "Open dashboard",
        description: "Review booking status, meal plans, subscriptions, and personal details.",
        keywords: ["dashboard", "profile", "account", "booking", "notifications"],
        run: () => router.push("/"),
      },
      {
        id: "open-manage",
        title: "Open workspace",
        description: "Jump straight to role tools, publishing, and request handling.",
        keywords: ["manage", "workspace", "trainer", "shop"],
        run: () => router.push("/manage"),
      },
    ];

    if (showTrainerTools) {
      actions.push({
        id: "trainer-profile",
        title: ownedTrainer ? "Edit trainer profile" : "Create trainer profile",
        description: "Open the trainer identity form directly from anywhere.",
        keywords: ["trainer", "profile", "coach"],
        run: () => {
          router.push("/manage");
          setWorkspaceView("trainer");
          openTrainerProfileModal();
        },
      });
      actions.push({
        id: "trainer-service",
        title: ownedServices.length > 0 ? "Add trainer service" : "Publish first trainer service",
        description: "Create PT, class, or online coaching offers with live slots.",
        keywords: ["service", "publish", "pt", "slot"],
        run: () => {
          router.push("/manage");
          setWorkspaceView("trainer");
          openTrainerServiceModal();
        },
      });
    }

    if (showShopTools) {
      actions.push({
        id: "shop-profile",
        title: ownedShop ? "Edit venue profile" : "Create venue profile",
        description: "Open the gym or shop profile modal instantly.",
        keywords: ["shop", "gym", "venue", "profile"],
        run: () => {
          router.push("/manage");
          setWorkspaceView("shop");
          openShopProfileModal();
        },
      });
      actions.push({
        id: "shop-offer",
        title: ownedShopVenueServices.length > 0 ? "Publish venue offer" : "Publish first venue offer",
        description: "Add memberships, classes, PT slots, or events.",
        keywords: ["offer", "membership", "class", "event"],
        run: () => {
          router.push("/manage");
          setWorkspaceView("shop");
          openVenueOfferModal();
        },
      });
    }

    if (isAdmin) {
      actions.push({
        id: "admin-view",
        title: "Open admin view",
        description: "Jump to moderation tools and oversight.",
        keywords: ["admin", "control", "moderation"],
        run: () => {
          router.push("/manage");
          setWorkspaceView("admin");
        },
      });
    }

    return actions;
  }, [isAdmin, openShopProfileModal, openTrainerProfileModal, openTrainerServiceModal, openVenueOfferModal, ownedServices.length, ownedShop, ownedShopVenueServices.length, returnToCurrentPage, router, showShopTools, showTrainerTools]);

  const filteredQuickActions = quickActions.filter((action) => {
    const query = quickActionQuery.trim().toLowerCase();
    if (!query) {
      return true;
    }

    return [action.title, action.description, ...action.keywords].some((value) => value.toLowerCase().includes(query));
  });

  const recommendedQuickActions = useMemo(() => {
    const preferredIds = isAdmin
      ? ["admin-view", "open-manage", "open-profile"]
      : showShopTools
        ? ["shop-offer", "shop-profile", "open-manage"]
        : showTrainerTools
          ? ["trainer-service", "trainer-profile", "open-manage"]
          : ["open-profile", "browse-pt", "browse-gyms"];

    const recommended = preferredIds
      .map((id) => quickActions.find((action) => action.id === id))
      .filter((action): action is QuickAction => Boolean(action));

    return recommended.length > 0 ? recommended : quickActions.slice(0, 3);
  }, [isAdmin, quickActions, showShopTools, showTrainerTools]);

  const visibleQuickActions = useMemo(() => {
    if (quickActionQuery.trim().length > 0) {
      return filteredQuickActions;
    }

    const seen = new Set<string>();
    const merged = [...recommendedQuickActions, ...quickActions].filter((action) => {
      if (seen.has(action.id)) {
        return false;
      }

      seen.add(action.id);
      return true;
    });

    return merged;
  }, [filteredQuickActions, quickActionQuery, quickActions, recommendedQuickActions]);

  const runQuickAction = (action: QuickAction) => {
    action.run();
    setIsQuickActionsOpen(false);
    setQuickActionQuery("");
  };

  useEffect(() => {
    const handleGlobalQuickLauncher = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setIsQuickActionsOpen(true);
        return;
      }

      if (!isQuickActionsOpen) {
        return;
      }

      if (event.key === "Escape") {
        event.preventDefault();
        setIsQuickActionsOpen(false);
        setQuickActionQuery("");
        return;
      }

      if (event.key === "Enter" && document.activeElement === quickActionInputRef.current && visibleQuickActions.length > 0) {
        event.preventDefault();
        runQuickAction(visibleQuickActions[0]);
      }
    };

    window.addEventListener("keydown", handleGlobalQuickLauncher);

    return () => {
      window.removeEventListener("keydown", handleGlobalQuickLauncher);
    };
  }, [isQuickActionsOpen, visibleQuickActions]);

  useEffect(() => {
    if (!isQuickActionsOpen) {
      return;
    }

    const focusTimer = window.setTimeout(() => {
      quickActionInputRef.current?.focus();
      quickActionInputRef.current?.select();
    }, 0);

    return () => {
      window.clearTimeout(focusTimer);
    };
  }, [isQuickActionsOpen]);

  const handleDeleteShop = () => {
    if (!sessionToken || !ownedShop) {
      setError("Create a shop first.");
      return;
    }

    runAction(async () => {
      await apiRequest(`/shops/${ownedShop._id}`, {
        method: "DELETE",
        token: sessionToken,
      });
      await Promise.all([refreshDiscovery(), refreshAdmin(sessionToken)]);
      setProducts([]);
      setShopForm({
        shopName: "",
        categories: "fitness gear, recovery",
        location: "",
        description: "",
        logoUrl: "",
        websiteLink: "",
        peakHoursBusy: "",
        peakHoursQuiet: "",
        peakHoursNotes: "",
      });
      resetProductForm();
      setFeedback("Shop deleted.");
    });
  };

  const handleLoadOwnedShop = () => {
    if (!ownedShop) {
      return;
    }

    setShopForm({
      shopName: ownedShop.shopName,
      categories: ownedShop.categories.join(", "),
      location: ownedShop.location ?? "",
      description: ownedShop.description ?? "",
      logoUrl: ownedShop.logoUrl ?? "",
      websiteLink: ownedShop.websiteLink ?? "",
      peakHoursBusy: ownedShop.peakHoursBusy ?? "",
      peakHoursQuiet: ownedShop.peakHoursQuiet ?? "",
      peakHoursNotes: ownedShop.peakHoursNotes ?? "",
    });
    setFeedback("Loaded current shop into the form.");
    setError("");
  };

  const handleTrainerBookingStatus = (bookingId: string, status: "accepted" | "completed" | "cancelled") => {
    if (!sessionToken || !ownedTrainer) {
      setError("Create a trainer profile first.");
      return;
    }

    runAction(async () => {
      await apiRequest(`/bookings/${bookingId}`, {
        method: "PATCH",
        token: sessionToken,
        body: { status },
      });
      await Promise.all([
        refreshTrainerBookings(sessionToken, ownedTrainer._id),
        currentUser ? refreshBookings(sessionToken, currentUser._id) : Promise.resolve(),
        refreshAdmin(sessionToken),
      ]);
      setFeedback(`Trainer booking marked ${status}.`);
    });
  };

  const handleShopBookingStatus = (bookingId: string, status: "accepted" | "completed" | "cancelled") => {
    if (!sessionToken || !ownedShop) {
      setError("Create a shop first.");
      return;
    }

    runAction(async () => {
      await apiRequest(`/bookings/${bookingId}`, {
        method: "PATCH",
        token: sessionToken,
        body: { status },
      });
      await Promise.all([
        refreshShopBookings(sessionToken, ownedShop._id),
        currentUser ? refreshBookings(sessionToken, currentUser._id) : Promise.resolve(),
        currentUser ? refreshNotifications(sessionToken, currentUser._id) : Promise.resolve(),
        refreshAdmin(sessionToken),
      ]);
      setFeedback(`Venue booking marked ${status}.`);
    });
  };

  const handlePayBooking = (bookingId: string) => {
    if (!sessionToken || !currentUser) {
      openAuthModal("login");
      return;
    }

    runAction(async () => {
      await apiRequest(`/bookings/${bookingId}`, {
        method: "PATCH",
        token: sessionToken,
        body: {
          paymentStatus: "paid",
          paymentMethod: bookingForm.paymentMethod,
          paymentReference: bookingForm.paymentReference || `${bookingForm.paymentMethod}-${new Date().getTime()}`,
        },
      });
      await Promise.all([
        refreshBookings(sessionToken, currentUser._id),
        refreshSubscriptions(sessionToken, currentUser._id),
        refreshNotifications(sessionToken, currentUser._id),
        refreshAdmin(sessionToken),
      ]);
      setFeedback("Payment confirmed and access updated.");
      setBookingForm((current) => ({ ...current, paymentReference: "" }));
    });
  };

  const handleLogMealProgress = (status: "followed" | "partial" | "missed") => {
    if (!sessionToken || !currentUser) {
      openAuthModal("login");
      return;
    }

    runAction(async () => {
      await apiRequest(`/meal-progress/user/${currentUser._id}`, {
        method: "POST",
        token: sessionToken,
        body: {
          date: todayIsoDate,
          status,
        },
      });

      await refreshMealProgress(sessionToken, currentUser._id);
      setFeedback(`Meal plan marked as ${status} for today.`);
    });
  };

  const handleCompleteMealEntry = (entryLabel: string) => {
    if (!sessionToken || !currentUser) {
      openAuthModal("login");
      return;
    }

    runAction(async () => {
      const updatedMeals = Array.from(new Set([...todayCompletedMealLabels, entryLabel]));
      const allMealsCompleted = updatedMeals.length >= todayMealPlan.entries.length;

      await apiRequest(`/meal-progress/user/${currentUser._id}`, {
        method: "POST",
        token: sessionToken,
        body: {
          date: todayIsoDate,
          status: allMealsCompleted ? "followed" : "partial",
          note: `completed:${updatedMeals.join("|")}`,
        },
      });

      await refreshMealProgress(sessionToken, currentUser._id);
      setFeedback(`${entryLabel} marked complete for today.`);
    });
  };

  const handleMarkAttendance = (bookingId: string, attendanceStatus: "attended" | "missed" | "excused") => {
    if (!sessionToken) {
      setError("Login first.");
      return;
    }

    runAction(async () => {
      await apiRequest(`/bookings/${bookingId}`, {
        method: "PATCH",
        token: sessionToken,
        body: { attendanceStatus },
      });

      await Promise.all([
        ownedTrainer ? refreshTrainerBookings(sessionToken, ownedTrainer._id) : Promise.resolve(),
        ownedShop ? refreshShopBookings(sessionToken, ownedShop._id) : Promise.resolve(),
        currentUser ? refreshBookings(sessionToken, currentUser._id) : Promise.resolve(),
      ]);

      setFeedback(`Attendance marked as ${attendanceStatus}.`);
    });
  };

  const handleStartMemberReschedule = (booking: Booking) => {
    setMemberRescheduleDraft({
      bookingId: booking._id,
      bookingDate: toDateInputValue(booking.proposedBookingDate ?? booking.bookingDate),
      timeSlot: booking.proposedTimeSlot ?? booking.timeSlot,
      reason: booking.rescheduleReason ?? "",
    });
    setError("");
    setFeedback("");
  };

  const handleSubmitMemberRescheduleRequest = () => {
    if (!sessionToken || !currentUser || !memberRescheduleDraft) {
      setError("Open a booking first.");
      return;
    }

    runAction(async () => {
      await apiRequest(`/bookings/${memberRescheduleDraft.bookingId}/reschedule`, {
        method: "POST",
        token: sessionToken,
        body: {
          action: "request",
          bookingDate: new Date(memberRescheduleDraft.bookingDate).toISOString(),
          timeSlot: memberRescheduleDraft.timeSlot,
          reason: memberRescheduleDraft.reason || "Client requested a different time.",
        },
      });

      await Promise.all([
        refreshBookings(sessionToken, currentUser._id),
        refreshNotifications(sessionToken, currentUser._id),
      ]);
      setMemberRescheduleDraft(null);
      setFeedback("Reschedule request sent. Waiting for trainer/shop response.");
    });
  };

  const handleRespondMemberReschedule = (booking: Booking, action: "approve" | "decline") => {
    if (!sessionToken || !currentUser) {
      openAuthModal("login");
      return;
    }

    runAction(async () => {
      const selectedSlotKey = memberRescheduleChoice[booking._id];
      const selectedSlot = booking.proposedSlots?.find((slot) => formatProposedSlotKey(slot.bookingDate, slot.timeSlot) === selectedSlotKey);
      await apiRequest(`/bookings/${booking._id}/reschedule`, {
        method: "POST",
        token: sessionToken,
        body: {
          action,
          ...(action === "approve" && selectedSlot ? {
            bookingDate: selectedSlot.bookingDate,
            timeSlot: selectedSlot.timeSlot,
          } : {}),
        },
      });

      await Promise.all([
        refreshBookings(sessionToken, currentUser._id),
        refreshNotifications(sessionToken, currentUser._id),
      ]);
      setMemberRescheduleChoice((current) => {
        const next = { ...current };
        delete next[booking._id];
        return next;
      });
      setFeedback(action === "approve" ? "Reschedule approved." : "Reschedule declined and session cancelled.");
    });
  };

  const handleRequestMemberCancellation = (bookingId: string) => {
    if (!sessionToken || !currentUser) {
      openAuthModal("login");
      return;
    }

    runAction(async () => {
      await apiRequest(`/bookings/${bookingId}`, {
        method: "PATCH",
        token: sessionToken,
        body: {
          status: "cancelled",
        },
      });

      await Promise.all([
        refreshBookings(sessionToken, currentUser._id),
        refreshNotifications(sessionToken, currentUser._id),
      ]);
      setFeedback("Cancellation request sent and booking updated.");
    });
  };

  const handleTrainerRescheduleAction = (booking: Booking, action: "approve" | "decline") => {
    if (!sessionToken || !ownedTrainer) {
      setError("Create a trainer profile first.");
      return;
    }

    runAction(async () => {
      await apiRequest(`/bookings/${booking._id}/reschedule`, {
        method: "POST",
        token: sessionToken,
        body: { action },
      });

      await Promise.all([
        refreshTrainerBookings(sessionToken, ownedTrainer._id),
        currentUser ? refreshBookings(sessionToken, currentUser._id) : Promise.resolve(),
      ]);

      setFeedback(action === "approve" ? "Reschedule approved for client." : "Reschedule request declined.");
    });
  };

  const handleStartTrainerBookingEdit = (booking: Booking) => {
    const existingOptions = booking.proposedSlots && booking.proposedSlots.length > 0
      ? booking.proposedSlots.slice(0, 3).map((slot) => ({
        bookingDate: toDateInputValue(slot.bookingDate),
        timeSlot: slot.timeSlot,
      }))
      : [{
        bookingDate: toDateInputValue(booking.proposedBookingDate ?? booking.bookingDate),
        timeSlot: booking.proposedTimeSlot ?? booking.timeSlot,
      }];

    setTrainerBookingDraft({
      bookingId: booking._id,
      slotOptions: Array.from({ length: 3 }, (_, index) => existingOptions[index] ?? { bookingDate: "", timeSlot: "" }),
      notes: booking.notes ?? "",
    });
    setFeedback("");
    setError("");
  };

  const handleCancelTrainerBookingEdit = () => {
    setTrainerBookingDraft(null);
  };

  const handleSaveTrainerBookingEdit = (bookingId: string) => {
    if (!sessionToken || !ownedTrainer || !trainerBookingDraft || trainerBookingDraft.bookingId !== bookingId) {
      setError("Open a trainer booking first.");
      return;
    }

    runAction(async () => {
      const proposedSlots = trainerBookingDraft.slotOptions
        .filter((slot) => slot.bookingDate && slot.timeSlot)
        .map((slot) => ({
          bookingDate: new Date(slot.bookingDate).toISOString(),
          timeSlot: slot.timeSlot,
        }));

      await apiRequest(`/bookings/${bookingId}/reschedule`, {
        method: "POST",
        token: sessionToken,
        body: {
          action: "counter",
          proposedSlots,
          reason: trainerBookingDraft.notes || "Host suggested a different time.",
        },
      });
      await Promise.all([
        refreshTrainerBookings(sessionToken, ownedTrainer._id),
        currentUser ? refreshBookings(sessionToken, currentUser._id) : Promise.resolve(),
        refreshAdmin(sessionToken),
      ]);
      setTrainerBookingDraft(null);
      setFeedback(proposedSlots.length > 1 ? "Alternative schedules sent for client selection." : "Alternative schedule sent for client approval.");
    });
  };

  const handleVerifyShop = (shopId: string, isVerified: boolean) => {
    if (!sessionToken) {
      setError("Login first.");
      return;
    }

    runAction(async () => {
      await apiRequest(`/shops/${shopId}`, {
        method: "PATCH",
        token: sessionToken,
        body: { isVerified },
      });
      await Promise.all([refreshDiscovery(), refreshAdmin(sessionToken)]);
      setFeedback(isVerified ? "Shop verified." : "Shop moved back to review.");
    });
  };

  const handleAdminBookingStatus = (bookingId: string, status: "accepted" | "completed" | "cancelled") => {
    if (!sessionToken) {
      setError("Login first.");
      return;
    }

    runAction(async () => {
      await apiRequest(`/bookings/${bookingId}`, {
        method: "PATCH",
        token: sessionToken,
        body: { status },
      });
      await refreshAdmin(sessionToken);
      setFeedback(`Booking marked ${status}.`);
    });
  };

  const handleAdminUserActive = (userId: string, isActive: boolean) => {
    if (!sessionToken) {
      setError("Login first.");
      return;
    }

    runAction(async () => {
      await apiRequest(`/users/${userId}`, {
        method: "PATCH",
        token: sessionToken,
        body: { isActive },
      });
      await refreshAdmin(sessionToken);
      setFeedback(isActive ? "User reactivated." : "User deactivated.");
    });
  };

  const handleAdminTrainerActive = (trainerId: string, isActive: boolean) => {
    if (!sessionToken) {
      setError("Login first.");
      return;
    }

    runAction(async () => {
      await apiRequest(`/trainers/${trainerId}`, {
        method: "PATCH",
        token: sessionToken,
        body: { isActive },
      });
      await Promise.all([refreshAdmin(sessionToken), refreshDiscovery()]);
      setFeedback(isActive ? "Trainer activated." : "Trainer paused.");
    });
  };

  const workspaceNextAction = !currentUser
    ? {
        eyebrow: "Access",
        title: "Login to continue",
        description: "Open your role-aware workspace after login.",
        label: "Login",
        onClick: () => openAuthModal("login"),
      }
    : showTrainerTools
      ? {
          eyebrow: "Trainer",
          title: ownedTrainer ? "Keep trainer tools current" : "Create your trainer profile",
          description: ownedTrainer ? "Publish or refine services and handle incoming sessions." : "Start by creating a trainer profile before publishing services.",
          label: ownedTrainer ? "Edit trainer profile" : "Create trainer profile",
          onClick: openTrainerProfileModal,
        }
      : showShopTools
        ? {
            eyebrow: "Venue",
            title: ownedShop ? "Keep venue tools current" : "Create your venue profile",
            description: ownedShop ? "Publish offers and process requests from one place." : "Create a venue before adding products or offers.",
            label: ownedShop ? "Edit venue" : "Create venue",
            onClick: openShopProfileModal,
          }
        : isAdmin
          ? {
              eyebrow: "Admin",
              title: "Review platform activity",
              description: "Open moderation and oversight tools.",
              label: "Open admin",
              onClick: () => setWorkspaceView("admin"),
            }
          : null;

  const header = (
    <section className="overflow-hidden rounded-[2.5rem] border border-white/10 bg-white/84 shadow-[0_30px_80px_rgba(3,10,18,0.28)] backdrop-blur-xl">
      <SiteHeader activeKey={activeHeaderKey} currentUser={currentUser} onCreateUserClick={() => openAuthModal("register")} onLoginClick={() => openAuthModal("login")} onLogout={handleLogout} />
      <div className="px-6 py-8 sm:px-8 sm:py-10 lg:px-10 lg:py-12">
        <div className={section === "home" && currentUser ? "grid gap-8" : section === "discover" && (discoverView === "overview" || discoverView === "gyms" || discoverView === "pt" || discoverView === "group") ? "grid gap-8" : "grid gap-8 lg:grid-cols-[1.15fr_0.85fr]"}>
          <div className="space-y-5">
            <h1 className={section === "discover" && discoverView === "overview" ? "max-w-none text-5xl font-black tracking-[-0.05em] text-accent-deep sm:text-6xl lg:text-[4.5rem] lg:leading-[0.95]" : "max-w-4xl text-5xl font-black tracking-[-0.05em] text-accent-deep sm:text-6xl"}>{resolvedSectionMeta.title}</h1>
            {section === "discover" && discoverView === "overview" ? null : <p className="max-w-2xl text-lg leading-8 text-muted">{resolvedSectionMeta.description}</p>}

          </div>
          {section === "home" ? currentUser ? null : <div className="grid gap-4 rounded-[1.9rem] bg-[linear-gradient(145deg,_rgba(255,255,255,0.88),_rgba(215,255,63,0.16))] p-5 shadow-[0_24px_60px_rgba(3,10,18,0.18)] sm:p-6"><div className="rounded-[1.6rem] bg-accent-deep px-6 py-6 text-surface shadow-[0_18px_44px_rgba(8,19,32,0.24)]"><p className="text-sm uppercase tracking-[0.18em] text-surface/70">Fithub overview</p><p className="mt-3 text-3xl font-bold tracking-[-0.04em]">Gyms, trainers, classes, and one place to manage bookings.</p><div className="mt-6 flex flex-wrap gap-3"><button className="rounded-full border border-accent/70 bg-accent px-6 py-3 text-base font-semibold uppercase tracking-[0.12em] text-accent-deep shadow-[0_14px_30px_rgba(215,255,63,0.24)] transition-transform hover:-translate-y-0.5" onClick={() => openAuthModal("login")} type="button">Login</button><button className="rounded-full border border-white/16 bg-white/10 px-6 py-3 text-base font-semibold uppercase tracking-[0.12em] text-surface transition-colors hover:bg-white/16" onClick={() => openAuthModal("register")} type="button">Create user</button></div></div><div className="grid gap-4 sm:grid-cols-3"><article className="rounded-[1.5rem] border border-white/20 bg-white/88 px-5 py-5 shadow-[0_12px_28px_rgba(8,19,32,0.08)]"><p className="text-xs uppercase tracking-[0.18em] text-muted">Book</p><p className="mt-3 text-lg font-bold tracking-[-0.03em] text-accent-deep">PT sessions and classes</p></article><article className="rounded-[1.5rem] border border-white/20 bg-white/88 px-5 py-5 shadow-[0_12px_28px_rgba(8,19,32,0.08)]"><p className="text-xs uppercase tracking-[0.18em] text-muted">Track</p><p className="mt-3 text-lg font-bold tracking-[-0.03em] text-accent-deep">Meals, access, and updates</p></article><article className="rounded-[1.5rem] border border-white/20 bg-white/88 px-5 py-5 shadow-[0_12px_28px_rgba(8,19,32,0.08)]"><p className="text-xs uppercase tracking-[0.18em] text-muted">Manage</p><p className="mt-3 text-lg font-bold tracking-[-0.03em] text-accent-deep">Member, trainer, and venue tools</p></article></div></div> : section === "discover" && discoverView === "overview" ? <div className="grid gap-4">
            <Link className="group relative overflow-hidden rounded-[1.9rem] border border-black/6 shadow-[0_20px_50px_rgba(18,33,23,0.08)]" href={overviewCards[0].href}>
              <Image alt="Fitness illustration" className="h-44 w-full object-cover transition-transform duration-300 group-hover:scale-[1.03] sm:h-48 lg:h-52" height={760} priority src="/fitness-hero.svg" width={1200} />
              <div className="absolute inset-0 bg-gradient-to-t from-[#123322] via-[#123322]/70 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-6 text-surface sm:p-7">
                <p className="text-4xl font-bold tracking-[-0.04em] sm:text-5xl">{overviewCards[0].title}</p>
              </div>
            </Link>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {overviewCards.slice(1).map((card) => <Link key={card.title} className="flex min-h-32 items-end rounded-[1.7rem] border border-black/6 bg-white px-6 py-6 shadow-[0_16px_35px_rgba(18,33,23,0.06)] transition-transform hover:-translate-y-0.5 hover:border-accent/25 sm:min-h-36" href={card.href}><p className="text-2xl font-bold tracking-[-0.03em] text-accent-deep sm:text-[2rem]">{card.title}</p></Link>)}
              {upcomingOverviewCards.map((card) => card.enabled ? <Link key={card.title} className="flex min-h-28 items-end rounded-[1.7rem] border border-black/6 bg-[linear-gradient(180deg,_rgba(255,255,255,0.94),_rgba(244,234,220,0.9))] px-6 py-6 text-left shadow-[0_16px_35px_rgba(18,33,23,0.05)] transition-transform hover:-translate-y-0.5 hover:border-accent/25 sm:min-h-32" href={card.href}><p className="text-2xl font-bold tracking-[-0.03em] text-accent-deep">{card.title}</p></Link> : <button key={card.title} className="flex min-h-28 cursor-default items-end rounded-[1.7rem] border border-black/6 bg-[linear-gradient(180deg,_rgba(255,255,255,0.94),_rgba(244,234,220,0.9))] px-6 py-6 text-left shadow-[0_16px_35px_rgba(18,33,23,0.05)] sm:min-h-32" disabled type="button"><p className="text-2xl font-bold tracking-[-0.03em] text-accent-deep">{card.title}</p></button>)}
            </div>
          </div> : section === "discover" && (discoverView === "gyms" || discoverView === "pt" || discoverView === "group") ? null : <div className="grid gap-4 rounded-[1.9rem] bg-[linear-gradient(145deg,_rgba(255,255,255,0.84),_rgba(215,255,63,0.14))] p-5 shadow-[0_24px_60px_rgba(3,10,18,0.18)] sm:p-6">
            <div className="rounded-[1.6rem] bg-accent-deep px-6 py-6 text-surface">
              <p className="text-sm uppercase tracking-[0.18em] text-surface/70">Fithub</p>
              <p className="mt-3 text-3xl font-bold tracking-[-0.04em]">Personal training, group programs, and gym discovery in one calm flow.</p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link className="rounded-full border border-accent/70 bg-accent px-6 py-3 text-base font-semibold uppercase tracking-[0.12em] text-accent-deep shadow-[0_14px_30px_rgba(215,255,63,0.24)] transition-transform hover:-translate-y-0.5" href="/discover?view=pt">Book a PT session</Link>
              </div>
            </div>
          </div>}
        </div>
      </div>
    </section>
  );

  const notice = (
    <div aria-live="polite" className="grid gap-3">
      {feedback ? <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-lime-300/70 bg-lime-100 px-4 py-3 text-sm text-lime-900"><span>{feedback}</span>{currentUser && pathname === "/auth" ? <Link className={secondaryButtonClass} href="/manage">Go to manage</Link> : null}</div> : null}
      {error ? <div className="rounded-2xl border border-rose-300/70 bg-rose-100 px-4 py-3 text-sm text-rose-700">{error}</div> : null}
    </div>
  );

  const landingSection = (
    <section className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
      <div className="grid gap-6">
        <div className="relative overflow-hidden rounded-[2.2rem] border border-white/12 bg-[radial-gradient(circle_at_top_left,_rgba(215,255,63,0.18),_transparent_36%),radial-gradient(circle_at_bottom_right,_rgba(255,106,44,0.18),_transparent_34%),linear-gradient(155deg,_#081520_0%,_#103024_48%,_#1d4f39_100%)] p-8 text-surface shadow-[0_28px_70px_rgba(3,10,18,0.34)] sm:p-10">
          <div className="absolute inset-x-0 top-0 h-44 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.18),_transparent_72%)]" />
          <div className="relative grid gap-8">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="max-w-3xl">
                <p className="text-sm uppercase tracking-[0.22em] text-surface/64">Fithub landing</p>
                <h2 className="mt-4 text-4xl font-black tracking-[-0.05em] text-surface sm:text-5xl lg:text-[3.8rem] lg:leading-[0.95]">A sharper way to discover gyms, book coaching, and run your fitness day.</h2>
                <p className="mt-4 max-w-2xl text-base leading-8 text-surface/78">Start on a proper landing page, see what the platform can do, then login or create an account when you are ready to move.</p>
              </div>
              <div className="rounded-[1.5rem] border border-white/12 bg-white/10 px-5 py-4 backdrop-blur-sm">
                <p className="text-xs uppercase tracking-[0.18em] text-surface/62">Live focus</p>
                <p className="mt-3 text-2xl font-bold tracking-[-0.04em] text-surface">Book, train, manage</p>
                <p className="mt-2 text-sm leading-7 text-surface/72">One flow for members, trainers, venues, and admins.</p>
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
              <div className="rounded-[1.8rem] border border-white/12 bg-white/10 p-6 backdrop-blur-sm">
                <div className="flex flex-wrap gap-3">
                  <button className="rounded-full border border-accent/70 bg-accent px-5 py-3 text-sm font-semibold uppercase tracking-[0.12em] text-accent-deep shadow-[0_14px_30px_rgba(215,255,63,0.24)] transition-transform hover:-translate-y-0.5" onClick={() => openAuthModal("login")} type="button">Login</button>
                  <button className="rounded-full border border-white/14 bg-white/10 px-5 py-3 text-sm font-semibold uppercase tracking-[0.12em] text-surface transition-colors hover:bg-white/16" onClick={() => openAuthModal("register")} type="button">Create user</button>
                  <Link className="rounded-full border border-white/14 bg-white/10 px-5 py-3 text-sm font-semibold uppercase tracking-[0.12em] text-surface transition-colors hover:bg-white/16" href="/discover?view=overview">Preview discover</Link>
                </div>
                <div className="mt-6 grid gap-4 sm:grid-cols-3">
                  {[{
                    label: "Find your place",
                    title: "Compare gyms and coaching offers",
                    copy: "Browse venues, classes, PT offers, and team programs without getting lost in admin screens.",
                  }, {
                    label: "Move faster",
                    title: "Request bookings in one clean flow",
                    copy: "Pick a trainer, slot, and setup, then continue from the same workspace after login.",
                  }, {
                    label: "Stay organized",
                    title: "Keep profile, access, and updates together",
                    copy: "Your role decides what opens next, so members and operators do not share the same clutter.",
                  }].map((item) => <article key={item.label} className="rounded-[1.5rem] border border-white/12 bg-black/10 px-5 py-5 shadow-[0_16px_36px_rgba(3,10,18,0.14)] transition-transform hover:-translate-y-1"><p className="text-xs uppercase tracking-[0.18em] text-surface/62">{item.label}</p><p className="mt-3 text-lg font-bold tracking-[-0.03em] text-surface">{item.title}</p><p className="mt-3 text-sm leading-7 text-surface/74">{item.copy}</p></article>)}
                </div>
              </div>

              <div className="rounded-[1.8rem] border border-white/12 bg-[linear-gradient(180deg,_rgba(255,255,255,0.14),_rgba(255,255,255,0.06))] p-6 backdrop-blur-sm">
                <p className="text-xs uppercase tracking-[0.18em] text-surface/62">How the flow feels</p>
                <div className="mt-5 grid gap-3">
                  {["Explore gyms, trainers, and classes from one branded entry point.", "Login to reopen your role-based dashboard, bookings, and profile details.", "Create a user from the same landing page when you need a new account."].map((step, index) => <div key={step} className="flex gap-4 rounded-[1.4rem] border border-white/10 bg-white/8 px-4 py-4"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-black text-accent-deep">0{index + 1}</span><p className="text-sm leading-7 text-surface/76">{step}</p></div>)}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          {[{
            eyebrow: "Members",
            title: "Track sessions and access",
            copy: "See active bookings, payment steps, meal plans, and profile updates in one calm dashboard.",
            href: "/discover?view=gyms",
            label: "See gyms",
          }, {
            eyebrow: "Trainers",
            title: "Publish offers and manage requests",
            copy: "Run PT schedules, accept requests, and keep your coaching profile visible without crowding the page.",
            href: "/discover?view=pt",
            label: "See PT",
          }, {
            eyebrow: "Venues",
            title: "List classes, passes, and events",
            copy: "Share memberships, ladies hours, classes, and venue details from a role-aware workspace.",
            href: "/discover?view=group",
            label: "See programs",
          }].map((item) => <article key={item.eyebrow} className="rounded-[1.8rem] border border-white/10 bg-white/84 p-6 shadow-[0_20px_45px_rgba(3,10,18,0.12)] backdrop-blur-xl"><p className="text-xs uppercase tracking-[0.18em] text-muted">{item.eyebrow}</p><h3 className="mt-3 text-2xl font-bold tracking-[-0.04em] text-accent-deep">{item.title}</h3><p className="mt-3 text-sm leading-7 text-muted">{item.copy}</p><Link className="mt-5 inline-flex rounded-full border border-black/10 bg-background px-4 py-2 text-sm font-semibold uppercase tracking-[0.12em] text-accent-deep transition-colors hover:border-accent hover:bg-accent" href={item.href}>{item.label}</Link></article>)}
        </div>
      </div>

      <div className="grid gap-6">
        <div className="rounded-[2.2rem] border border-white/10 bg-white/90 p-6 shadow-[0_24px_60px_rgba(3,10,18,0.18)] backdrop-blur-xl sm:p-8">
          <p className="text-sm uppercase tracking-[0.2em] text-muted">Access</p>
          <h3 className="mt-3 text-3xl font-bold tracking-[-0.04em] text-accent-deep">Use one modal for login or account creation.</h3>
          <p className="mt-3 text-sm leading-7 text-muted">The landing page stays clean. Open the shared modal when you want to login or create a user.</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <button className={primaryButtonClass} onClick={() => openAuthModal("login")} type="button">Login</button>
            <button className={secondaryButtonClass} onClick={() => openAuthModal("register")} type="button">Create user</button>
          </div>
        </div>

        <div className="grid gap-3 rounded-[2rem] border border-white/10 bg-[linear-gradient(145deg,_rgba(255,255,255,0.92),_rgba(215,255,63,0.14))] p-6 shadow-[0_20px_48px_rgba(3,10,18,0.14)]">
          {[
            "Preview gyms, personal trainers, and group programs before login.",
            "Use the same modal for Login and Create user from every guest CTA.",
            "Open your dashboard after login to manage bookings, meals, and profile details.",
          ].map((item) => <div key={item} className="rounded-[1.4rem] border border-black/8 bg-white/78 px-4 py-4 text-sm text-muted">{item}</div>)}
        </div>
      </div>
    </section>
  );

  const homeSection = (
    <section className="grid gap-6">
      {!currentUser ? (
        <div className="grid gap-6 xl:grid-cols-[1.12fr_0.88fr]">
          <div className="grid gap-6">
            <div className="rounded-[2rem] border border-white/10 bg-white/84 p-8 shadow-[0_24px_60px_rgba(3,10,18,0.18)] backdrop-blur-xl sm:p-10">
              <p className="text-sm uppercase tracking-[0.2em] text-muted">Home</p>
              <h2 className="mt-3 text-3xl font-bold tracking-[-0.03em] text-accent-deep">Your fitness workspace in one place</h2>
              <div className="mt-6 flex flex-wrap gap-3">
                <button className="rounded-full border border-accent/70 bg-accent px-5 py-3 text-sm font-semibold uppercase tracking-[0.12em] text-accent-deep shadow-[0_14px_30px_rgba(215,255,63,0.24)]" onClick={() => openAuthModal("login")} type="button">Login</button>
                <Link className="rounded-full border border-white/12 bg-white/88 px-5 py-3 text-sm font-semibold uppercase tracking-[0.12em] text-accent-deep" href="/discover?view=pt">Explore trainers</Link>
              </div>
            </div>
          </div>

          <div className="grid gap-6">
            <div className="rounded-[2rem] border border-white/10 bg-white/84 p-8 shadow-[0_24px_60px_rgba(3,10,18,0.18)] backdrop-blur-xl sm:p-10">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm uppercase tracking-[0.2em] text-muted">Now actions</p>
                <button className="rounded-full border border-black/10 bg-background px-4 py-2 text-sm font-semibold uppercase tracking-[0.12em] text-accent-deep transition-colors hover:border-accent hover:bg-accent" onClick={() => setIsQuickActionsOpen(true)} type="button">Quick actions</button>
              </div>
              <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                {dashboardQuickLinks.slice(0, 6).map((item) => (
                  <Link key={item.title} className="rounded-[1.5rem] border border-white/16 bg-white/78 px-5 py-4 text-left shadow-[0_12px_28px_rgba(8,19,32,0.08)] transition-transform hover:-translate-y-0.5 hover:border-accent/50 hover:bg-[rgba(215,255,63,0.14)]" href={item.href}>
                    <p className="text-base font-semibold text-accent-deep">{item.title}</p>
                  </Link>
                ))}
              </div>
            </div>

            <div className="rounded-[2rem] border border-white/10 bg-white/84 p-8 shadow-[0_24px_60px_rgba(3,10,18,0.18)] backdrop-blur-xl sm:p-10">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm uppercase tracking-[0.2em] text-muted">Next</p>
                <Link className="rounded-full border border-black/10 bg-background px-4 py-2 text-sm font-semibold uppercase tracking-[0.12em] text-accent-deep transition-colors hover:border-accent hover:bg-accent" href="/#notifications">Open dashboard</Link>
              </div>
              <div className="mt-6 grid gap-3">
                {activityFeed.length > 0 ? activityFeed.slice(0, 4).map((item) => (
                  <Link key={item.id} className="rounded-[1.5rem] border border-white/16 bg-white/78 px-5 py-4 shadow-[0_12px_28px_rgba(8,19,32,0.08)] transition-transform hover:-translate-y-0.5 hover:border-accent/50 hover:bg-[rgba(215,255,63,0.14)]" href={item.href}>
                    <p className={`text-sm font-semibold uppercase tracking-[0.16em] ${item.accent}`}>{item.title}</p>
                    <p className="mt-1 text-sm text-muted">{item.description}</p>
                  </Link>
                )) : <div className="rounded-[1.5rem] border border-dashed border-white/18 bg-white/62 p-6 text-sm text-muted">No recent activity.</div>}
              </div>
            </div>

            <div className="rounded-[2rem] border border-white/10 bg-white/84 p-8 shadow-[0_24px_60px_rgba(3,10,18,0.18)] backdrop-blur-xl sm:p-10">
              <p className="text-sm uppercase tracking-[0.2em] text-muted">Later</p>
              {isAdmin ? <div className="mt-4 rounded-[1.6rem] bg-background p-5"><p className="text-sm font-semibold text-accent-deep">Platform</p><p className="mt-3 text-2xl font-bold tracking-[-0.03em] text-accent-deep">{adminDashboard?.metrics.trainers ?? 0} trainers · {adminDashboard?.metrics.shops ?? 0} shops</p></div> : null}
              {!isAdmin && spotlightTrainer ? <div className="mt-4 rounded-[1.6rem] bg-background p-5"><p className="text-sm font-semibold text-accent-deep">Trainer</p><p className="mt-3 text-2xl font-bold tracking-[-0.03em] text-accent-deep">{spotlightTrainer.userId?.name ?? "Assigned trainer"}</p><p className="mt-2 text-sm text-muted">{spotlightTrainer.specialties.join(", ") || "General fitness"}</p></div> : null}
              {ownedShop ? <div className="mt-4 rounded-[1.6rem] bg-background p-5"><p className="text-sm font-semibold text-accent-deep">Venue</p><p className="mt-3 text-2xl font-bold tracking-[-0.03em] text-accent-deep">{ownedShop.shopName}</p><p className="mt-2 text-sm text-muted">{ownedShop.location || "Location pending"}</p></div> : null}
              {!spotlightTrainer && !ownedShop ? <div className="mt-4 rounded-[1.6rem] bg-background p-5"><p className="text-sm font-semibold text-accent-deep">Profile</p><p className="mt-3 text-2xl font-bold tracking-[-0.03em] text-accent-deep">{currentUserName}</p><p className="mt-2 text-sm text-muted">{currentUser ? `${currentUserEmail} · ${roleLabel}` : "Login"}</p></div> : null}
              {currentUser && !isAdmin ? <div className="mt-4 rounded-[1.6rem] bg-background p-5"><p className="text-sm font-semibold text-accent-deep">Latest booking</p><p className="mt-3 text-2xl font-bold tracking-[-0.03em] text-accent-deep">{latestMemberBooking ? latestMemberBooking.status.replaceAll("_", " ") : "None"}</p></div> : null}
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <article className="rounded-[1.5rem] border border-black/6 bg-background px-5 py-5">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted">Access</p>
                  <p className="mt-3 text-xl font-bold tracking-[-0.03em] text-accent-deep">{isAdmin ? `${adminDashboard?.metrics.services ?? 0} services live` : hasShopAccess ? `${ownedShopVenueServices.length} venue offer${ownedShopVenueServices.length === 1 ? "" : "s"}` : `${bookings.filter((booking) => booking.paymentStatus === "paid").length} paid booking${bookings.filter((booking) => booking.paymentStatus === "paid").length === 1 ? "" : "s"}`}</p>
                </article>
                <article className="rounded-[1.5rem] border border-black/6 bg-background px-5 py-5">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted">Today</p>
                  <p className="mt-3 text-xl font-bold tracking-[-0.03em] text-accent-deep">{isAdmin ? `${adminRecentSchedule.length} booking${adminRecentSchedule.length === 1 ? "" : "s"}` : homeShowsTrainerView ? `${todaysTrainerServiceSlots.length} slot${todaysTrainerServiceSlots.length === 1 ? "" : "s"}` : hasShopAccess ? `${todayVenueHours.length} venue hour${todayVenueHours.length === 1 ? "" : "s"}` : `${upcomingMemberBookings.length} upcoming`}</p>
                </article>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid gap-6">
          {!isAdmin && homeShowsMemberView && nextMemberSessionDetails ? (
            <div className="rounded-[2.2rem] border-2 border-accent bg-[linear-gradient(135deg,_rgba(215,255,63,0.1),_rgba(215,255,63,0.04))] p-8 shadow-[0_24px_60px_rgba(215,255,63,0.25)] backdrop-blur-xl">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="mb-2 inline-block rounded-full bg-accent/20 px-3 py-1">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent-deep">🚀 NEXT SESSION</p>
                  </div>
                  <h3 className="mt-4 text-3xl font-bold tracking-[-0.03em] text-accent-deep">{nextMemberSessionDetails.title}</h3>
                  <div className="mt-6 grid gap-4 sm:grid-cols-3">
                    <div className="rounded-[1.2rem] bg-white/40 px-4 py-3 backdrop-blur">
                      <p className="text-xs uppercase tracking-[0.14em] text-muted">Time</p>
                      <p className="mt-2 font-semibold text-accent-deep">{nextMemberSessionDetails.time}</p>
                    </div>
                    <div className="rounded-[1.2rem] bg-white/40 px-4 py-3 backdrop-blur">
                      <p className="text-xs uppercase tracking-[0.14em] text-muted">Trainer</p>
                      <p className="mt-2 font-semibold text-accent-deep">{nextMemberSessionDetails.trainer}</p>
                    </div>
                    <div className="rounded-[1.2rem] bg-white/40 px-4 py-3 backdrop-blur">
                      <p className="text-xs uppercase tracking-[0.14em] text-muted">Venue</p>
                      <p className="mt-2 font-semibold text-accent-deep">{nextMemberSessionDetails.venue}</p>
                    </div>
                  </div>
                  <p className="mt-4 text-sm capitalize text-muted">Status: {nextMemberSessionDetails.status.replaceAll("_", " ")}</p>
                </div>
              </div>
            </div>
          ) : null}

          <div className="grid gap-3 rounded-[1.6rem] bg-white/50 p-4 backdrop-blur">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-muted">Dashboard Layout</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setDashboardLayout("stacked")}
                  className={`rounded-lg border px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] transition-colors ${
                    dashboardLayout === "stacked"
                      ? "border-accent bg-accent text-accent-deep"
                      : "border-black/10 bg-white text-accent-deep hover:border-accent"
                  }`}
                >
                  Stacked
                </button>
                <button
                  onClick={() => setDashboardLayout("side-by-side")}
                  className={`rounded-lg border px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] transition-colors ${
                    dashboardLayout === "side-by-side"
                      ? "border-accent bg-accent text-accent-deep"
                      : "border-black/10 bg-white text-accent-deep hover:border-accent"
                  }`}
                >
                  Side-by-side
                </button>
              </div>
            </div>
            {canToggleHomeRole ? (
              <div className="flex items-center justify-between gap-3 rounded-xl border border-black/8 bg-white/80 px-3 py-3">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Home perspective</p>
                <div className="flex gap-2">
                  <button
                    className={`rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] ${homeRoleView === "trainer" ? "border-accent bg-accent text-accent-deep" : "border-black/10 bg-white text-accent-deep"}`}
                    onClick={() => setHomeRoleView("trainer")}
                    type="button"
                  >
                    Trainer view
                  </button>
                  <button
                    className={`rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] ${homeRoleView === "member" ? "border-accent bg-accent text-accent-deep" : "border-black/10 bg-white text-accent-deep"}`}
                    onClick={() => setHomeRoleView("member")}
                    type="button"
                  >
                    Member view
                  </button>
                </div>
              </div>
            ) : null}
          </div>

          <div className={`grid gap-6 ${homeShowsMemberView || dashboardLayout === "stacked" ? "" : "lg:grid-cols-2"}`}>
            <div className="rounded-[1.6rem] border border-black/8 bg-[#f6faf7] p-5 shadow-[0_8px_18px_rgba(8,19,32,0.05)]">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-accent-deep">{roleNowPanel.title}</p>
                <Link className="rounded-full border border-accent/40 bg-white/85 px-4 py-2 text-sm font-semibold uppercase tracking-[0.12em] text-accent-deep hover:bg-accent" href={roleNowPanel.ctaHref}>{roleNowPanel.ctaLabel}</Link>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                {roleNowPanel.highlights.map((item) => (
                  <article key={`${item.label}-${item.value}`} className="rounded-2xl border border-black/8 bg-[#eef3ef] px-4 py-4">
                    <p className="text-xs uppercase tracking-[0.16em] text-muted">{item.label}</p>
                    <p className="mt-2 text-lg font-semibold text-accent-deep">{item.value}</p>
                    <p className="mt-1 text-xs text-muted">{item.note}</p>
                  </article>
                ))}
              </div>
              <div className="mt-4 grid gap-3">
                {isAdmin && adminRecentSchedule.length > 0 ? adminRecentSchedule.slice(0, 3).map((booking) => (
                  <article key={booking._id} className="rounded-2xl border border-black/8 bg-white px-4 py-4 shadow-[0_8px_16px_rgba(8,19,32,0.04)]">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-semibold text-accent-deep">{booking.serviceId?.title ?? "Recent booking"}</p>
                      <span className="text-xs uppercase tracking-[0.18em] text-muted">{booking.status}</span>
                    </div>
                    <p className="mt-2 text-sm text-muted">{new Date(booking.bookingDate).toLocaleDateString()} · {booking.timeSlot}</p>
                  </article>
                )) : null}
                {!isAdmin && homeShowsMemberView && completedMemberBookings.length > 0 ? completedMemberBookings.slice(0, 3).map((booking) => (
                  <article key={booking._id} className="rounded-2xl border border-black/8 bg-white px-4 py-4 shadow-[0_8px_16px_rgba(8,19,32,0.04)]">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-semibold text-accent-deep">{booking.serviceId?.title ?? "Booking"}</p>
                      <span className="text-xs uppercase tracking-[0.18em] text-muted">{booking.status}</span>
                    </div>
                    <p className="mt-2 text-sm text-muted">{new Date(booking.bookingDate).toLocaleDateString()} · {booking.timeSlot}</p>
                  </article>
                )) : null}
                {!isAdmin && homeShowsTrainerView && upcomingTrainerSessions.length > 0 ? upcomingTrainerSessions.slice(0, 3).map((booking) => (
                  <article key={booking._id} className="rounded-2xl border border-black/8 bg-white px-4 py-4 shadow-[0_8px_16px_rgba(8,19,32,0.04)]">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-semibold text-accent-deep">{booking.serviceId?.title ?? "Trainer session"}</p>
                      <span className="text-xs uppercase tracking-[0.18em] text-muted">{booking.status}</span>
                    </div>
                    <p className="mt-2 text-sm text-muted">{new Date(booking.bookingDate).toLocaleDateString()} · {booking.timeSlot}</p>
                  </article>
                )) : null}
                {!isAdmin && showShopTools && todayVenueHours.length > 0 ? todayVenueHours.slice(0, 3).map((item) => (
                  <article key={`${item.serviceId}-${item.slot.day}-${item.slot.startTime}`} className="rounded-2xl border border-black/8 bg-white px-4 py-4 shadow-[0_8px_16px_rgba(8,19,32,0.04)]">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-semibold text-accent-deep">{item.title}</p>
                      {item.audience === "ladies" ? <span className="rounded-full bg-[#ffd166] px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-accent-deep">Ladies hour</span> : null}
                    </div>
                    <p className="mt-2 text-sm text-muted">{item.slot.day} {item.slot.startTime}-{item.slot.endTime}</p>
                  </article>
                )) : null}
                {!showMemberTools && !showTrainerTools && !showShopTools ? <div className="rounded-[1.5rem] border border-dashed border-black/10 bg-white p-6 text-sm text-muted">Login to see your schedule.</div> : null}
                {!isAdmin && homeShowsMemberView && completedMemberBookings.length === 0 ? <div className="rounded-[1.5rem] border border-dashed border-black/10 bg-white p-6 text-sm text-muted">No completed bookings yet.</div> : null}
              </div>
            </div>

            <div className="rounded-[1.6rem] border border-black/8 bg-[#f6faf7] p-5 shadow-[0_8px_18px_rgba(8,19,32,0.05)]">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-accent-deep">Next meals</p>
                <Link className="rounded-full border border-accent/40 bg-white/85 px-4 py-2 text-sm font-semibold uppercase tracking-[0.12em] text-accent-deep hover:bg-accent" href={`/meal-plans?returnTo=${encodeURIComponent(returnToCurrentPage)}`}>Open meals</Link>
              </div>
              <div className="mt-4 rounded-[1.5rem] border border-black/8 bg-[#eef3ef] px-4 py-4">
                <p className="text-xs uppercase tracking-[0.18em] text-muted">Focus</p>
                <p className="mt-2 text-lg font-semibold text-accent-deep">{todayMealPlan.focus}</p>
              </div>
              <div className="mt-4 rounded-2xl border border-black/8 bg-white px-4 py-4">
                <p className="text-sm font-semibold text-accent-deep">Today meal check-in</p>
                <p className="mt-2 text-xs leading-6 text-muted">Mark each meal as you complete it. This records only today. To update a different date, open Meal plans.</p>
              </div>
              <div className="mt-4 grid gap-3">
                {todayMealPlan.entries.map((entry) => {
                  const mealCompleted = todayCompletedMealLabels.includes(entry.label);
                  return (
                  <article key={`${todayLabel}-${entry.label}`} className="rounded-2xl border border-black/8 bg-white px-4 py-4 shadow-[0_8px_16px_rgba(8,19,32,0.04)]">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-semibold text-accent-deep">{entry.label}</p>
                      <p className="text-sm text-muted">{entry.time}</p>
                    </div>
                    <p className="mt-2 text-sm text-muted">{entry.summary}</p>
                    <div className="mt-3 flex justify-end">
                      <button className={mealCompleted ? "rounded-full border border-lime-300/70 bg-lime-100 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-[#1c5d45]" : "rounded-full border border-black/10 bg-white px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-accent-deep transition-colors hover:border-accent hover:bg-accent"} disabled={mealCompleted} onClick={() => handleCompleteMealEntry(entry.label)} type="button">
                        {mealCompleted ? "Completed" : `Mark ${entry.label} complete`}
                      </button>
                    </div>
                  </article>
                  );
                })}
              </div>
            </div>

            {!isAdmin && homeShowsMemberView ? (
              <div className={`rounded-[1.6rem] border border-black/8 bg-[#f6faf7] p-5 shadow-[0_8px_18px_rgba(8,19,32,0.05)] ${dashboardLayout === "side-by-side" && !homeShowsMemberView ? "lg:col-span-2" : ""}`}>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-accent-deep">Body measurement progress</p>
                    <p className="mt-1 text-xs uppercase tracking-[0.16em] text-muted">Member home view</p>
                  </div>
                  <button className={primaryButtonClass} onClick={() => setIsMemberMeasurementModalOpen(true)} type="button">Add measurement</button>
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-4">
                  <article className="rounded-2xl border border-black/8 bg-[#eef3ef] px-4 py-4"><p className="text-xs uppercase tracking-[0.16em] text-muted">Latest weight</p><p className="mt-2 text-lg font-semibold text-accent-deep">{typeof memberMeasurementSnapshot.latest?.weightKg === "number" ? `${memberMeasurementSnapshot.latest.weightKg.toFixed(1)} kg` : "Not logged"}</p></article>
                  <article className="rounded-2xl border border-black/8 bg-[#eef3ef] px-4 py-4"><p className="text-xs uppercase tracking-[0.16em] text-muted">Latest waist</p><p className="mt-2 text-lg font-semibold text-accent-deep">{typeof memberMeasurementSnapshot.latest?.waistCm === "number" ? `${memberMeasurementSnapshot.latest.waistCm.toFixed(1)} cm` : "Not logged"}</p></article>
                  <article className="rounded-2xl border border-black/8 bg-[#eef3ef] px-4 py-4"><p className="text-xs uppercase tracking-[0.16em] text-muted">Weight delta</p><p className="mt-2 text-lg font-semibold text-accent-deep">{memberMeasurementSnapshot.weightChange !== null ? `${memberMeasurementSnapshot.weightChange > 0 ? "+" : ""}${memberMeasurementSnapshot.weightChange.toFixed(1)} kg` : "No change yet"}</p></article>
                  <article className="rounded-2xl border border-black/8 bg-[#eef3ef] px-4 py-4"><p className="text-xs uppercase tracking-[0.16em] text-muted">Waist delta</p><p className="mt-2 text-lg font-semibold text-accent-deep">{memberMeasurementSnapshot.waistChange !== null ? `${memberMeasurementSnapshot.waistChange > 0 ? "+" : ""}${memberMeasurementSnapshot.waistChange.toFixed(1)} cm` : "No change yet"}</p></article>
                </div>
                <div className="mt-4 grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
                  {trainerMeasurementMetrics.map((metric) => (
                    <MeasurementTrendChart
                      key={`member-${metric.title}`}
                      accessor={metric.accessor}
                      items={bodyMeasurements}
                      stroke={metric.stroke}
                      title={metric.title}
                      unit={metric.unit}
                    />
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </section>
  );

  const authSection = (
    <section className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
      <div className="relative overflow-hidden rounded-[2.2rem] bg-[radial-gradient(circle_at_top_left,_rgba(215,255,63,0.18),_transparent_34%),linear-gradient(155deg,_#0b1827_0%,_#123322_48%,_#1a4731_100%)] p-8 text-surface shadow-[0_28px_70px_rgba(3,10,18,0.3)] sm:p-10">
        <div className="absolute inset-x-0 top-0 h-40 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.14),_transparent_68%)]" />
        <div className="relative">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-surface/62">Authentication</p>
              <h2 className="mt-3 max-w-xl text-4xl font-black tracking-[-0.05em] text-surface">A calmer entry point for every role.</h2>
              <p className="mt-4 max-w-xl text-sm leading-7 text-surface/74">Create your account with the required medical details in one guided flow, or jump straight back in without hunting for the right action.</p>
            </div>
            <span className="rounded-full border border-white/12 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-surface/84">{isWorking || isPending ? "Working" : "Ready"}</span>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {stats.map((item) => (
              <article key={item.label} className="rounded-[1.5rem] border border-white/10 bg-white/10 px-5 py-5 backdrop-blur-sm">
                <p className="text-xs uppercase tracking-[0.18em] text-surface/60">{item.label}</p>
                <p className="mt-3 text-3xl font-black tracking-[-0.04em] text-surface">{item.value}</p>
              </article>
            ))}
          </div>

          <div className="mt-8 rounded-[1.6rem] border border-white/10 bg-white/8 p-5 text-sm leading-7 text-surface/76 backdrop-blur-sm">
            {currentUser ? `${currentUser.email} is active now. Your workspace stays role-aware until you sign out.` : "Login to return to your workspace, or use the create user button on the right to open a new account."}
            {currentUser ? <div className="mt-5"><button className="rounded-full bg-surface px-5 py-3 text-sm font-semibold text-accent-deep transition-transform hover:-translate-y-0.5" onClick={handleLogout} type="button">Sign out</button></div> : null}
          </div>
        </div>
      </div>

      <div className="rounded-[2.2rem] border border-white/10 bg-white/88 p-6 shadow-[0_24px_60px_rgba(3,10,18,0.18)] backdrop-blur-xl sm:p-8">
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-black/6 pb-6">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-muted">Account access</p>
            <h3 className="mt-3 text-3xl font-bold tracking-[-0.04em] text-accent-deep">Pick up where you left off.</h3>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-muted">Keep login quick here, then use the create user button below if you need a new account.</p>
          </div>
          <div className="rounded-[1.4rem] border border-accent/20 bg-[rgba(215,255,63,0.12)] px-4 py-3 text-sm font-semibold text-accent-deep">
            {currentUser ? `Signed in as ${currentUser.name}` : "Simple access"}
          </div>
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,0.9fr)_minmax(320px,0.72fr)] xl:justify-end xl:items-start">
          <div className="hidden xl:block" />

          <div className="grid gap-5 xl:sticky xl:top-6">
            <form className="grid gap-5 rounded-[1.8rem] border border-black/6 bg-[linear-gradient(180deg,_rgba(246,247,252,0.96),_rgba(255,255,255,0.92))] p-6 shadow-[0_18px_40px_rgba(8,19,32,0.08)] sm:p-7" id="sign-in" onSubmit={handleLogin}>
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.12em] text-accent-deep">Login</p>
                <p className="mt-2 text-sm leading-7 text-muted">Return to your role-specific workspace without repeating the registration flow.</p>
              </div>
              <label className="grid gap-2"><span className={fieldLabelClass}>Email</span><input className={formFieldClass} type="email" required value={loginForm.email} onChange={(event) => setLoginForm((current) => ({ ...current, email: event.target.value }))} /></label>
              <label className="grid gap-2"><span className={fieldLabelClass}>Password</span><input className={formFieldClass} type="password" required minLength={8} value={loginForm.password} onChange={(event) => setLoginForm((current) => ({ ...current, password: event.target.value }))} /></label>
              <button className={primaryButtonClass} disabled={isWorking || isPending} type="submit">{isWorking || isPending ? "Logging in..." : "Login"}</button>
              <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted">
                <button className="rounded-full border border-black/8 bg-white/86 px-4 py-2 font-semibold text-accent-deep transition-colors hover:border-accent hover:bg-accent" onClick={() => openAuthModal("register")} type="button">Create user</button>
                <button className="text-sm text-muted underline-offset-4 transition-colors hover:text-accent-deep hover:underline" onClick={() => setFeedback("Reset password is not available yet. Contact support or an admin to recover access.")} type="button">Forget password? Reset password</button>
              </div>
            </form>

            <WorkspaceModal description="Complete your account setup and required medical details in one focused, role-ready form." isOpen={false} onClose={() => undefined} title="Create your Fithub account">
              <form className="grid gap-6" id="create-account" onSubmit={handleRegister}>
                <section className="grid gap-4 rounded-[1.5rem] border border-black/6 bg-white/86 p-5">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">Account basics</p>
                    <p className="mt-2 text-sm text-muted">Start with the contact details tied to your account.</p>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="grid gap-2"><span className={fieldLabelClass}>Full name</span><input className={formFieldClass} required minLength={2} value={registerForm.name} onChange={(event) => setRegisterForm((current) => ({ ...current, name: event.target.value }))} /></label>
                    <label className="grid gap-2"><span className={fieldLabelClass}>Email</span><input className={formFieldClass} type="email" required value={registerForm.email} onChange={(event) => setRegisterForm((current) => ({ ...current, email: event.target.value }))} /></label>
                    <label className="grid gap-2"><span className={fieldLabelClass}>Password</span><input className={formFieldClass} type="password" required minLength={8} value={registerForm.password} onChange={(event) => setRegisterForm((current) => ({ ...current, password: event.target.value }))} /></label>
                    <label className="grid gap-2"><span className={fieldLabelClass}>Phone</span><input className={formFieldClass} inputMode="tel" value={registerForm.phone} onChange={(event) => setRegisterForm((current) => ({ ...current, phone: event.target.value }))} /></label>
                    <label className="grid gap-2 sm:col-span-2"><span className={fieldLabelClass}>Date of birth</span><input className={formFieldClass} type="date" required value={registerForm.dateOfBirth} onChange={(event) => setRegisterForm((current) => ({ ...current, dateOfBirth: event.target.value }))} /></label>
                  </div>
                </section>

                <section className="grid gap-4 rounded-[1.5rem] border border-accent/20 bg-[linear-gradient(180deg,_rgba(215,255,63,0.12),_rgba(255,255,255,0.72))] p-5">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent-deep">Medical form</p>
                    <p className="mt-2 text-sm leading-7 text-muted">Complete these details before registration. If a field does not apply, write “None”.</p>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="grid gap-2"><span className={fieldLabelClass}>Emergency contact name</span><input className={formFieldClass} required value={registerForm.emergencyContactName} onChange={(event) => setRegisterForm((current) => ({ ...current, emergencyContactName: event.target.value }))} /></label>
                    <label className="grid gap-2"><span className={fieldLabelClass}>Emergency contact phone</span><input className={formFieldClass} required inputMode="tel" value={registerForm.emergencyContactPhone} onChange={(event) => setRegisterForm((current) => ({ ...current, emergencyContactPhone: event.target.value }))} /></label>
                  </div>
                  <div className="grid gap-4 lg:grid-cols-2">
                    <label className="grid gap-2"><span className={fieldLabelClass}>Allergies</span><textarea className={formTextareaClass} required value={registerForm.allergies} onChange={(event) => setRegisterForm((current) => ({ ...current, allergies: event.target.value }))} /></label>
                    <label className="grid gap-2"><span className={fieldLabelClass}>Medical conditions</span><textarea className={formTextareaClass} required value={registerForm.medicalConditions} onChange={(event) => setRegisterForm((current) => ({ ...current, medicalConditions: event.target.value }))} /></label>
                    <label className="grid gap-2"><span className={fieldLabelClass}>Current medications</span><textarea className={formTextareaClass} required value={registerForm.medications} onChange={(event) => setRegisterForm((current) => ({ ...current, medications: event.target.value }))} /></label>
                    <label className="grid gap-2"><span className={fieldLabelClass}>Additional notes</span><textarea className={formTextareaClass} value={registerForm.medicalNotes} onChange={(event) => setRegisterForm((current) => ({ ...current, medicalNotes: event.target.value }))} /></label>
                  </div>
                </section>

                <div className="flex flex-wrap items-center justify-between gap-4 rounded-[1.5rem] border border-black/6 bg-white/88 px-5 py-4">
                  <p className="max-w-xl text-sm leading-7 text-muted">Once registered, your account opens the member workspace immediately and keeps your personal details ready for bookings.</p>
                  <div className="flex flex-wrap gap-3">
                    <button className={primaryButtonClass} disabled={isWorking || isPending} type="submit">{isWorking || isPending ? "Creating account..." : "Create account"}</button>
                    <button className={secondaryButtonClass} onClick={() => setIsAuthModalOpen(false)} type="button">Cancel</button>
                  </div>
                </div>
              </form>
            </WorkspaceModal>
          </div>
        </div>
      </div>
    </section>
  );

  const discoverSection = discoverView === "overview" ? null : (
    <section className="grid gap-6">
      <div className="rounded-[2rem] bg-accent-deep p-8 text-surface sm:p-10">
        <div className="mb-8 flex items-center justify-between gap-4">
          <div>
            <h2 className="mt-3 text-3xl font-bold tracking-[-0.03em]">{discoverView === "gyms" ? "Inspect gyms, memberships, and listed classes" : discoverView === "pt" ? "Choose and request personal training" : discoverView === "group" ? "Compare teams and join a group program" : "Browse shops and venue-related listings"}</h2>
            <p className="mt-3 max-w-4xl text-sm leading-7 text-surface/75">{discoverView === "gyms" ? "View gyms by location, then drill into owner-listed class times, memberships, and direct booking from the same page." : discoverView === "pt" ? "Pick a trainer or an available window, choose a slot, and request the session without leaving the PT tab." : discoverView === "group" ? "Browse teams, inspect each program, and activate the right cohort directly from the group fitness tab." : "Retail and equipment spaces stay separate from booking flows."}</p>
          </div>
        </div>
        <div className="mb-8 rounded-[1.9rem] border border-white/12 bg-surface/12 p-5 backdrop-blur-sm sm:p-6"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-sm font-semibold uppercase tracking-[0.18em] text-surface/72">Saved shortlist</p><p className="mt-1 max-w-2xl text-sm leading-7 text-surface/72">Keep trainers, gyms, programs, and shops here while you compare options, then reopen or remove them without losing your place.</p></div><button className="rounded-full border border-white/16 px-4 py-2 text-sm font-semibold uppercase tracking-[0.12em] text-surface transition-colors hover:bg-white/10 disabled:opacity-50" disabled={savedItems.length === 0} onClick={() => setSavedItems([])} type="button">Clear</button></div><div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{savedItems.length > 0 ? savedItems.map((item) => <article key={`${item.kind}-${item.id}`} className="rounded-[1.5rem] border border-white/12 bg-white/10 px-4 py-4 shadow-[0_14px_32px_rgba(8,19,32,0.08)]"><div className="flex items-start justify-between gap-3"><div><p className="text-xs uppercase tracking-[0.16em] text-surface/68">{item.kind}</p><p className="mt-2 font-semibold text-surface">{item.title}</p></div><button className="rounded-full border border-white/16 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-surface transition-colors hover:bg-white/10" onClick={() => toggleSavedItem(item)} type="button">Remove</button></div><p className="mt-2 text-sm leading-7 text-surface/74">{item.subtitle}</p><div className="mt-4"><Link className="inline-flex rounded-full border border-white/16 px-4 py-2 text-sm font-semibold uppercase tracking-[0.12em] text-surface transition-colors hover:bg-white/10" href={item.href}>Open</Link></div></article>) : <div className="rounded-[1.4rem] border border-dashed border-white/18 bg-white/8 px-4 py-4 text-sm leading-7 text-surface/72 sm:col-span-2 xl:col-span-3">Save a trainer, gym, program, or shop from its detail view and it will stay here while you browse.</div>}</div></div>
        {discoverView === "shops" ? <div className="rounded-[1.75rem] bg-surface p-4 text-foreground shadow-[0_18px_45px_rgba(9,16,12,0.16)] sm:p-5"><div className="grid gap-3 lg:grid-cols-[1.2fr_0.8fr_auto]">
            <label className="grid gap-2">
              <span className="text-sm font-semibold text-accent-deep">Search</span>
              <input className={formFieldClass} placeholder="Trainer, class, gym, personal training, city" value={discoverQuery} onChange={(event) => setDiscoverQuery(event.target.value)} />
            </label>
            <label className="grid gap-2">
              <span className="text-sm font-semibold text-accent-deep">Show</span>
              <select className={formFieldClass} value={discoverScope} onChange={(event) => setDiscoverScope(event.target.value as "all" | "trainers" | "services" | "shops")}>
                <option value="all">Everything</option>
                <option value="services">Classes and personal training</option>
                <option value="trainers">Trainers</option>
                <option value="shops">Gyms and shops</option>
              </select>
            </label>
            <div className="flex items-end gap-2 lg:self-end">{discoverQuery ? <button className={secondaryButtonClass} onClick={() => setDiscoverQuery("")} type="button">Clear</button> : null}<div className="sport-chip flex min-h-12 items-center rounded-[1.5rem] px-5 py-4 text-sm font-semibold">{discoverResultCount} result{discoverResultCount === 1 ? "" : "s"}</div></div>
          </div></div> : null}
        {isTrainingView ? <div className="mt-6 grid gap-6" ref={trainingDiscoverRef}>
          {trainingView === "group" ? <>
            {filteredGroupFitnessTeams.length > 0 ? <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{filteredGroupFitnessTeams.map((team) => {
              const isSelected = selectedGroupTeam?._id === team._id;

              return <button key={team._id} className={isSelected ? discoverCardActiveClass : discoverCardClass} onClick={() => {
                if (isSelected) {
                  setSelectedGroupTeamId("");
                  setSelectedGroupProgramId(null);
                  return;
                }

                setSelectedGroupTeamId(team._id);
                setSelectedGroupProgramId(null);
              }} type="button"><div className="relative z-10"><p className="text-xs uppercase tracking-[0.18em] text-surface/68">{team.location}</p><p className="mt-3 text-xl font-semibold leading-tight text-white">{team.name}</p><p className="mt-2 text-sm text-surface/78">{team.focus}</p><p className="mt-4 text-sm leading-7 text-surface/72">{team.description}</p><div className="mt-5 flex flex-wrap gap-2"><span className={discoverChipClass}>{groupPrograms.filter((program) => program.teamId === team._id).length} programs</span></div></div></button>;
            })}</div> : <div className="rounded-[1.75rem] border border-dashed border-white/18 bg-surface/10 p-6 text-sm text-surface/80">No group fitness teams match the current search yet.</div>}
            {selectedGroupTeam ? <div className="sport-entrance mx-auto w-full max-w-[1360px] rounded-[1.75rem] border border-white/12 bg-surface/70 p-6 text-foreground"><div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between"><div><p className="text-sm uppercase tracking-[0.18em] text-muted">Team opened</p><h3 className="mt-2 text-3xl font-bold tracking-[-0.03em] text-accent-deep">{selectedGroupTeam.name}</h3><p className="mt-3 max-w-3xl text-sm leading-7 text-muted">{selectedGroupTeam.description || "Open one team at a time, then drill into its published programs below."}</p></div><div className="rounded-2xl border border-black/6 px-4 py-4"><p className="text-xs uppercase tracking-[0.18em] text-muted">Focus</p><p className="mt-2 font-semibold text-accent-deep">{selectedGroupTeam.focus}</p><p className="mt-2 text-sm text-muted">{selectedGroupPrograms.length} program{selectedGroupPrograms.length === 1 ? "" : "s"} listed</p></div></div><div className="mt-6 grid gap-3 lg:grid-cols-3"><div className="rounded-2xl border border-black/6 px-4 py-4"><p className="text-xs uppercase tracking-[0.18em] text-muted">Location</p><p className="mt-2 font-semibold text-accent-deep">{selectedGroupTeam.location || "Shared by coach"}</p></div><div className="rounded-2xl border border-black/6 px-4 py-4"><p className="text-xs uppercase tracking-[0.18em] text-muted">Team focus</p><p className="mt-2 font-semibold text-accent-deep">{selectedGroupTeam.focus || "General fitness"}</p></div><div className="rounded-2xl border border-black/6 px-4 py-4"><p className="text-xs uppercase tracking-[0.18em] text-muted">Programs</p><p className="mt-2 font-semibold text-accent-deep">{selectedGroupPrograms.length}</p></div></div><div className="mt-8"><div className="flex items-center justify-between gap-3"><div><p className="text-sm font-semibold text-accent-deep">Programs</p><p className="mt-1 text-xs uppercase tracking-[0.18em] text-muted">Select one card to drop down its full detail area</p></div><p className="text-xs uppercase tracking-[0.18em] text-muted">{selectedGroupPrograms.length}</p></div><div className="mt-3 grid gap-3">{selectedGroupPrograms.length > 0 ? selectedGroupPrograms.map((program) => { const isActive = selectedGroupProgram?._id === program._id; return <button key={program._id} className={isActive ? discoverDetailCardActiveClass : discoverDetailCardClass} onClick={() => setSelectedGroupProgramId(isActive ? null : program._id)} type="button"><div className="relative z-10 flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs uppercase tracking-[0.18em] text-surface/62">{program.subtitle}</p><p className="mt-2 text-lg font-semibold text-white">{program.title}</p></div><span className={program.isComplete ? "rounded-full border border-slate-300/20 bg-slate-300/12 px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-100" : program.isFull ? "rounded-full border border-rose-300/20 bg-rose-400/12 px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-rose-100" : "rounded-full border border-emerald-300/20 bg-emerald-300/12 px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-100"}>{program.isComplete ? "Program ended" : program.isFull ? "Full" : `${program.availableSlots} slots left`}</span></div><p className="relative z-10 mt-3 text-sm leading-7 text-surface/72">{program.description}</p><div className="relative z-10 mt-4 flex flex-wrap items-center gap-2 text-sm text-surface/72"><span>{program.days.join(" • ")}</span><span className="h-1 w-1 rounded-full bg-white/25" /><span>{program.startTime}-{program.endTime}</span><span className="h-1 w-1 rounded-full bg-white/25" /><span>{new Date(program.startDate).toLocaleDateString()} - {new Date(program.endDate).toLocaleDateString()}</span></div></button>; }) : <div className={emptyStateClass}>This team has not published any programs yet.</div>}</div></div>{selectedGroupProgram ? <div className="sport-entrance mt-8 rounded-[1.5rem] border border-black/6 bg-[#fbf7ef] p-5"><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs uppercase tracking-[0.18em] text-muted">Selected program</p><h4 className="mt-2 text-2xl font-bold tracking-[-0.03em] text-accent-deep">{selectedGroupProgram.title}</h4></div><div className="flex flex-wrap gap-3"><button className="rounded-full border border-black/10 px-4 py-2 text-sm font-semibold text-accent-deep" onClick={() => toggleSavedItem({ id: selectedGroupProgram._id, kind: "program", title: selectedGroupProgram.title, subtitle: `${selectedGroupProgram.venue} · ${selectedGroupProgram.currency} ${selectedGroupProgram.price}`, href: "/discover?view=group" })} type="button">{isItemSaved(selectedGroupProgram._id, "program") ? "Saved" : "Save program"}</button><button className="rounded-full border border-black/10 px-4 py-2 text-sm font-semibold text-accent-deep" onClick={() => toggleDiscoverPanel("groupSchedule")} type="button">{expandedDiscoverPanels.groupSchedule ? "Hide schedule" : "Show schedule"}</button></div></div><p className="mt-3 max-w-3xl text-sm leading-7 text-muted">{selectedGroupProgram.description}</p><div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><div className="rounded-2xl bg-white px-4 py-4"><p className="text-xs uppercase tracking-[0.18em] text-muted">Coach</p><p className="mt-2 font-semibold text-accent-deep">{selectedGroupProgram.coach}</p></div><div className="rounded-2xl bg-white px-4 py-4"><p className="text-xs uppercase tracking-[0.18em] text-muted">Venue</p><p className="mt-2 font-semibold text-accent-deep">{selectedGroupProgram.venue}</p></div><div className="rounded-2xl bg-white px-4 py-4"><p className="text-xs uppercase tracking-[0.18em] text-muted">Cycle</p><p className="mt-2 font-semibold text-accent-deep">{new Date(selectedGroupProgram.startDate).toLocaleDateString()} - {new Date(selectedGroupProgram.endDate).toLocaleDateString()}</p></div><div className="rounded-2xl bg-white px-4 py-4"><p className="text-xs uppercase tracking-[0.18em] text-muted">Price</p><p className="mt-2 font-semibold text-accent-deep">{selectedGroupProgram.currency} {selectedGroupProgram.price}</p></div></div>{expandedDiscoverPanels.groupSchedule ? <div className="mt-5"><div className="flex items-center justify-between gap-3"><p className="text-sm font-semibold text-accent-deep">Weekly class times</p><p className="text-xs uppercase tracking-[0.18em] text-muted">{selectedGroupProgram.days.length} day{selectedGroupProgram.days.length === 1 ? "" : "s"}</p></div><div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{selectedGroupProgram.days.map((day) => <div key={day} className="rounded-2xl border border-black/8 bg-white px-4 py-4 text-left"><p className="text-xs uppercase tracking-[0.18em] text-muted">{day}</p><p className="mt-2 font-semibold text-accent-deep">{selectedGroupProgram.startTime}-{selectedGroupProgram.endTime}</p><p className="mt-2 text-sm text-muted">{selectedGroupProgram.availableSlots > 0 ? `${selectedGroupProgram.availableSlots} slots left` : "Full"}</p></div>)}</div></div> : null}<div className="mt-5 flex flex-wrap gap-3">{selectedGroupProgram.isComplete ? <button className="rounded-full border border-black/10 px-5 py-3 text-sm font-semibold text-muted" disabled type="button">Program finished</button> : selectedGroupProgram.isFull ? <button className="rounded-full bg-accent-deep px-5 py-3 text-sm font-semibold text-white" onClick={handleJoinGroupWaitlist} type="button">{selectedGroupWaitlisted ? "Waitlist joined" : "Join waitlist"}</button> : currentUser ? <button className="rounded-full bg-accent-deep px-5 py-3 text-sm font-semibold text-white" onClick={handleSubmitGroupProgramRequest} type="button">Activate this program</button> : <button className="rounded-full bg-accent-deep px-5 py-3 text-sm font-semibold text-white" onClick={() => openAuthModal("login")} type="button">Login to activate</button>}<button className="rounded-full border border-black/10 px-5 py-3 text-sm font-semibold text-accent-deep" onClick={() => setSelectedGroupProgramId(null)} type="button">Close details</button></div></div> : null}</div> : null}
          </> : <>
            {ptTrainers.length > 0 ? <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{ptTrainers.map((trainer) => {
              const isSelected = selectedPtTrainer?._id === trainer._id;
              const trainerServices = ptServices.filter((service) => service.trainerId?._id === trainer._id);

              return <button key={trainer._id} className={isSelected ? discoverCardActiveClass : discoverCardClass} onClick={() => {
                if (isSelected) {
                  setSelectedTrainerId(null);
                  setSelectedServiceId(null);
                  return;
                }

                setSelectedTrainerId(trainer._id);
                setIsPtPortfolioOpen(false);
                setSelectedServiceId(null);
              }} type="button"><div className="relative z-10"><p className="text-xs uppercase tracking-[0.18em] text-surface/68">Trainer</p><p className="mt-3 text-xl font-semibold leading-tight text-white">{trainer.userId?.name ?? "Trainer"}</p><p className="mt-2 text-sm text-surface/78">{trainer.specialties.join(", ") || "General fitness"}</p><p className="mt-4 text-sm leading-7 text-surface/72">{trainer.bio || "Select this trainer to open their published PT offers and available slots below."}</p><div className="mt-5 flex flex-wrap items-center gap-2"><span className={discoverChipClass}>{trainerServices.length} offer{trainerServices.length === 1 ? "" : "s"}</span><span className={discoverChipClass}>{trainer.experienceYears} yr{trainer.experienceYears === 1 ? "" : "s"}</span>{(() => { const r = ratingSummaries[`trainer:${trainer._id}`]; return r && r.count > 0 ? <span className="flex items-center gap-1 rounded-full border border-amber-300/40 bg-amber-300/20 px-2.5 py-1 text-xs font-semibold text-amber-200">★ {r.average?.toFixed(1)} <span className="opacity-70">({r.count})</span></span> : null; })()}</div></div></button>;
            })}</div> : <div className="rounded-[1.75rem] border border-dashed border-white/18 bg-surface/10 p-6 text-sm text-surface/80">No personal trainers match the current search yet.</div>}
            {selectedPtTrainer ? <div className="sport-entrance mx-auto w-full max-w-[1360px] rounded-[1.75rem] border border-white/12 bg-surface/70 p-6 text-foreground"><div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between"><div><p className="text-sm uppercase tracking-[0.18em] text-muted">Trainer opened</p><h3 className="mt-2 text-3xl font-bold tracking-[-0.03em] text-accent-deep">{selectedPtTrainer.userId?.name ?? "Trainer"}</h3><p className="mt-3 max-w-3xl text-sm leading-7 text-muted">{selectedPtTrainer.portfolio?.headline || selectedPtTrainer.bio || "Open one trainer at a time, then drill into the published PT services and request the right slot below."}</p></div><div className="flex flex-wrap gap-3"><button className="rounded-full border border-black/10 px-5 py-3 text-sm font-semibold text-accent-deep" onClick={() => setIsPtPortfolioOpen((current) => !current)} type="button">{isPtPortfolioOpen ? "Hide portfolio" : "View portfolio"}</button><div className="rounded-2xl border border-black/6 px-4 py-4"><p className="text-xs uppercase tracking-[0.18em] text-muted">Specialties</p><p className="mt-2 font-semibold text-accent-deep">{selectedPtTrainer.specialties.join(", ") || "General fitness"}</p><p className="mt-2 text-sm text-muted">{selectedPtTrainer.experienceYears} year{selectedPtTrainer.experienceYears === 1 ? "" : "s"} experience</p></div></div></div>{isPtPortfolioOpen ? <div className="mt-6 rounded-[1.5rem] border border-black/6 bg-[#fbf7ef] p-5"><div className="grid gap-4 lg:grid-cols-[1.25fr_0.75fr]"><div><p className="text-xs uppercase tracking-[0.18em] text-muted">Portfolio</p><h4 className="mt-2 text-2xl font-bold tracking-[-0.03em] text-accent-deep">{selectedPtTrainer.portfolio?.headline || `${selectedPtTrainer.userId?.name ?? "Trainer"} portfolio`}</h4><p className="mt-3 text-sm leading-7 text-muted">{selectedPtTrainer.portfolio?.coachingStyle || selectedPtTrainer.bio || "This trainer has not published a full portfolio yet."}</p></div><div className="grid gap-3"><div className="rounded-2xl bg-white px-4 py-4"><p className="text-xs uppercase tracking-[0.18em] text-muted">Certifications</p><p className="mt-2 text-sm leading-7 text-accent-deep">{selectedPtTrainer.portfolio?.certifications?.length ? selectedPtTrainer.portfolio.certifications.join(", ") : "Trainer will publish certifications here."}</p></div><div className="rounded-2xl bg-white px-4 py-4"><p className="text-xs uppercase tracking-[0.18em] text-muted">Achievements</p><p className="mt-2 text-sm leading-7 text-accent-deep">{selectedPtTrainer.portfolio?.achievements?.length ? selectedPtTrainer.portfolio.achievements.join(", ") : "Trainer will publish highlights here."}</p></div></div></div></div> : null}<div className="mt-6 grid gap-3 lg:grid-cols-3"><div className="rounded-2xl border border-black/6 px-4 py-4"><p className="text-xs uppercase tracking-[0.18em] text-muted">Experience</p><p className="mt-2 font-semibold text-accent-deep">{selectedPtTrainer.experienceYears} year{selectedPtTrainer.experienceYears === 1 ? "" : "s"}</p></div><div className="rounded-2xl border border-black/6 px-4 py-4"><p className="text-xs uppercase tracking-[0.18em] text-muted">Specialties</p><p className="mt-2 font-semibold text-accent-deep">{selectedPtTrainer.specialties.length}</p></div><div className="rounded-2xl border border-black/6 px-4 py-4"><p className="text-xs uppercase tracking-[0.18em] text-muted">Published offers</p><p className="mt-2 font-semibold text-accent-deep">{selectedPtTrainerServices.length}</p></div>{(() => { const r = ratingSummaries[`trainer:${selectedPtTrainer._id}`]; const alreadyRated = alreadyRatedIds.has(`trainer:${selectedPtTrainer._id}`); return <div className="rounded-2xl border border-black/6 px-4 py-4 flex flex-col justify-between"><p className="text-xs uppercase tracking-[0.18em] text-muted">Rating</p>{r && r.count > 0 ? <p className="mt-2 font-semibold text-amber-600">★ {r.average?.toFixed(1)} <span className="text-sm font-normal text-muted">({r.count})</span></p> : <p className="mt-2 text-sm text-muted">No ratings yet</p>}{alreadyRated ? <p className="mt-3 text-xs text-muted">You rated this trainer</p> : <button className="mt-3 rounded-full border border-black/10 bg-white px-3 py-1.5 text-xs font-semibold text-accent-deep hover:border-accent hover:bg-accent" onClick={(e) => { e.stopPropagation(); openRatingModal("trainer", selectedPtTrainer._id, selectedPtTrainer.userId?.name ?? "Trainer"); }} type="button">Rate trainer</button>}</div>; })()}</div><div className="mt-6"><div className="flex items-center justify-between gap-3"><div><p className="text-sm font-semibold text-accent-deep">Working gyms</p><p className="mt-1 text-xs uppercase tracking-[0.18em] text-muted">Venues linked from this trainer’s published services</p></div><p className="text-xs uppercase tracking-[0.18em] text-muted">{selectedPtTrainerGyms.length}</p></div><div className="mt-3 grid gap-3 lg:grid-cols-2">{selectedPtTrainerGyms.length > 0 ? selectedPtTrainerGyms.map((link) => <article key={link.shop._id} className="rounded-2xl border border-black/8 bg-white px-4 py-4"><div className="flex items-start justify-between gap-3"><div><p className="text-xs uppercase tracking-[0.18em] text-muted">{link.shop.location || "Venue"}</p><p className="mt-2 text-lg font-semibold text-accent-deep">{link.shop.shopName}</p></div><span className="rounded-full bg-[#eef5d2] px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#35532a]">{link.services.length} slot{link.services.length === 1 ? "" : "s"}</span></div><p className="mt-3 text-sm leading-7 text-muted">{link.shop.description || "This venue is linked through one or more published trainer services."}</p><div className="mt-4 grid gap-2">{link.services.slice(0, 2).map((service) => <div key={service._id} className="rounded-xl bg-[#fbf7ef] px-3 py-3 text-sm text-muted"><p className="font-semibold text-accent-deep">{service.title}</p><p className="mt-1">{service.schedule?.[0] ? `${service.schedule[0].day} ${service.schedule[0].startTime}-${service.schedule[0].endTime}` : "Schedule to be published"}</p></div>)}</div></article>) : <div className={emptyStateClass}>This trainer does not have any gym-linked services yet. Link a service to a listed gym from the trainer workspace to show it here.</div>}</div></div><div className="mt-8"><div className="flex items-center justify-between gap-3"><div><p className="text-sm font-semibold text-accent-deep">Training offers</p><p className="mt-1 text-xs uppercase tracking-[0.18em] text-muted">Select one card to drop down its booking detail area</p></div><p className="text-xs uppercase tracking-[0.18em] text-muted">{selectedPtTrainerServices.length}</p></div><div className="mt-3 grid gap-3">{selectedPtTrainerServices.length > 0 ? selectedPtTrainerServices.map((service) => { const isActive = selectedPtDetailService?._id === service._id; const audienceBadge = getAudienceBadge(service); const deliveryOptions = getBookableDeliveryOptions(service); return <button key={service._id} className={isActive ? discoverDetailCardActiveClass : discoverDetailCardClass} onClick={() => {
                  const nextId = isActive ? null : service._id;
                  setSelectedServiceId(nextId);
                  setBookingForm((current) => ({ ...current, serviceId: nextId ?? "" }));
                }} type="button"><div className="relative z-10 flex flex-wrap items-center gap-2"><p className="font-semibold text-white">{service.title}</p>{audienceBadge ? <span className="rounded-full border border-[#f3e1e8]/20 bg-[#f3e1e8]/12 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-[#ffd4e4]">{audienceBadge}</span> : null}</div><p className="relative z-10 mt-1 text-sm text-surface/72">{service.location?.name ?? service.location?.city ?? "Location shared on approval"}</p><p className="relative z-10 mt-2 text-sm text-surface/76">{service.type} · {service.currency} {service.price}</p>{deliveryOptions.length ? <div className="relative z-10 mt-3 flex flex-wrap gap-2">{deliveryOptions.map((option) => <span key={`${service._id}-${option.mode}-${option.label}`} className={discoverChipClass}>{getDeliveryModeLabel(option.mode)}: {option.label}</span>)}</div> : null}<div className="relative z-10 mt-3 grid gap-2">{service.schedule?.length ? service.schedule.slice(0, 2).map((slot) => <div key={`${service._id}-${slot.day}-${slot.startTime}`} className={discoverMiniSlotClass}>{slot.day} {slot.startTime}-{slot.endTime}</div>) : <p className="text-sm text-surface/68">Schedule appears once this trainer publishes personal training hours.</p>}</div></button>; }) : <div className={emptyStateClass}>This trainer has not published any PT offers yet.</div>}</div></div>{selectedPtDetailService ? <div className="sport-entrance mt-8 rounded-[1.5rem] border border-black/6 bg-[#fbf7ef] p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs uppercase tracking-[0.18em] text-muted">Selected personal training offer</p><h4 className="mt-2 text-2xl font-bold tracking-[-0.03em] text-accent-deep">{selectedPtDetailService.title}</h4></div><div className="flex flex-wrap gap-3"><button className="rounded-full border border-black/10 px-4 py-2 text-sm font-semibold text-accent-deep" onClick={() => toggleSavedItem({ id: selectedPtDetailService._id, kind: "trainer", title: selectedPtDetailService.title, subtitle: `${selectedPtDetailService.currency} ${selectedPtDetailService.price} · ${selectedPtDetailService.type}`, href: "/discover?view=pt" })} type="button">{isItemSaved(selectedPtDetailService._id, "trainer") ? "Saved" : "Save offer"}</button>{selectedPtDeliveryOptions.length ? <button className="rounded-full border border-black/10 px-4 py-2 text-sm font-semibold text-accent-deep" onClick={() => toggleDiscoverPanel("ptDelivery")} type="button">{expandedDiscoverPanels.ptDelivery ? "Hide setup" : "Show setup"}</button> : null}<button className="rounded-full border border-black/10 px-4 py-2 text-sm font-semibold text-accent-deep" onClick={() => toggleDiscoverPanel("ptSlots")} type="button">{expandedDiscoverPanels.ptSlots ? "Hide slots" : "Show slots"}</button></div></div><p className="mt-3 max-w-3xl text-sm leading-7 text-muted">{selectedPtDetailService.description || "Choose a slot below and request the session directly from this trainer tab."}</p><div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><div className="rounded-2xl bg-white px-4 py-4"><p className="text-xs uppercase tracking-[0.18em] text-muted">Coach</p><p className="mt-2 font-semibold text-accent-deep">{selectedPtDetailService.trainerId?.userId?.name ?? "Trainer pending"}</p></div><div className="rounded-2xl bg-white px-4 py-4"><p className="text-xs uppercase tracking-[0.18em] text-muted">Price</p><p className="mt-2 font-semibold text-accent-deep">{selectedPtDetailService.currency} {selectedPtDetailService.price}</p></div><div className="rounded-2xl bg-white px-4 py-4"><p className="text-xs uppercase tracking-[0.18em] text-muted">Ways to train</p><p className="mt-2 font-semibold text-accent-deep">{selectedPtDeliveryOptions.length ? selectedPtDeliveryOptions.map((option) => getDeliveryModeLabel(option.mode)).join(", ") : "In person"}</p></div><div className="rounded-2xl bg-white px-4 py-4"><p className="text-xs uppercase tracking-[0.18em] text-muted">Primary venue</p><p className="mt-2 font-semibold text-accent-deep">{selectedPtDetailService.location?.name ?? selectedPtDetailService.location?.city ?? "Shared on approval"}</p></div></div>{expandedDiscoverPanels.ptDelivery && selectedPtDeliveryOptions.length ? <div className="mt-5"><div className="flex items-center justify-between gap-3"><div><p className="text-sm font-semibold text-accent-deep">Choose how you want to train</p><p className="mt-1 text-xs uppercase tracking-[0.18em] text-muted">Members can request only the modes the trainer published for this offer</p></div><p className="text-xs uppercase tracking-[0.18em] text-muted">{selectedPtDeliveryOptions.length}</p></div><div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{selectedPtDeliveryOptions.map((option) => { const isSelectedOption = bookingForm.serviceId === selectedPtDetailService._id && bookingForm.sessionMode === option.mode && bookingForm.sessionLocation === option.label; return <button key={`${selectedPtDetailService._id}-${option.mode}-${option.label}`} className={isSelectedOption ? "rounded-2xl border border-accent-deep bg-white px-4 py-4 text-left" : "rounded-2xl border border-black/8 bg-white px-4 py-4 text-left"} onClick={() => setBookingForm((current) => ({ ...current, serviceId: selectedPtDetailService._id, sessionMode: option.mode, sessionLocation: option.label }))} type="button"><p className="text-xs uppercase tracking-[0.18em] text-muted">{getDeliveryModeLabel(option.mode)}</p><p className="mt-2 font-semibold text-accent-deep">{option.label}</p>{option.details ? <p className="mt-2 text-sm text-muted">{option.details}</p> : null}</button>; })}</div></div> : null}{expandedDiscoverPanels.ptSlots ? <div className="mt-5"><div className="flex items-center justify-between gap-3"><p className="text-sm font-semibold text-accent-deep">Available slots</p><p className="text-xs uppercase tracking-[0.18em] text-muted">{selectedPtDetailService.schedule?.length ?? 0} option{selectedPtDetailService.schedule?.length === 1 ? "" : "s"}</p></div><div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{selectedPtDetailService.schedule?.length ? selectedPtDetailService.schedule.map((slot) => { const slotLabel = `${slot.startTime}-${slot.endTime}`; const isSlotSelected = bookingForm.serviceId === selectedPtDetailService._id && bookingForm.timeSlot === slotLabel; return <button key={`${selectedPtDetailService._id}-${slot.day}-${slotLabel}`} className={isSlotSelected ? "rounded-2xl border border-accent-deep bg-white px-4 py-4 text-left" : "rounded-2xl border border-black/8 bg-white px-4 py-4 text-left"} onClick={() => applyBookableServiceSlot(selectedPtDetailService, slot)} type="button"><p className="text-xs uppercase tracking-[0.18em] text-muted">{slot.day}</p><p className="mt-2 font-semibold text-accent-deep">{slotLabel}</p><p className="mt-2 text-sm text-muted">Next session auto-targets {new Date(`${getNextSessionDate(slot)}T00:00:00`).toLocaleDateString()}.</p></button>; }) : <div className="rounded-2xl border border-dashed border-black/10 bg-white px-4 py-4 text-sm text-muted">No published time slots yet for this offer.</div>}</div></div> : null}<div className="mt-5 grid gap-3 sm:grid-cols-[minmax(0,260px)_auto] sm:items-end"><label className="grid gap-2"><span className="text-sm font-semibold text-accent-deep">Preferred date</span><input className="rounded-2xl border border-black/10 bg-white px-4 py-3 outline-none" type="date" value={bookingForm.bookingDate} onChange={(event) => setBookingForm((current) => ({ ...current, bookingDate: event.target.value, serviceId: selectedPtDetailService._id }))} /></label><div className="flex flex-wrap gap-3">{currentUser ? <button className="rounded-full bg-accent-deep px-5 py-3 text-sm font-semibold text-white" onClick={handleSubmitBookingRequest} type="button">Request this booking</button> : <button className="rounded-full bg-accent-deep px-5 py-3 text-sm font-semibold text-white" onClick={() => openAuthModal("login")} type="button">Login to book</button>}<button className="rounded-full border border-black/10 px-5 py-3 text-sm font-semibold text-accent-deep" onClick={() => setSelectedServiceId(null)} type="button">Close details</button></div></div></div> : null}</div> : null}
          </>}
        </div> : null}
        {discoverView === "gyms" ? <div className="mt-6 grid gap-6" ref={gymDiscoverRef}>
          {gymShops.length > 0 ? <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{gymShops.map((shop) => {
            const isSelected = selectedGymShop?._id === shop._id;
            const relatedServices = gymServices.filter((service) => matchesVenueService(service, shop));

            return <button key={shop._id} className={isSelected ? discoverCardActiveClass : discoverCardClass} onClick={() => {
              if (isSelected) {
                setSelectedShopId(null);
                setSelectedTrainerId(null);
                setSelectedServiceId(null);
                return;
              }

              setSelectedShopId(shop._id);
              setSelectedTrainerId(null);
              setSelectedServiceId(null);
            }} type="button"><div className="relative z-10 flex items-start gap-4"><div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-[1.25rem] border border-white/12 bg-white/10 shadow-[0_8px_20px_rgba(3,10,18,0.22)]">{shop.logoUrl ? <Image alt={`${shop.shopName} logo`} className="h-full w-full object-cover" height={64} src={shop.logoUrl} width={64} /> : <span className="text-lg font-bold uppercase tracking-[0.12em] text-accent">{getNameInitials(shop.shopName)}</span>}</div><div className="min-w-0 flex-1"><p className="text-xs uppercase tracking-[0.18em] text-surface/68">{shop.categories.join(", ") || "Gym"}</p><p className="mt-2 text-xl font-semibold leading-tight text-white">{shop.shopName}</p><p className="mt-2 text-sm text-surface/76">{shop.location || "Location to be confirmed"}</p></div></div><div className="relative z-10 mt-5 flex flex-wrap items-center gap-2"><span className={discoverChipClass}>{relatedServices.filter((service) => isClassOffer(service) && !isMembershipOffer(service)).length} classes</span><span className={discoverChipClass}>{relatedServices.filter((service) => isMembershipOffer(service)).length} memberships</span>{shop.peakHoursBusy ? <span className={discoverChipClass}>Peak {shop.peakHoursBusy}</span> : null}{(() => { const r = ratingSummaries[`shop:${shop._id}`]; return r && r.count > 0 ? <span className="flex items-center gap-1 rounded-full border border-amber-300/40 bg-amber-300/20 px-2.5 py-1 text-xs font-semibold text-amber-200">★ {r.average?.toFixed(1)} <span className="opacity-70">({r.count})</span></span> : null; })()}</div></button>;
          })}</div> : <div className="rounded-[1.75rem] border border-dashed border-white/18 bg-surface/10 p-6 text-sm text-surface/80">No gyms match the current search yet.</div>}
          {selectedGymShop ? <div className="sport-entrance mx-auto w-full max-w-[1360px] rounded-[1.75rem] border border-white/12 bg-surface/70 p-6 text-foreground"><div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between"><div className="flex items-start gap-4"><div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-[1.5rem] border border-black/8 bg-background">{selectedGymShop.logoUrl ? <Image alt={`${selectedGymShop.shopName} logo`} className="h-full w-full object-cover" height={80} src={selectedGymShop.logoUrl} width={80} /> : <span className="text-2xl font-bold uppercase tracking-[0.14em] text-accent-deep">{getNameInitials(selectedGymShop.shopName)}</span>}</div><div><p className="text-sm uppercase tracking-[0.18em] text-muted">Gym opened</p><h3 className="mt-2 text-3xl font-bold tracking-[-0.03em] text-accent-deep">{selectedGymShop.shopName}</h3><p className="mt-3 max-w-3xl text-sm leading-7 text-muted">{selectedGymShop.description || "Open one gym at a time, then drill into its classes, events, memberships, and peak-hour notes below."}</p></div></div>{selectedGymShop.websiteLink ? <a className="inline-flex rounded-full bg-accent-deep px-5 py-3 text-sm font-semibold text-white" href={selectedGymShop.websiteLink} rel="noreferrer" target="_blank">Visit gym page</a> : null}</div><div className="mt-6 grid gap-3 lg:grid-cols-4"><div className="rounded-2xl border border-black/6 px-4 py-4"><p className="text-xs uppercase tracking-[0.18em] text-muted">Location</p><p className="mt-2 font-semibold text-accent-deep">{selectedGymShop.location || "Shared by owner"}</p></div><div className="rounded-2xl border border-black/6 px-4 py-4"><p className="text-xs uppercase tracking-[0.18em] text-muted">Status</p><p className="mt-2 font-semibold text-accent-deep">{selectedGymShop.isVerified ? "Verified venue" : "Listed venue"}</p></div><div className="rounded-2xl border border-black/6 px-4 py-4"><p className="text-xs uppercase tracking-[0.18em] text-muted">Busy hours</p><p className="mt-2 font-semibold text-accent-deep">{selectedGymShop.peakHoursBusy || "Not published"}</p></div><div className="rounded-2xl border border-black/6 px-4 py-4"><p className="text-xs uppercase tracking-[0.18em] text-muted">Quieter hours</p><p className="mt-2 font-semibold text-accent-deep">{selectedGymShop.peakHoursQuiet || "Not published"}</p></div>{(() => { const r = ratingSummaries[`shop:${selectedGymShop._id}`]; const alreadyRated = alreadyRatedIds.has(`shop:${selectedGymShop._id}`); return <div className="rounded-2xl border border-black/6 px-4 py-4 flex flex-col justify-between"><p className="text-xs uppercase tracking-[0.18em] text-muted">Rating</p>{r && r.count > 0 ? <p className="mt-2 font-semibold text-amber-600">★ {r.average?.toFixed(1)} <span className="text-sm font-normal text-muted">({r.count})</span></p> : <p className="mt-2 text-sm text-muted">No ratings yet</p>}{alreadyRated ? <p className="mt-3 text-xs text-muted">You rated this gym</p> : <button className="mt-3 rounded-full border border-black/10 bg-[rgba(255,255,255,0.7)] px-3 py-1.5 text-xs font-semibold text-accent-deep hover:border-accent hover:bg-accent" onClick={(e) => { e.stopPropagation(); openRatingModal("shop", selectedGymShop._id, selectedGymShop.shopName); }} type="button">Rate gym</button>}</div>; })()}</div>{selectedGymShop.peakHoursNotes ? <div className="mt-4 rounded-2xl bg-[#fbf7ef] px-4 py-4 text-sm leading-7 text-muted"><p className="font-semibold text-accent-deep">Peak-hour note</p><p className="mt-2">{selectedGymShop.peakHoursNotes}</p></div> : null}<div className="mt-6"><div className="flex items-center justify-between gap-3"><div><p className="text-sm font-semibold text-accent-deep">Available trainers</p><p className="mt-1 text-xs uppercase tracking-[0.18em] text-muted">Select one trainer to see their gym-linked offers and slots</p></div><p className="text-xs uppercase tracking-[0.18em] text-muted">{selectedGymTrainers.length}</p></div><div className="mt-3 grid gap-3 lg:grid-cols-2">{selectedGymTrainers.length > 0 ? selectedGymTrainers.map((trainer) => { const isTrainerActive = selectedGymTrainer?._id === trainer._id; const trainerVenueServices = selectedGymTrainerServicesCatalog.filter((service) => service.trainerId?._id === trainer._id); return <button key={trainer._id} className={isTrainerActive ? discoverDetailCardActiveClass : discoverDetailCardClass} onClick={() => {
                    if (isTrainerActive) {
                      setSelectedTrainerId(null);
                      setSelectedServiceId(null);
                      return;
                    }

                    setSelectedTrainerId(trainer._id);
                    setSelectedServiceId(null);
                  }} type="button"><div className="relative z-10 flex items-start justify-between gap-3"><div><p className="text-xs uppercase tracking-[0.18em] text-surface/62">Trainer at {selectedGymShop.shopName}</p><p className="mt-2 text-lg font-semibold text-white">{trainer.userId?.name ?? "Trainer"}</p></div><span className={discoverChipClass}>{trainerVenueServices.length} offer{trainerVenueServices.length === 1 ? "" : "s"}</span></div><p className="relative z-10 mt-3 text-sm leading-7 text-surface/72">{trainer.bio || "Select this trainer to open the slots and gym-linked services they currently run here."}</p><div className="relative z-10 mt-4 flex flex-wrap gap-2"><span className={discoverChipClass}>{trainer.specialties.join(", ") || "General fitness"}</span></div></button>; }) : <div className={emptyStateClass}>No trainers have published gym-linked services for this venue yet.</div>}</div></div>{selectedGymTrainer ? <div className="mt-6 rounded-[1.5rem] border border-black/6 bg-[#fbf7ef] p-5"><div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between"><div><p className="text-xs uppercase tracking-[0.18em] text-muted">Trainer working here</p><h4 className="mt-2 text-2xl font-bold tracking-[-0.03em] text-accent-deep">{selectedGymTrainer.userId?.name ?? "Trainer"}</h4><p className="mt-3 max-w-3xl text-sm leading-7 text-muted">{selectedGymTrainer.bio || "This trainer is linked to the gym through the services published under this venue."}</p></div><div className="rounded-2xl bg-white px-4 py-4"><p className="text-xs uppercase tracking-[0.18em] text-muted">Published here</p><p className="mt-2 font-semibold text-accent-deep">{selectedGymTrainerServices.length} service{selectedGymTrainerServices.length === 1 ? "" : "s"}</p></div></div><div className="mt-5 grid gap-3">{selectedGymTrainerServices.length > 0 ? selectedGymTrainerServices.map((service) => { const isActive = selectedGymActiveService?._id === service._id; const audienceBadge = getAudienceBadge(service); const deliveryOptions = getBookableDeliveryOptions(service); return <button key={service._id} className={isActive ? discoverDetailCardActiveClass : discoverDetailCardClass} onClick={() => {
                    const nextId = isActive ? null : service._id;
                    setSelectedServiceId(nextId);
                    setBookingForm((current) => ({ ...current, serviceId: nextId ?? "" }));
                  }} type="button"><div className="relative z-10 flex flex-wrap items-center gap-2"><p className="font-semibold text-white">{service.title}</p>{audienceBadge ? <span className="rounded-full border border-[#f3e1e8]/20 bg-[#f3e1e8]/12 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-[#ffd4e4]">{audienceBadge}</span> : null}</div><p className="relative z-10 mt-1 text-sm text-surface/72">{service.type} · {service.currency} {service.price}</p>{deliveryOptions.length ? <div className="relative z-10 mt-3 flex flex-wrap gap-2">{deliveryOptions.map((option) => <span key={`${service._id}-${option.mode}-${option.label}`} className={discoverChipClass}>{getDeliveryModeLabel(option.mode)}: {option.label}</span>)}</div> : null}<div className="relative z-10 mt-3 grid gap-2">{service.schedule?.length ? service.schedule.slice(0, 3).map((slot) => <div key={`${service._id}-${slot.day}-${slot.startTime}`} className={discoverMiniSlotClass}>{slot.day} {slot.startTime}-{slot.endTime}</div>) : <p className="text-sm text-surface/68">No slot published yet for this trainer at this gym.</p>}</div></button>; }) : <div className={emptyStateClass}>No trainer-led services are published for this gym yet.</div>}</div></div> : null}<div className="mt-8 grid gap-6 xl:grid-cols-[1.05fr_0.95fr]"><div><div className="flex items-center justify-between gap-3"><div><p className="text-sm font-semibold text-accent-deep">Classes and events</p><p className="mt-1 text-xs uppercase tracking-[0.18em] text-muted">Select one card to drop down its detail area</p></div><p className="text-xs uppercase tracking-[0.18em] text-muted">{selectedGymClassServices.length + selectedGymOtherServices.length}</p></div><div className="mt-3 grid gap-3">{selectedGymClassServices.length > 0 || selectedGymOtherServices.length > 0 ? [...selectedGymClassServices, ...selectedGymOtherServices].map((service) => { const audienceBadge = getAudienceBadge(service); const isActive = selectedGymActiveService?._id === service._id; return <button key={service._id} className={isActive ? discoverDetailCardActiveClass : discoverDetailCardClass} onClick={() => {
                    const nextId = isActive ? null : service._id;
                    setSelectedServiceId(nextId);
                    setBookingForm((current) => ({ ...current, serviceId: nextId ?? "" }));
                  }} type="button"><div className="relative z-10 flex flex-wrap items-center gap-2"><p className="font-semibold text-white">{service.title}</p>{audienceBadge ? <span className="rounded-full border border-[#f3e1e8]/20 bg-[#f3e1e8]/12 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-[#ffd4e4]">{audienceBadge}</span> : null}</div><p className="relative z-10 mt-1 text-sm text-surface/72">{service.type} · {service.currency} {service.price}</p><div className="relative z-10 mt-3 grid gap-2">{service.schedule?.length ? service.schedule.slice(0, 2).map((slot) => <div key={`${service._id}-${slot.day}-${slot.startTime}`} className={discoverMiniSlotClass}>{slot.day} {slot.startTime}-{slot.endTime}</div>) : <p className="text-sm text-surface/68">Schedule appears once the owner publishes class hours.</p>}</div></button>; }) : <div className={emptyStateClass}>No classes or events are published for this gym yet.</div>}</div></div><div><div className="flex items-center justify-between gap-3"><div><p className="text-sm font-semibold text-accent-deep">Membership options</p><p className="mt-1 text-xs uppercase tracking-[0.18em] text-muted">Access plans and entry products</p></div><p className="text-xs uppercase tracking-[0.18em] text-muted">{selectedGymMembershipServices.length}</p></div><div className="mt-3 grid gap-3">{selectedGymMembershipServices.length > 0 ? selectedGymMembershipServices.map((service) => { const isActive = selectedGymActiveService?._id === service._id; return <button key={service._id} className={isActive ? discoverDetailCardActiveClass : discoverDetailCardClass} onClick={() => {
                  const nextId = isActive ? null : service._id;
                  setSelectedServiceId(nextId);
                  setBookingForm((current) => ({ ...current, serviceId: nextId ?? "" }));
                }} type="button"><div className="relative z-10"><p className="font-semibold text-white">{service.title}</p><p className="mt-1 text-sm text-surface/72">{service.type} · {service.currency} {service.price}</p><p className="mt-3 text-sm text-surface/72">{service.description || "Select this card to open membership details below."}</p></div></button>; }) : <div className={emptyStateClass}>No membership options are published for this gym yet.</div>}</div></div></div>{selectedGymActiveService ? <div className="sport-entrance mt-8 rounded-[1.5rem] border border-black/6 bg-[#fbf7ef] p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs uppercase tracking-[0.18em] text-muted">Selected gym offer</p><h4 className="mt-2 text-2xl font-bold tracking-[-0.03em] text-accent-deep">{selectedGymActiveService.title}</h4></div><div className="flex flex-wrap gap-3"><button className="rounded-full border border-black/10 px-4 py-2 text-sm font-semibold text-accent-deep" onClick={() => toggleSavedItem({ id: selectedGymActiveService._id, kind: "gym", title: selectedGymActiveService.title, subtitle: `${selectedGymActiveService.currency} ${selectedGymActiveService.price} · ${selectedGymShop?.shopName ?? "Gym"}`, href: "/discover?view=gyms" })} type="button">{isItemSaved(selectedGymActiveService._id, "gym") ? "Saved" : "Save offer"}</button>{selectedGymDeliveryOptions.length ? <button className="rounded-full border border-black/10 px-4 py-2 text-sm font-semibold text-accent-deep" onClick={() => toggleDiscoverPanel("gymSetup")} type="button">{expandedDiscoverPanels.gymSetup ? "Hide setup" : "Show setup"}</button> : null}<button className="rounded-full border border-black/10 px-4 py-2 text-sm font-semibold text-accent-deep" onClick={() => toggleDiscoverPanel("gymSlots")} type="button">{expandedDiscoverPanels.gymSlots ? "Hide slots" : "Show slots"}</button></div></div><p className="mt-3 max-w-3xl text-sm leading-7 text-muted">{selectedGymActiveService.description || "Review the offer below, choose a time, and request the booking directly from this gym tab."}</p><div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><div className="rounded-2xl bg-white px-4 py-4"><p className="text-xs uppercase tracking-[0.18em] text-muted">Offer type</p><p className="mt-2 font-semibold text-accent-deep">{selectedGymActiveService.type}</p></div><div className="rounded-2xl bg-white px-4 py-4"><p className="text-xs uppercase tracking-[0.18em] text-muted">Price</p><p className="mt-2 font-semibold text-accent-deep">{selectedGymActiveService.currency} {selectedGymActiveService.price}</p></div><div className="rounded-2xl bg-white px-4 py-4"><p className="text-xs uppercase tracking-[0.18em] text-muted">Coach / owner</p><p className="mt-2 font-semibold text-accent-deep">{selectedGymActiveService.trainerId?.userId?.name ?? selectedGymShop.shopName}</p></div><div className="rounded-2xl bg-white px-4 py-4"><p className="text-xs uppercase tracking-[0.18em] text-muted">Location</p><p className="mt-2 font-semibold text-accent-deep">{selectedGymActiveService.location?.name ?? selectedGymActiveService.location?.city ?? selectedGymShop.location ?? "Shared on approval"}</p></div></div>{expandedDiscoverPanels.gymSetup && selectedGymDeliveryOptions.length ? <div className="mt-5"><div className="flex items-center justify-between gap-3"><div><p className="text-sm font-semibold text-accent-deep">Session setup</p><p className="mt-1 text-xs uppercase tracking-[0.18em] text-muted">Gym members can request the trainer modes published on this offer</p></div><p className="text-xs uppercase tracking-[0.18em] text-muted">{selectedGymDeliveryOptions.length}</p></div><div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{selectedGymDeliveryOptions.map((option) => { const isSelectedOption = bookingForm.serviceId === selectedGymActiveService._id && bookingForm.sessionMode === option.mode && bookingForm.sessionLocation === option.label; return <button key={`${selectedGymActiveService._id}-${option.mode}-${option.label}`} className={isSelectedOption ? "rounded-2xl border border-accent-deep bg-white px-4 py-4 text-left" : "rounded-2xl border border-black/8 bg-white px-4 py-4 text-left"} onClick={() => setBookingForm((current) => ({ ...current, serviceId: selectedGymActiveService._id, sessionMode: option.mode, sessionLocation: option.label }))} type="button"><p className="text-xs uppercase tracking-[0.18em] text-muted">{getDeliveryModeLabel(option.mode)}</p><p className="mt-2 font-semibold text-accent-deep">{option.label}</p>{option.details ? <p className="mt-2 text-sm text-muted">{option.details}</p> : null}</button>; })}</div></div> : null}{expandedDiscoverPanels.gymSlots ? <div className="mt-5"><div className="flex items-center justify-between gap-3"><p className="text-sm font-semibold text-accent-deep">Available times</p><p className="text-xs uppercase tracking-[0.18em] text-muted">{selectedGymActiveService.schedule?.length ?? 0} option{selectedGymActiveService.schedule?.length === 1 ? "" : "s"}</p></div><div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{selectedGymActiveService.schedule?.length ? selectedGymActiveService.schedule.map((slot) => { const slotLabel = `${slot.startTime}-${slot.endTime}`; const isSlotSelected = bookingForm.serviceId === selectedGymActiveService._id && bookingForm.timeSlot === slotLabel; return <button key={`${selectedGymActiveService._id}-${slot.day}-${slotLabel}`} className={isSlotSelected ? "rounded-2xl border border-accent-deep bg-white px-4 py-4 text-left" : "rounded-2xl border border-black/8 bg-white px-4 py-4 text-left"} onClick={() => applyBookableServiceSlot(selectedGymActiveService, slot)} type="button"><p className="text-xs uppercase tracking-[0.18em] text-muted">{slot.day}</p><p className="mt-2 font-semibold text-accent-deep">{slotLabel}</p><p className="mt-2 text-sm text-muted">{selectedGymActiveService.capacity ?? 1} spot{selectedGymActiveService.capacity === 1 ? "" : "s"}</p></button>; }) : <div className="rounded-2xl border border-dashed border-black/10 bg-white px-4 py-4 text-sm text-muted">No published time slots yet for this selection.</div>}</div></div> : null}<div className="mt-5 grid gap-3 sm:grid-cols-[minmax(0,260px)_auto] sm:items-end"><label className="grid gap-2"><span className="text-sm font-semibold text-accent-deep">Preferred date</span><input className="rounded-2xl border border-black/10 bg-white px-4 py-3 outline-none" type="date" value={bookingForm.bookingDate} onChange={(event) => setBookingForm((current) => ({ ...current, bookingDate: event.target.value, serviceId: selectedGymActiveService._id }))} /></label><div className="flex flex-wrap gap-3">{currentUser ? <button className="rounded-full bg-accent-deep px-5 py-3 text-sm font-semibold text-white" onClick={handleSubmitBookingRequest} type="button">Request this booking</button> : <button className="rounded-full bg-accent-deep px-5 py-3 text-sm font-semibold text-white" onClick={() => openAuthModal("login")} type="button">Login to book</button>}<button className="rounded-full border border-black/10 px-5 py-3 text-sm font-semibold text-accent-deep" onClick={() => setSelectedServiceId(null)} type="button">Close details</button></div></div></div> : null}</div> : null}
        </div> : null}
        {discoverView === "shops" ? <div className="mt-6 grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="grid gap-3">{filteredShops.length > 0 ? filteredShops.map((shop) => <button key={shop._id} className={selectedShop?._id === shop._id ? "rounded-[1.5rem] border border-white/40 bg-surface px-5 py-5 text-left text-foreground" : "rounded-[1.5rem] bg-surface/10 px-5 py-5 text-left text-surface"} onClick={() => setSelectedShopId(shop._id)} type="button"><p className="text-xs uppercase tracking-[0.18em] opacity-70">Shop</p><p className="mt-2 text-lg font-semibold">{shop.shopName}</p><p className="mt-2 text-sm opacity-75">{shop.categories.join(", ") || "Uncategorized"}</p></button>) : <div className="rounded-[1.5rem] bg-surface/10 p-5 text-sm text-surface/75">No shops match the current search.</div>}</div>
          <div className="rounded-[1.75rem] bg-surface p-6 text-foreground">{selectedShop ? <><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-sm uppercase tracking-[0.18em] text-muted">Shop details</p><h3 className="mt-3 text-2xl font-bold tracking-[-0.03em] text-accent-deep">{selectedShop.shopName}</h3></div><button className="rounded-full border border-black/10 px-4 py-2 text-sm font-semibold text-accent-deep" onClick={() => toggleSavedItem({ id: selectedShop._id, kind: "shop", title: selectedShop.shopName, subtitle: selectedShop.location || selectedShop.categories.join(", ") || "Shop", href: "/discover?view=shops" })} type="button">{isItemSaved(selectedShop._id, "shop") ? "Saved" : "Save shop"}</button></div><p className="mt-3 text-sm leading-7 text-muted">{selectedShop.description || "Owner-listed shop information, categories, and external links appear here."}</p><div className="mt-5 grid gap-3 sm:grid-cols-2"><div className="rounded-2xl border border-black/6 px-4 py-4"><p className="text-xs uppercase tracking-[0.18em] text-muted">Categories</p><p className="mt-2 font-semibold text-accent-deep">{selectedShop.categories.join(", ") || "General"}</p></div><div className="rounded-2xl border border-black/6 px-4 py-4"><p className="text-xs uppercase tracking-[0.18em] text-muted">Location</p><p className="mt-2 font-semibold text-accent-deep">{selectedShop.location || "Shared by owner"}</p></div></div>{selectedShop.websiteLink ? <a className="mt-6 inline-flex rounded-full bg-accent-deep px-5 py-3 text-sm font-semibold text-white" href={selectedShop.websiteLink} rel="noreferrer" target="_blank">Visit shop</a> : null}</> : <p className="text-sm text-muted">Choose a shop to see its details.</p>}</div>
        </div> : null}
      </div>
      {discoverView !== "gyms" ? <div className="rounded-[2rem] border border-black/5 bg-surface p-8 sm:p-10">
        {discoverView === "shops" ? <>{selectedShop ? <><h2 className="text-3xl font-bold tracking-[-0.03em] text-accent-deep">{selectedShop.shopName}</h2><div className="mt-8 grid gap-4 text-sm leading-7 text-muted md:grid-cols-2"><article className="rounded-2xl border border-black/6 px-4 py-4"><p className="font-semibold text-accent-deep">Separate retail view</p><p className="mt-2">Shop details stay separate from training flows so booking stays focused.</p></article><article className="rounded-2xl border border-black/6 px-4 py-4"><p className="font-semibold text-accent-deep">Owner-published info</p><p className="mt-2">Only the location, categories, and links the owner publishes appear here.</p></article></div></> : <p className="text-sm text-muted">Choose a shop to see the detailed view.</p>}</> : null}
      </div> : null}
    </section>
  );

  const renderWorkspaceActionCard = ({
    eyebrow,
    title,
    description,
    details,
    primaryLabel,
    onPrimary,
    secondaryLabel,
    onSecondary,
  }: {
    eyebrow: string;
    title: string;
    description: string;
    details: string[];
    primaryLabel: string;
    onPrimary: () => void;
    secondaryLabel?: string;
    onSecondary?: () => void;
  }) => (
    <div className="rounded-[1.5rem] bg-background p-5">
      <p className="text-xs uppercase tracking-[0.18em] text-muted">{eyebrow}</p>
      <h3 className="mt-2 text-xl font-bold tracking-[-0.03em] text-accent-deep">{title}</h3>
      <p className="mt-3 text-sm leading-7 text-muted">{description}</p>
      <div className="mt-4 grid gap-2">
        {details.map((detail) => (
          <div key={detail} className="rounded-2xl border border-black/8 bg-white px-4 py-3 text-sm text-muted">
            {detail}
          </div>
        ))}
      </div>
      <div className="mt-4 flex flex-wrap gap-3">
        <button className={primaryButtonClass} onClick={onPrimary} type="button">{primaryLabel}</button>
        {secondaryLabel && onSecondary ? <button className={secondaryButtonClass} onClick={onSecondary} type="button">{secondaryLabel}</button> : null}
      </div>
    </div>
  );

  const trainerProfileCard = <>
    {renderWorkspaceActionCard({
    eyebrow: "Trainer profile",
    title: ownedTrainer ? ownedTrainer.userId?.name ?? "Trainer profile" : "Create your trainer profile",
    description: ownedTrainer ? "Your public coaching summary lives here. Open the modal to update portfolio fields without expanding the workspace page." : "Create a visible coaching profile before publishing PT offers.",
    details: ownedTrainer ? [
      ownedTrainer.portfolio?.headline || "No headline published yet.",
      ownedTrainer.specialties.length ? `Specialties: ${ownedTrainer.specialties.join(", ")}` : "No specialties published yet.",
      `${ownedTrainer.experienceYears} year${ownedTrainer.experienceYears === 1 ? "" : "s"} experience`,
    ] : ["No trainer profile published yet."],
    primaryLabel: ownedTrainer ? "Edit trainer profile" : "Create trainer profile",
    onPrimary: openTrainerProfileModal,
    secondaryLabel: ownedTrainer ? "Refresh from live data" : undefined,
    onSecondary: ownedTrainer ? handleLoadTrainerProfile : undefined,
  })}
    <WorkspaceModal description="Update your coaching identity, portfolio headline, certifications, and profile bio in one place." isOpen={activeWorkspaceModal === "trainerProfile"} onClose={() => setActiveWorkspaceModal(null)} title={ownedTrainer ? "Edit trainer profile" : "Create trainer profile"}><form className="sport-subpanel grid gap-4 rounded-[1.5rem] p-5" onSubmit={handleSaveTrainerProfile}><div><p className="font-semibold uppercase tracking-[0.08em] text-accent-deep">Trainer profile</p><p className="mt-1 text-sm text-muted">Keep your coaching identity current and visible.</p></div><label className="grid gap-2"><span className={fieldLabelClass}>Portfolio headline</span><input className={formFieldClass} placeholder="Strength coach for busy professionals" value={trainerForm.headline} onChange={(event) => setTrainerForm((current) => ({ ...current, headline: event.target.value }))} /></label><label className="grid gap-2"><span className={fieldLabelClass}>Coaching style</span><textarea className={formTextareaClass} placeholder="Explain how you coach, what members can expect, and who you work best with." value={trainerForm.coachingStyle} onChange={(event) => setTrainerForm((current) => ({ ...current, coachingStyle: event.target.value }))} /></label><label className="grid gap-2"><span className={fieldLabelClass}>Specialties</span><input className={formFieldClass} placeholder="Mobility, fat loss, strength" value={trainerForm.specialties} onChange={(event) => setTrainerForm((current) => ({ ...current, specialties: event.target.value }))} /></label><div className="grid gap-4 sm:grid-cols-2"><label className="grid gap-2"><span className={fieldLabelClass}>Experience years</span><input className={formFieldClass} type="number" value={trainerForm.experienceYears} onChange={(event) => setTrainerForm((current) => ({ ...current, experienceYears: event.target.value }))} /></label><label className="grid gap-2"><span className={fieldLabelClass}>Certifications</span><input className={formFieldClass} placeholder="NASM CPT, Precision Nutrition" value={trainerForm.certifications} onChange={(event) => setTrainerForm((current) => ({ ...current, certifications: event.target.value }))} /></label></div><label className="grid gap-2"><span className={fieldLabelClass}>Achievements</span><input className={formFieldClass} placeholder="Powerlifting podiums, 100+ body recomposition clients" value={trainerForm.achievements} onChange={(event) => setTrainerForm((current) => ({ ...current, achievements: event.target.value }))} /></label><label className="grid gap-2"><span className={fieldLabelClass}>Bio</span><textarea className={formTextareaClass} value={trainerForm.bio} onChange={(event) => setTrainerForm((current) => ({ ...current, bio: event.target.value }))} /></label><div className="flex flex-wrap gap-3"><button className={primaryButtonClass} type="submit">{ownedTrainer ? "Save trainer profile" : "Create trainer profile"}</button>{ownedTrainer ? <button className={secondaryButtonClass} type="button" onClick={handleLoadTrainerProfile}>Load current trainer</button> : null}<button className={secondaryButtonClass} type="button" onClick={() => setActiveWorkspaceModal(null)}>Close</button></div></form></WorkspaceModal>
  </>;

  const trainerServiceCard = <>
    {renderWorkspaceActionCard({
    eyebrow: "Trainer services",
    title: ownedServices.length ? `${ownedServices.length} service${ownedServices.length === 1 ? "" : "s"} published` : "Publish your first trainer service",
    description: ownedServices.length ? "Only the services you have already created stay on the page. Open the modal to add or update one." : "Create PT, class, or online coaching offers from a modal instead of an inline form.",
    details: ownedServices.length ? ownedServices.slice(0, 3).map((service) => `${service.title} · ${service.schedule?.[0] ? `${service.schedule[0].day} ${service.schedule[0].startTime}-${service.schedule[0].endTime}` : "No slot yet"}`) : ["No trainer services published yet."],
    primaryLabel: editingServiceId ? "Continue editing service" : "Create service",
    onPrimary: () => setActiveWorkspaceModal("trainerService"),
    secondaryLabel: editingServiceId ? "Reset draft" : undefined,
    onSecondary: editingServiceId ? () => {
      resetServiceForm();
      setActiveWorkspaceModal("trainerService");
    } : undefined,
  })}
    <WorkspaceModal description="Publish PT, class, and remote coaching offers without leaving the workspace overview." isOpen={activeWorkspaceModal === "trainerService"} onClose={() => {
    resetServiceForm();
    setActiveWorkspaceModal(null);
  }} title={editingServiceId ? "Edit trainer service" : "Create trainer service"}><form className="sport-subpanel grid gap-4 rounded-[1.5rem] p-5" onSubmit={handleSaveService}><div><p className="font-semibold uppercase tracking-[0.08em] text-accent-deep">Service</p><p className="mt-1 text-sm text-muted">Add classes, personal training sessions, or online coaching with the actual slot members can book.</p></div><label className="grid gap-2"><span className={fieldLabelClass}>Title</span><input className={formFieldClass} value={serviceForm.title} onChange={(event) => setServiceForm((current) => ({ ...current, title: event.target.value }))} /></label><div className="grid gap-4 sm:grid-cols-2"><label className="grid gap-2"><span className={fieldLabelClass}>Category</span><input className={formFieldClass} value={serviceForm.category} onChange={(event) => setServiceForm((current) => ({ ...current, category: event.target.value }))} /></label><label className="grid gap-2"><span className={fieldLabelClass}>Type</span><input className={formFieldClass} value={serviceForm.type} onChange={(event) => setServiceForm((current) => ({ ...current, type: event.target.value }))} /></label></div><label className="grid gap-2"><span className={fieldLabelClass}>Description</span><textarea className={formTextareaClass} value={serviceForm.description} onChange={(event) => setServiceForm((current) => ({ ...current, description: event.target.value }))} /></label><div className="grid gap-4 sm:grid-cols-2"><label className="grid gap-2"><span className={fieldLabelClass}>Audience</span><select className={formFieldClass} value={serviceForm.audience} onChange={(event) => setServiceForm((current) => ({ ...current, audience: event.target.value as "all" | "ladies" }))}><option value="all">All members</option><option value="ladies">Ladies hour</option></select></label><label className="grid gap-2"><span className={fieldLabelClass}>Price</span><input className={formFieldClass} type="number" value={serviceForm.price} onChange={(event) => setServiceForm((current) => ({ ...current, price: event.target.value }))} /></label></div><div className="grid gap-4 sm:grid-cols-2"><label className="grid gap-2"><span className={fieldLabelClass}>Listed gym</span><select className={formFieldClass} value={selectedListedGymOption} onChange={(event) => handleListedGymChange(event.target.value)}><option value="">Select a listed gym</option>{gymShops.map((shop) => <option key={shop._id} value={shop._id}>{shop.shopName} {shop.location ? `(${shop.location})` : ""}</option>)}</select></label><div className="rounded-2xl border border-dashed border-white/18 bg-white/70 px-4 py-3 text-sm leading-6 text-muted">Selecting a listed gym links this trainer service into both the trainer and gym discovery flows.</div></div><div className="grid gap-4 sm:grid-cols-2"><label className="grid gap-2"><span className={fieldLabelClass}>City</span><input className={formFieldClass} value={serviceForm.city} onChange={(event) => setServiceForm((current) => ({ ...current, city: event.target.value }))} /></label><label className="grid gap-2"><span className={fieldLabelClass}>Venue / gym name</span><input className={formFieldClass} value={serviceForm.venueName} onChange={(event) => setServiceForm((current) => ({ ...current, venueName: event.target.value }))} /></label></div><div className="rounded-2xl border border-black/8 bg-white/70 px-4 py-4"><p className="text-sm font-semibold text-accent-deep">Ways members can train</p><div className="mt-3 grid gap-3 sm:grid-cols-2"><label className="flex items-start gap-3 rounded-2xl border border-black/8 bg-white px-4 py-4 text-sm text-muted"><input checked={serviceForm.supportsInPerson} className="mt-1 h-4 w-4" onChange={(event) => setServiceForm((current) => ({ ...current, supportsInPerson: event.target.checked }))} type="checkbox" /><span><span className="block font-semibold text-accent-deep">In person</span><span className="mt-1 block">Use this for gym-floor, studio, or venue-based sessions.</span></span></label><label className="flex items-start gap-3 rounded-2xl border border-black/8 bg-white px-4 py-4 text-sm text-muted"><input checked={serviceForm.supportsOnline} className="mt-1 h-4 w-4" onChange={(event) => setServiceForm((current) => ({ ...current, supportsOnline: event.target.checked }))} type="checkbox" /><span><span className="block font-semibold text-accent-deep">Online</span><span className="mt-1 block">Members can request a remote session if you publish it here.</span></span></label></div><div className="mt-3 grid gap-4 sm:grid-cols-2"><label className="grid gap-2"><span className={fieldLabelClass}>Online session label</span><input className={formFieldClass} placeholder="Zoom coaching, video check-in" value={serviceForm.onlineLabel} onChange={(event) => setServiceForm((current) => ({ ...current, onlineLabel: event.target.value }))} /></label><label className="grid gap-2"><span className={fieldLabelClass}>Outdoor locations</span><input className={formFieldClass} placeholder="Seaside track, Central Park, Corniche" value={serviceForm.outdoorLocations} onChange={(event) => setServiceForm((current) => ({ ...current, outdoorLocations: event.target.value }))} /></label></div></div><div className="grid gap-4 sm:grid-cols-2"><label className="grid gap-2"><span className={fieldLabelClass}>Capacity</span><input className={formFieldClass} type="number" min="1" value={serviceForm.capacity} onChange={(event) => setServiceForm((current) => ({ ...current, capacity: event.target.value }))} /></label><div className="rounded-2xl border border-dashed border-white/18 bg-white/70 px-4 py-3 text-sm leading-6 text-muted">Use Ladies hour for women-only PT or classes so the gym view can mark that time clearly.</div></div><div className="grid gap-4 sm:grid-cols-3"><label className="grid gap-2"><span className={fieldLabelClass}>Day</span><select className={formFieldClass} value={serviceForm.day} onChange={(event) => setServiceForm((current) => ({ ...current, day: event.target.value }))}><option value="Monday">Monday</option><option value="Tuesday">Tuesday</option><option value="Wednesday">Wednesday</option><option value="Thursday">Thursday</option><option value="Friday">Friday</option><option value="Saturday">Saturday</option><option value="Sunday">Sunday</option></select></label><label className="grid gap-2"><span className={fieldLabelClass}>Start time</span><input className={formFieldClass} type="time" value={serviceForm.startTime} onChange={(event) => setServiceForm((current) => ({ ...current, startTime: event.target.value }))} /></label><label className="grid gap-2"><span className={fieldLabelClass}>End time</span><input className={formFieldClass} type="time" value={serviceForm.endTime} onChange={(event) => setServiceForm((current) => ({ ...current, endTime: event.target.value }))} /></label></div><div className="flex flex-wrap gap-3"><button className={primaryButtonClass} type="submit">{editingServiceId ? "Update service" : "Create service"}</button>{editingServiceId ? <button className={secondaryButtonClass} type="button" onClick={() => {
      resetServiceForm();
      setActiveWorkspaceModal(null);
    }}>Cancel edit</button> : null}<button className={secondaryButtonClass} type="button" onClick={() => {
      resetServiceForm();
      setActiveWorkspaceModal(null);
    }}>Close</button></div></form></WorkspaceModal>
  </>;

  const shopCard = <>
    {renderWorkspaceActionCard({
    eyebrow: "Shop profile",
    title: ownedShop ? ownedShop.shopName : "Create your venue or shop",
    description: ownedShop ? "Your venue details, busy hours, and public links stay on the page as a summary. Open the modal to edit them." : "Create the venue once, then keep the workspace focused on what is already published.",
    details: ownedShop ? [ownedShop.location || "No location published yet.", ownedShop.categories.length ? `Categories: ${ownedShop.categories.join(", ")}` : "No categories published yet.", ownedShop.peakHoursBusy ? `Peak hours: ${ownedShop.peakHoursBusy}` : "No peak hours published yet."] : ["No shop or venue profile published yet."],
    primaryLabel: ownedShop ? "Edit shop" : "Create shop",
    onPrimary: openShopProfileModal,
    secondaryLabel: ownedShop ? "Refresh from live data" : undefined,
    onSecondary: ownedShop ? handleLoadOwnedShop : undefined,
  })}
    <WorkspaceModal description="Edit your gym or shop profile, busy hours, links, and public description without expanding the workspace page." isOpen={activeWorkspaceModal === "shopProfile"} onClose={() => setActiveWorkspaceModal(null)} title={ownedShop ? "Edit shop" : "Create shop"}><form className="sport-subpanel grid gap-4 rounded-[1.5rem] p-5" onSubmit={handleSaveShop}><div><p className="font-semibold uppercase tracking-[0.08em] text-accent-deep">Shop</p><p className="mt-1 text-sm text-muted">Update your storefront details and public presence.</p></div><label className="grid gap-2"><span className={fieldLabelClass}>Shop name</span><input className={formFieldClass} value={shopForm.shopName} onChange={(event) => setShopForm((current) => ({ ...current, shopName: event.target.value }))} /></label><label className="grid gap-2"><span className={fieldLabelClass}>Categories</span><input className={formFieldClass} value={shopForm.categories} onChange={(event) => setShopForm((current) => ({ ...current, categories: event.target.value }))} /></label><label className="grid gap-2"><span className={fieldLabelClass}>Location</span><input className={formFieldClass} value={shopForm.location} onChange={(event) => setShopForm((current) => ({ ...current, location: event.target.value }))} /></label><label className="grid gap-2"><span className={fieldLabelClass}>Description</span><textarea className={formTextareaClass} value={shopForm.description} onChange={(event) => setShopForm((current) => ({ ...current, description: event.target.value }))} /></label><label className="grid gap-2"><span className={fieldLabelClass}>Logo image URL</span><input className={formFieldClass} placeholder="https://..." value={shopForm.logoUrl} onChange={(event) => setShopForm((current) => ({ ...current, logoUrl: event.target.value }))} /></label><label className="grid gap-2"><span className={fieldLabelClass}>Website link</span><input className={formFieldClass} value={shopForm.websiteLink} onChange={(event) => setShopForm((current) => ({ ...current, websiteLink: event.target.value }))} /></label><div className="grid gap-4 sm:grid-cols-2"><label className="grid gap-2"><span className={fieldLabelClass}>Peak busy hours</span><input className={formFieldClass} placeholder="5:00 PM - 8:00 PM" value={shopForm.peakHoursBusy} onChange={(event) => setShopForm((current) => ({ ...current, peakHoursBusy: event.target.value }))} /></label><label className="grid gap-2"><span className={fieldLabelClass}>Quieter hours</span><input className={formFieldClass} placeholder="9:00 AM - 12:00 PM" value={shopForm.peakHoursQuiet} onChange={(event) => setShopForm((current) => ({ ...current, peakHoursQuiet: event.target.value }))} /></label></div><label className="grid gap-2"><span className={fieldLabelClass}>Peak-hours note</span><textarea className={formTextareaClass} placeholder="Tell members when classes fill quickly or when the floor is quieter." value={shopForm.peakHoursNotes} onChange={(event) => setShopForm((current) => ({ ...current, peakHoursNotes: event.target.value }))} /></label><div className="flex flex-wrap gap-3"><button className={primaryButtonClass} type="submit">{ownedShop ? "Update shop" : "Create shop"}</button>{ownedShop ? <button className={secondaryButtonClass} type="button" onClick={handleLoadOwnedShop}>Load current shop</button> : null}{ownedShop ? <button className="min-h-11 rounded-full border border-rose-300 px-5 py-3 text-sm font-semibold uppercase tracking-[0.12em] text-rose-700 transition-colors hover:bg-rose-100" type="button" onClick={handleDeleteShop}>Delete shop</button> : null}<button className={secondaryButtonClass} type="button" onClick={() => setActiveWorkspaceModal(null)}>Close</button></div></form></WorkspaceModal>
  </>;

  const shopProductCard = <>
    {renderWorkspaceActionCard({
    eyebrow: "Products",
    title: products.length ? `${products.length} product${products.length === 1 ? "" : "s"} listed` : "Add your first product",
    description: products.length ? "The page only shows what is already in your shop. Open the modal to add or edit products." : "Use the product modal to add items without expanding the workspace page.",
    details: products.length ? products.slice(0, 3).map((product) => `${product.name} · ${product.currency} ${product.price}`) : ["No products published yet."],
    primaryLabel: editingProductId ? "Continue editing product" : "Add product",
    onPrimary: openShopProductModal,
    secondaryLabel: editingProductId ? "Reset draft" : undefined,
    onSecondary: editingProductId ? () => {
      resetProductForm();
      setActiveWorkspaceModal("shopProduct");
    } : undefined,
  })}
    <WorkspaceModal description="Add or update inventory items in a dedicated modal and keep the workspace focused on the published list." isOpen={activeWorkspaceModal === "shopProduct"} onClose={() => {
    resetProductForm();
    setActiveWorkspaceModal(null);
  }} title={editingProductId ? "Edit product" : "Add product"}><form className="sport-subpanel grid gap-4 rounded-[1.5rem] p-5" onSubmit={handleSaveProduct}><div><p className="font-semibold uppercase tracking-[0.08em] text-accent-deep">Product</p><p className="mt-1 text-sm text-muted">Add or update the items shown in your storefront.</p></div><label className="grid gap-2"><span className={fieldLabelClass}>Product name</span><input className={formFieldClass} value={productForm.name} onChange={(event) => setProductForm((current) => ({ ...current, name: event.target.value }))} /></label><label className="grid gap-2"><span className={fieldLabelClass}>Price</span><input className={formFieldClass} type="number" value={productForm.price} onChange={(event) => setProductForm((current) => ({ ...current, price: event.target.value }))} /></label><label className="grid gap-2"><span className={fieldLabelClass}>Description</span><textarea className={formTextareaClass} value={productForm.description} onChange={(event) => setProductForm((current) => ({ ...current, description: event.target.value }))} /></label><label className="grid gap-2"><span className={fieldLabelClass}>External link</span><input className={formFieldClass} value={productForm.externalLink} onChange={(event) => setProductForm((current) => ({ ...current, externalLink: event.target.value }))} /></label><div className="flex flex-wrap gap-3"><button className={primaryButtonClass} type="submit">{editingProductId ? "Update product" : "Add product"}</button>{editingProductId ? <button className={secondaryButtonClass} type="button" onClick={() => {
      resetProductForm();
      setActiveWorkspaceModal(null);
    }}>Cancel edit</button> : null}<button className={secondaryButtonClass} type="button" onClick={() => {
      resetProductForm();
      setActiveWorkspaceModal(null);
    }}>Close</button></div></form></WorkspaceModal>
  </>;

  const venueOfferCard = <>
    {renderWorkspaceActionCard({
    eyebrow: "Venue offers",
    title: ownedShopVenueServices.length ? `${ownedShopVenueServices.length} offer${ownedShopVenueServices.length === 1 ? "" : "s"} published` : "Publish your first venue offer",
    description: ownedShopVenueServices.length ? "Classes, memberships, PT slots, and events stay visible here as summaries. Open the modal to publish or edit one." : "Publish memberships, day entry, classes, PT slots, or events from a modal instead of an inline form.",
    details: ownedShopVenueServices.length ? ownedShopVenueServices.slice(0, 3).map((service) => `${service.title} · ${service.category} · ${service.currency} ${service.price}`) : ["No venue offers published yet."],
    primaryLabel: editingServiceId && activeWorkspaceModal === "shopVenueOffer" ? "Continue editing offer" : "Publish venue offer",
    onPrimary: openVenueOfferModal,
  })}
    <WorkspaceModal description="Publish memberships, day entry, classes, PT slots, and events without pushing the rest of the workspace down the page." isOpen={activeWorkspaceModal === "shopVenueOffer"} onClose={() => {
    resetServiceForm();
    setActiveWorkspaceModal(null);
  }} title={editingServiceId ? "Edit venue offer" : "Publish venue offer"}><form className="sport-subpanel grid gap-4 rounded-[1.5rem] p-5" onSubmit={handleSaveService}><div><p className="font-semibold uppercase tracking-[0.08em] text-accent-deep">Venue offer</p><p className="mt-1 text-sm text-muted">Publish day entry, memberships, classes, PT slots, or events like races and challenges from your gym workspace.</p></div><label className="grid gap-2"><span className={fieldLabelClass}>Title</span><input className={formFieldClass} placeholder="Monthly membership, Day entry, Sunset run race" value={serviceForm.title} onChange={(event) => setServiceForm((current) => ({ ...current, title: event.target.value }))} /></label><div className="grid gap-4 sm:grid-cols-2"><label className="grid gap-2"><span className={fieldLabelClass}>Category</span><input className={formFieldClass} placeholder="membership, class, event, PT" value={serviceForm.category} onChange={(event) => setServiceForm((current) => ({ ...current, category: event.target.value }))} /></label><label className="grid gap-2"><span className={fieldLabelClass}>Type</span><input className={formFieldClass} placeholder="Monthly access, Bootcamp, Biggest loser competition" value={serviceForm.type} onChange={(event) => setServiceForm((current) => ({ ...current, type: event.target.value }))} /></label></div><label className="grid gap-2"><span className={fieldLabelClass}>Description</span><textarea className={formTextareaClass} value={serviceForm.description} onChange={(event) => setServiceForm((current) => ({ ...current, description: event.target.value }))} /></label><div className="grid gap-4 sm:grid-cols-2"><label className="grid gap-2"><span className={fieldLabelClass}>Audience</span><select className={formFieldClass} value={serviceForm.audience} onChange={(event) => setServiceForm((current) => ({ ...current, audience: event.target.value as "all" | "ladies" }))}><option value="all">All members</option><option value="ladies">Ladies hour</option></select></label><label className="grid gap-2"><span className={fieldLabelClass}>Price</span><input className={formFieldClass} type="number" value={serviceForm.price} onChange={(event) => setServiceForm((current) => ({ ...current, price: event.target.value }))} /></label></div><div className="grid gap-4 sm:grid-cols-2"><label className="grid gap-2"><span className={fieldLabelClass}>Hosted at</span><select className={formFieldClass} value={serviceForm.linkedShopId || ownedShop?._id || ""} onChange={(event) => handleListedGymChange(event.target.value)}><option value="">Select a listed gym</option>{gymShops.map((shop) => <option key={shop._id} value={shop._id}>{shop.shopName} {shop.location ? `(${shop.location})` : ""}</option>)}</select></label><div className="rounded-2xl border border-dashed border-white/18 bg-white/70 px-4 py-3 text-sm leading-6 text-muted">Use membership, day entry, class, or event wording in the title/type so discovery groups the offer correctly.</div></div><div className="grid gap-4 sm:grid-cols-2"><label className="grid gap-2"><span className={fieldLabelClass}>City</span><input className={formFieldClass} value={serviceForm.city} onChange={(event) => setServiceForm((current) => ({ ...current, city: event.target.value }))} /></label><label className="grid gap-2"><span className={fieldLabelClass}>Venue name</span><input className={formFieldClass} value={serviceForm.venueName} onChange={(event) => setServiceForm((current) => ({ ...current, venueName: event.target.value }))} /></label></div><div className="grid gap-4 sm:grid-cols-2"><label className="grid gap-2"><span className={fieldLabelClass}>Capacity</span><input className={formFieldClass} type="number" min="1" value={serviceForm.capacity} onChange={(event) => setServiceForm((current) => ({ ...current, capacity: event.target.value }))} /></label><div className="rounded-2xl border border-dashed border-white/18 bg-white/70 px-4 py-3 text-sm leading-6 text-muted">Turn on online or outdoor only for offers where members should pick a remote or outside setup.</div></div><div className="rounded-2xl border border-black/8 bg-white/70 px-4 py-4"><p className="text-sm font-semibold text-accent-deep">Ways members can access this offer</p><div className="mt-3 grid gap-3 sm:grid-cols-2"><label className="flex items-start gap-3 rounded-2xl border border-black/8 bg-white px-4 py-4 text-sm text-muted"><input checked={serviceForm.supportsInPerson} className="mt-1 h-4 w-4" onChange={(event) => setServiceForm((current) => ({ ...current, supportsInPerson: event.target.checked }))} type="checkbox" /><span><span className="block font-semibold text-accent-deep">In person</span><span className="mt-1 block">For gym floor access, memberships, day entry, classes, and hosted events.</span></span></label><label className="flex items-start gap-3 rounded-2xl border border-black/8 bg-white px-4 py-4 text-sm text-muted"><input checked={serviceForm.supportsOnline} className="mt-1 h-4 w-4" onChange={(event) => setServiceForm((current) => ({ ...current, supportsOnline: event.target.checked }))} type="checkbox" /><span><span className="block font-semibold text-accent-deep">Online</span><span className="mt-1 block">Useful for remote coaching, livestream classes, or hybrid events.</span></span></label></div><div className="mt-3 grid gap-4 sm:grid-cols-2"><label className="grid gap-2"><span className={fieldLabelClass}>Online session label</span><input className={formFieldClass} placeholder="Livestream class, Zoom check-in" value={serviceForm.onlineLabel} onChange={(event) => setServiceForm((current) => ({ ...current, onlineLabel: event.target.value }))} /></label><label className="grid gap-2"><span className={fieldLabelClass}>Outdoor locations</span><input className={formFieldClass} placeholder="Beach track, park circuit, marina route" value={serviceForm.outdoorLocations} onChange={(event) => setServiceForm((current) => ({ ...current, outdoorLocations: event.target.value }))} /></label></div></div><div className="grid gap-4 sm:grid-cols-3"><label className="grid gap-2"><span className={fieldLabelClass}>Day</span><select className={formFieldClass} value={serviceForm.day} onChange={(event) => setServiceForm((current) => ({ ...current, day: event.target.value }))}><option value="Monday">Monday</option><option value="Tuesday">Tuesday</option><option value="Wednesday">Wednesday</option><option value="Thursday">Thursday</option><option value="Friday">Friday</option><option value="Saturday">Saturday</option><option value="Sunday">Sunday</option></select></label><label className="grid gap-2"><span className={fieldLabelClass}>Start time</span><input className={formFieldClass} type="time" value={serviceForm.startTime} onChange={(event) => setServiceForm((current) => ({ ...current, startTime: event.target.value }))} /></label><label className="grid gap-2"><span className={fieldLabelClass}>End time</span><input className={formFieldClass} type="time" value={serviceForm.endTime} onChange={(event) => setServiceForm((current) => ({ ...current, endTime: event.target.value }))} /></label></div><div className="flex flex-wrap gap-3"><button className={primaryButtonClass} type="submit">{editingServiceId ? "Update venue offer" : "Publish venue offer"}</button>{editingServiceId ? <button className={secondaryButtonClass} type="button" onClick={() => {
      resetServiceForm();
      setActiveWorkspaceModal(null);
    }}>Cancel edit</button> : null}<button className={secondaryButtonClass} type="button" onClick={() => {
      resetServiceForm();
      setActiveWorkspaceModal(null);
    }}>Close</button></div></form></WorkspaceModal>
  </>;

  const memberProfileCard = (
    <div className="rounded-[1.5rem] bg-background p-5">
      <p className="text-xs uppercase tracking-[0.18em] text-muted">Member profile</p>
      <h4 className="mt-2 text-xl font-bold tracking-[-0.03em] text-accent-deep">{currentUser?.name ?? "Member"}</h4>
      <p className="mt-1 text-sm text-muted">{currentUser?.email ?? "No email on file"}</p>
      <div className="mt-4 grid gap-2">
        <div className="rounded-2xl border border-black/8 bg-white px-4 py-3 text-sm text-muted">
          Role: <span className="font-semibold text-accent-deep">{roleLabel}</span>
        </div>
        <div className="rounded-2xl border border-black/8 bg-white px-4 py-3 text-sm text-muted">
          Latest weight: <span className="font-semibold text-accent-deep">{typeof memberMeasurementSnapshot.latest?.weightKg === "number" ? `${memberMeasurementSnapshot.latest.weightKg.toFixed(1)} kg` : "Not logged"}</span>
        </div>
        <div className="rounded-2xl border border-black/8 bg-white px-4 py-3 text-sm text-muted">
          Latest waist: <span className="font-semibold text-accent-deep">{typeof memberMeasurementSnapshot.latest?.waistCm === "number" ? `${memberMeasurementSnapshot.latest.waistCm.toFixed(1)} cm` : "Not logged"}</span>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-3">
        <button className={primaryButtonClass} onClick={() => setIsMemberMeasurementModalOpen(true)} type="button">Add measurement</button>
        <Link className={secondaryButtonClass} href="/meal-plans">Meal plans</Link>
      </div>
    </div>
  );

  const memberBookingCard = (
    <div className="rounded-[1.5rem] bg-background p-5">
      <p className="text-xs uppercase tracking-[0.18em] text-muted">Member tools</p>
      {selectedMemberBooking ? <button className="mt-3 w-full rounded-[1.35rem] bg-accent-deep px-5 py-5 text-left text-surface shadow-[0_18px_34px_rgba(8,19,32,0.18)]" onClick={() => {
      setSelectedMemberBookingId(selectedMemberBooking._id);
      document.getElementById("member-bookings-details")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }} type="button"><p className="text-xs uppercase tracking-[0.16em] text-surface/70">Next class / session</p><p className="mt-2 text-2xl font-bold tracking-[-0.03em]">{selectedMemberBooking.serviceId?.title ?? "Session"}</p><p className="mt-2 text-sm text-surface/80">{formatBookingDateTime(selectedMemberBooking)}</p><p className="mt-1 text-xs uppercase tracking-[0.16em] text-surface/72">Tap to open details, request change, or request cancellation</p></button> : <div className="mt-3 rounded-2xl border border-dashed border-black/10 bg-white px-4 py-4 text-sm text-muted">No next session yet. Book one to open a focused details view.</div>}
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <article className="rounded-2xl border border-black/8 bg-[#eef3ef] px-4 py-4"><p className="text-xs uppercase tracking-[0.16em] text-muted">Upcoming</p><p className="mt-2 text-lg font-semibold text-accent-deep">{upcomingMemberBookings.length}</p></article>
        <article className="rounded-2xl border border-black/8 bg-[#eef3ef] px-4 py-4"><p className="text-xs uppercase tracking-[0.16em] text-muted">Reschedule threads</p><p className="mt-2 text-lg font-semibold text-accent-deep">{memberAttendanceSummary.rescheduleRequests}</p></article>
        <article className="rounded-2xl border border-black/8 bg-[#eef3ef] px-4 py-4"><p className="text-xs uppercase tracking-[0.16em] text-muted">Measurement logs</p><p className="mt-2 text-lg font-semibold text-accent-deep">{bodyMeasurements.length}</p></article>
      </div>
      <div className="mt-4 flex flex-wrap gap-3">
        <Link className={primaryButtonClass} href="/discover?view=pt">Book PT</Link>
        <Link className={secondaryButtonClass} href="/discover?view=group">Browse groups</Link>
      </div>
    </div>
  );

  const memberBookingsCard = (
    <div className="rounded-[1.5rem] bg-background p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="font-semibold text-accent-deep">Measurement progress and booking details</p>
          <p className="mt-1 text-sm text-muted">Use trainer-style measurement charts, then open one booking for changes or cancellation requests.</p>
        </div>
        <p className="text-xs uppercase tracking-[0.16em] text-muted">{bookings.length} total</p>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-4">
        <article className="rounded-2xl border border-black/8 bg-[#eef3ef] px-4 py-4"><p className="text-xs uppercase tracking-[0.16em] text-muted">Latest weight</p><p className="mt-2 text-lg font-semibold text-accent-deep">{typeof memberMeasurementSnapshot.latest?.weightKg === "number" ? `${memberMeasurementSnapshot.latest.weightKg.toFixed(1)} kg` : "Not logged"}</p></article>
        <article className="rounded-2xl border border-black/8 bg-[#eef3ef] px-4 py-4"><p className="text-xs uppercase tracking-[0.16em] text-muted">Latest waist</p><p className="mt-2 text-lg font-semibold text-accent-deep">{typeof memberMeasurementSnapshot.latest?.waistCm === "number" ? `${memberMeasurementSnapshot.latest.waistCm.toFixed(1)} cm` : "Not logged"}</p></article>
        <article className="rounded-2xl border border-black/8 bg-[#eef3ef] px-4 py-4"><p className="text-xs uppercase tracking-[0.16em] text-muted">Weight delta</p><p className="mt-2 text-lg font-semibold text-accent-deep">{memberMeasurementSnapshot.weightChange !== null ? `${memberMeasurementSnapshot.weightChange > 0 ? "+" : ""}${memberMeasurementSnapshot.weightChange.toFixed(1)} kg` : "No change yet"}</p></article>
        <article className="rounded-2xl border border-black/8 bg-[#eef3ef] px-4 py-4"><p className="text-xs uppercase tracking-[0.16em] text-muted">Waist delta</p><p className="mt-2 text-lg font-semibold text-accent-deep">{memberMeasurementSnapshot.waistChange !== null ? `${memberMeasurementSnapshot.waistChange > 0 ? "+" : ""}${memberMeasurementSnapshot.waistChange.toFixed(1)} cm` : "No change yet"}</p></article>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
        {trainerMeasurementMetrics.map((metric) => <MeasurementTrendChart key={`member-record-${metric.title}`} accessor={metric.accessor} items={bodyMeasurements} stroke={metric.stroke} title={metric.title} unit={metric.unit} />)}
      </div>

      {(() => {
        const activeBookings = bookings.filter((b) => b.status !== "cancelled" && b.status !== "completed");
        const historyBookings = bookings.filter((b) => b.status === "cancelled" || b.status === "completed");
        return (
          <div className="mt-4 grid gap-3">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs uppercase tracking-[0.16em] text-muted">Upcoming bookings</p>
              {historyBookings.length > 0 ? <button className="text-xs uppercase tracking-[0.16em] text-muted underline underline-offset-2" onClick={() => setShowMemberBookingHistory((prev) => !prev)} type="button">{showMemberBookingHistory ? "Hide history" : `History (${historyBookings.length})`}</button> : null}
            </div>
            {activeBookings.length > 0 ? activeBookings.map((booking) => (
              <button key={booking._id} className={selectedMemberBooking?._id === booking._id ? "rounded-2xl border border-accent-deep bg-white px-4 py-4 text-left" : "rounded-2xl border border-black/8 bg-white px-4 py-4 text-left"} onClick={() => setSelectedMemberBookingId(booking._id)} type="button">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-accent-deep">{booking.serviceId?.title ?? "Booking"}</p>
                    <p className="mt-1 text-sm text-muted">{new Date(booking.bookingDate).toLocaleDateString()} · {booking.timeSlot}</p>
                  </div>
                  <p className="text-xs uppercase tracking-[0.16em] text-muted">{booking.status.replaceAll("_", " ")}</p>
                </div>
              </button>
            )) : <div className="rounded-2xl border border-dashed border-black/10 bg-white px-4 py-4 text-sm text-muted">No upcoming bookings. {historyBookings.length > 0 ? "Toggle history below to see past sessions." : "Book a session to get started."}</div>}
            {showMemberBookingHistory && historyBookings.length > 0 ? (
              <div className="mt-1 grid gap-3">
                <p className="text-xs uppercase tracking-[0.16em] text-muted">History</p>
                {historyBookings.map((booking) => (
                  <button key={booking._id} className={selectedMemberBooking?._id === booking._id ? "rounded-2xl border border-accent-deep bg-white px-4 py-4 text-left opacity-70" : "rounded-2xl border border-black/8 bg-white px-4 py-4 text-left opacity-60"} onClick={() => setSelectedMemberBookingId(booking._id)} type="button">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-accent-deep">{booking.serviceId?.title ?? "Booking"}</p>
                        <p className="mt-1 text-sm text-muted">{new Date(booking.bookingDate).toLocaleDateString()} · {booking.timeSlot}</p>
                      </div>
                      <p className="text-xs uppercase tracking-[0.16em] text-muted">{booking.status.replaceAll("_", " ")}</p>
                    </div>
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        );
      })()}

      {selectedMemberBooking ? <div id="member-bookings-details" className="mt-5 rounded-2xl border border-black/8 bg-white px-4 py-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs uppercase tracking-[0.16em] text-muted">Booking details</p><h4 className="mt-2 text-xl font-bold tracking-[-0.03em] text-accent-deep">{selectedMemberBooking.serviceId?.title ?? "Session"}</h4><p className="mt-1 text-sm text-muted">{formatBookingDateTime(selectedMemberBooking)}</p>{selectedMemberBooking.trainerId?.userId?.name ? <p className="mt-1 text-sm text-muted">Coach: {selectedMemberBooking.trainerId.userId.name}</p> : null}</div><div className="text-right"><p className="text-xs uppercase tracking-[0.16em] text-muted">{selectedMemberBooking.status.replaceAll("_", " ")}</p><p className="mt-1 text-xs uppercase tracking-[0.16em] text-muted">{selectedMemberBooking.paymentStatus?.replaceAll("_", " ") ?? "not due"}</p></div></div><div className="mt-4 flex flex-wrap gap-3">{selectedMemberBooking.status !== "cancelled" && selectedMemberBooking.status !== "completed" ? <button className="rounded-full border border-rose-300 px-4 py-2 text-sm font-semibold text-rose-700" onClick={() => handleRequestMemberCancellation(selectedMemberBooking._id)} type="button">Request cancel anytime</button> : null}{canRequestBookingReschedule(selectedMemberBooking) && selectedMemberBooking.status !== "cancelled" ? <button className="rounded-full border border-black/10 px-4 py-2 text-sm font-semibold text-accent-deep" onClick={() => handleStartMemberReschedule(selectedMemberBooking)} type="button">Request change</button> : null}</div>{memberRescheduleDraft?.bookingId === selectedMemberBooking._id ? <div className="mt-4 grid gap-3 rounded-2xl bg-background px-4 py-4"><p className="text-xs uppercase tracking-[0.16em] text-muted">Request a new slot</p><div className="grid gap-3 sm:grid-cols-2"><input className="rounded-2xl border border-black/10 bg-white px-4 py-3 outline-none" type="date" value={memberRescheduleDraft.bookingDate} onChange={(event) => setMemberRescheduleDraft((current) => current ? { ...current, bookingDate: event.target.value } : current)} /><input className="rounded-2xl border border-black/10 bg-white px-4 py-3 outline-none" placeholder="09:00-10:00" value={memberRescheduleDraft.timeSlot} onChange={(event) => setMemberRescheduleDraft((current) => current ? { ...current, timeSlot: event.target.value } : current)} /></div><textarea className="min-h-20 rounded-2xl border border-black/10 bg-white px-4 py-3 outline-none" placeholder="Reason for the change request" value={memberRescheduleDraft.reason} onChange={(event) => setMemberRescheduleDraft((current) => current ? { ...current, reason: event.target.value } : current)} /><div className="flex flex-wrap gap-3"><button className={primaryButtonClass} onClick={handleSubmitMemberRescheduleRequest} type="button">Send request</button><button className={secondaryButtonClass} onClick={() => setMemberRescheduleDraft(null)} type="button">Cancel</button></div></div> : null}{selectedMemberBooking.rescheduleStatus === "counter_proposed_by_host" && selectedMemberBooking.proposedSlots?.length ? <div className="mt-4 grid gap-3 rounded-2xl bg-background px-4 py-4"><p className="text-xs uppercase tracking-[0.16em] text-muted">Host proposed alternatives</p><select className="rounded-2xl border border-black/10 bg-white px-4 py-3 outline-none" value={memberRescheduleChoice[selectedMemberBooking._id] ?? ""} onChange={(event) => setMemberRescheduleChoice((current) => ({ ...current, [selectedMemberBooking._id]: event.target.value }))}><option value="">Select a proposed slot</option>{selectedMemberBooking.proposedSlots.map((slot) => { const slotKey = formatProposedSlotKey(slot.bookingDate, slot.timeSlot); return <option key={slotKey} value={slotKey}>{new Date(slot.bookingDate).toLocaleDateString()} · {slot.timeSlot}</option>; })}</select><div className="flex flex-wrap gap-3"><button className={primaryButtonClass} onClick={() => handleRespondMemberReschedule(selectedMemberBooking, "approve")} type="button">Approve selected slot</button><button className="rounded-full border border-rose-300 px-5 py-3 text-sm font-semibold text-rose-700" onClick={() => handleRespondMemberReschedule(selectedMemberBooking, "decline")} type="button">Decline and cancel</button></div></div> : null}</div> : null}
    </div>
  );

  const manageSection = (
    <section className="rounded-[2rem] border border-black/5 bg-surface p-8 sm:p-10">
      <p className="text-sm uppercase tracking-[0.2em] text-muted">Workspace</p>
      <h2 className="mt-3 text-3xl font-bold tracking-[-0.03em] text-accent-deep">{shouldShowOperatorWorkspace ? "A cleaner working area for trainers, gym owners, shops, and admins" : "A cleaner member workspace with trainer-style cards"}</h2>
      <p className="mt-3 max-w-2xl text-sm leading-7 text-muted">{shouldShowOperatorWorkspace ? "Workspace is reserved for the roles that publish offers, run sessions, or manage operations. Member booking status now lives on home and profile instead." : "Members get the same card arrangement and color language as trainer workspace, while keeping member-only actions and booking visibility."}</p>
      {!currentUser ? <div className="mt-8 rounded-[1.5rem] border border-black/6 bg-background p-6"><p className="text-lg font-semibold text-accent-deep">Login to open your workspace</p><p className="mt-3 max-w-2xl text-sm leading-7 text-muted">Your account decides which tools appear here, so the workspace stays focused and uncluttered.</p><div className="mt-5"><button className="rounded-full bg-accent-deep px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#204938]" onClick={() => openAuthModal("login")} type="button">Login</button></div></div> : shouldShowOperatorWorkspace ? <><div className="mt-6 grid gap-4 lg:grid-cols-3">{memberSummary.map((item) => <article key={item.label} className="rounded-[1.5rem] border border-black/6 bg-background px-5 py-4"><p className="text-xs uppercase tracking-[0.18em] text-muted">{item.label}</p><p className="mt-3 text-xl font-bold tracking-[-0.03em] text-accent-deep">{item.value}</p></article>)}</div>
      {workspaceNextAction ? <div className="mt-6 rounded-[1.6rem] bg-accent-deep px-6 py-6 text-surface shadow-[0_18px_44px_rgba(8,19,32,0.24)]"><p className="text-sm uppercase tracking-[0.18em] text-surface/70">{workspaceNextAction.eyebrow}</p><div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between"><div><h3 className="text-2xl font-bold tracking-[-0.04em]">{workspaceNextAction.title}</h3><p className="mt-2 max-w-3xl text-sm leading-7 text-surface/78">{workspaceNextAction.description}</p></div><button className="rounded-full bg-white px-5 py-3 text-sm font-semibold uppercase tracking-[0.12em] text-accent-deep transition-colors hover:bg-accent" onClick={workspaceNextAction.onClick} type="button">{workspaceNextAction.label}</button></div></div> : null}
      {workspaceViewOptions.length > 1 ? <div className="mt-6 flex flex-wrap gap-3">{workspaceViewOptions.map((option) => <button key={option.key} className={activeWorkspaceView === option.key ? "rounded-full bg-accent-deep px-5 py-3 text-sm font-semibold uppercase tracking-[0.12em] text-white" : "rounded-full border border-black/10 bg-background px-5 py-3 text-sm font-semibold uppercase tracking-[0.12em] text-accent-deep transition-colors hover:border-accent hover:bg-accent"} onClick={() => setWorkspaceView(option.key)} type="button">{option.label}</button>)}</div> : null}
      <div className="mt-6 grid gap-4 lg:grid-cols-2 xl:grid-cols-4">{filteredWorkspacePanels.map((panel) => <article key={panel.title} className={`rounded-[1.5rem] border px-5 py-5 ${panel.accent}`}><p className="text-sm font-semibold uppercase tracking-[0.18em]">{panel.title}</p><p className="mt-3 text-sm leading-7 opacity-80">{panel.description}</p></article>)}</div>
      <div className="mt-8 grid gap-6">
        {showTrainerWorkspaceSection ? <TrainerWorkspaceSection
          profileCard={trainerProfileCard}
          serviceCard={trainerServiceCard}
          servicesCard={<div className="rounded-[1.5rem] bg-background p-5"><div><p className="font-semibold text-accent-deep">My services</p><p className="mt-1 text-sm text-muted">Review, schedule, and update the services currently attached to your profile.</p></div><div className="mt-4 grid gap-3">{ownedServices.length > 0 ? ownedServices.map((service) => <article key={service._id} className="rounded-2xl border border-black/8 p-4"><p className="font-semibold text-accent-deep">{service.title}</p><p className="mt-1 text-sm text-muted">{service.category} · {service.type} · {service.currency} {service.price}</p><p className="mt-1 text-sm text-muted">{service.schedule?.[0] ? `${service.schedule[0].day} ${service.schedule[0].startTime}-${service.schedule[0].endTime}` : "No slot published yet"}</p><div className="mt-3 flex flex-wrap gap-3"><button className="rounded-full border border-black/10 px-4 py-2 text-sm font-semibold text-accent-deep" type="button" onClick={() => handleEditService(service)}>Edit</button><button className="rounded-full border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-700" type="button" onClick={() => handleDeleteService(service._id)}>Delete</button></div></article>) : <div className="rounded-2xl border border-dashed border-black/10 bg-white px-4 py-4 text-sm text-muted">No services yet for this trainer profile. Publish one offer with a live slot so members can request it.<div className="mt-4"><button className="rounded-full border border-black/10 px-4 py-2 text-sm font-semibold text-accent-deep transition-colors hover:border-accent hover:bg-accent" onClick={openTrainerServiceModal} type="button">Create service</button></div></div>}</div></div>}
          sessionsCard={
            <div className="rounded-[1.5rem] bg-background p-5">
              <div>
                <p className="font-semibold text-accent-deep">Clients, analytics, and booking queue</p>
                <p className="mt-1 text-sm text-muted">Split clients by PT and group fitness, open one member, and review attendance, meal follow, and measurement trends before you handle the next booking.</p>
              </div>
              {ownedTrainer ? (
                <div className="mt-4 grid gap-4">
                  <div className="grid gap-4 xl:grid-cols-2">
                    <div className="rounded-2xl border border-black/8 bg-white px-4 py-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="font-semibold text-accent-deep">Personal training</p>
                          <p className="mt-1 text-sm text-muted">Members grouped by PT service.</p>
                        </div>
                        <p className="text-xs uppercase tracking-[0.16em] text-muted">{trainerClientPrograms.ptPrograms.length} programs</p>
                      </div>
                      <div className="mt-4 grid gap-3">
                        {trainerClientPrograms.ptPrograms.length > 0 ? trainerClientPrograms.ptPrograms.map((program) => (
                          <article key={program.key} className="rounded-2xl border border-black/8 bg-background px-4 py-4">
                            <div className="flex items-center justify-between gap-3">
                              <div>
                                <p className="font-semibold text-accent-deep">{program.label}</p>
                                <p className="mt-1 text-xs uppercase tracking-[0.16em] text-muted">{program.sublabel}</p>
                              </div>
                              <p className="text-xs uppercase tracking-[0.16em] text-muted">{program.members.length} clients</p>
                            </div>
                            <div className="mt-3 flex flex-wrap gap-2">
                              {program.members.map((member) => (
                                <button key={member.id} className={selectedTrainerClientId === member.id ? "rounded-full bg-accent-deep px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-white" : "rounded-full border border-black/10 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-accent-deep"} onClick={() => setSelectedTrainerClientId(member.id)} type="button">{member.name}</button>
                              ))}
                            </div>
                          </article>
                        )) : <div className={emptyStateClass}>No PT clients yet. As soon as members book coached PT offers, they will appear here under the assigned service.</div>}
                      </div>
                    </div>
                    <div className="rounded-2xl border border-black/8 bg-white px-4 py-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="font-semibold text-accent-deep">Group fitness</p>
                          <p className="mt-1 text-sm text-muted">Classes and programs grouped away from 1:1 clients.</p>
                        </div>
                        <p className="text-xs uppercase tracking-[0.16em] text-muted">{trainerClientPrograms.groupPrograms.length} programs</p>
                      </div>
                      <div className="mt-4 grid gap-3">
                        {trainerClientPrograms.groupPrograms.length > 0 ? trainerClientPrograms.groupPrograms.map((program) => (
                          <article key={program.key} className="rounded-2xl border border-black/8 bg-background px-4 py-4">
                            <div className="flex items-center justify-between gap-3">
                              <div>
                                <p className="font-semibold text-accent-deep">{program.label}</p>
                                <p className="mt-1 text-xs uppercase tracking-[0.16em] text-muted">{program.sublabel}</p>
                              </div>
                              <p className="text-xs uppercase tracking-[0.16em] text-muted">{program.members.length} clients</p>
                            </div>
                            <div className="mt-3 flex flex-wrap gap-2">
                              {program.members.map((member) => (
                                <button key={member.id} className={selectedTrainerClientId === member.id ? "rounded-full bg-accent-deep px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-white" : "rounded-full border border-black/10 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-accent-deep"} onClick={() => setSelectedTrainerClientId(member.id)} type="button">{member.name}</button>
                              ))}
                            </div>
                          </article>
                        )) : <div className={emptyStateClass}>No group-fitness clients yet. Once members join classes or cohorts linked to this trainer, they will show here.</div>}
                      </div>
                    </div>
                  </div>

                  {selectedTrainerClient ? (
                    <div className="rounded-2xl border border-black/8 bg-white px-4 py-4">
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                        <div>
                          <p className="text-xs uppercase tracking-[0.16em] text-muted">Selected client</p>
                          <h4 className="mt-2 text-2xl font-bold tracking-[-0.04em] text-accent-deep">{selectedTrainerClient.name ?? selectedTrainerClient.email ?? "Client"}</h4>
                          <p className="mt-1 text-sm text-muted">{selectedTrainerClient.email ?? "No email on file"}</p>
                        </div>
                        <div className="grid gap-2 sm:grid-cols-4">
                          <div className="rounded-2xl border border-black/8 bg-background px-4 py-3"><p className="text-[11px] uppercase tracking-[0.16em] text-muted">Attendance</p><p className="mt-2 text-lg font-semibold text-accent-deep">{selectedTrainerClientAttendance.rate}%</p></div>
                          <div className="rounded-2xl border border-black/8 bg-background px-4 py-3"><p className="text-[11px] uppercase tracking-[0.16em] text-muted">Meals followed</p><p className="mt-2 text-lg font-semibold text-accent-deep">{selectedTrainerClientMealSummary.followed}</p></div>
                          <div className="rounded-2xl border border-black/8 bg-background px-4 py-3"><p className="text-[11px] uppercase tracking-[0.16em] text-muted">Latest weight</p><p className="mt-2 text-lg font-semibold text-accent-deep">{typeof selectedMeasurementSnapshot.latest?.weightKg === "number" ? `${selectedMeasurementSnapshot.latest.weightKg.toFixed(1)} kg` : "Not logged"}</p></div>
                          <div className="rounded-2xl border border-black/8 bg-background px-4 py-3"><p className="text-[11px] uppercase tracking-[0.16em] text-muted">Latest waist</p><p className="mt-2 text-lg font-semibold text-accent-deep">{typeof selectedMeasurementSnapshot.latest?.waistCm === "number" ? `${selectedMeasurementSnapshot.latest.waistCm.toFixed(1)} cm` : "Not logged"}</p></div>
                        </div>
                      </div>

                      <div className="mt-4 grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
                        {trainerMeasurementMetrics.map((metric) => (
                          <MeasurementTrendChart
                            key={metric.title}
                            accessor={metric.accessor}
                            items={selectedTrainerClientMeasurements}
                            stroke={metric.stroke}
                            title={metric.title}
                            unit={metric.unit}
                          />
                        ))}
                      </div>

                      <div className="mt-4 grid gap-4 xl:grid-cols-2">
                        <div className={chartCardClass}>
                          <div className="flex items-center justify-between gap-3">
                            <p className="font-semibold text-accent-deep">Meal follow detail</p>
                            <p className="text-sm font-semibold text-accent-deep">{selectedTrainerClientMealSummary.adherence}% adherence</p>
                          </div>
                          <div className="mt-4 flex h-4 overflow-hidden rounded-full bg-[rgba(8,19,32,0.08)]">
                            {selectedTrainerClientMealSummary.total > 0 ? <><div className="h-full bg-[#123322]" style={{ width: `${(selectedTrainerClientMealSummary.followed / selectedTrainerClientMealSummary.total) * 100}%` }} /><div className="h-full bg-[#d7ff3f]" style={{ width: `${(selectedTrainerClientMealSummary.partial / selectedTrainerClientMealSummary.total) * 100}%` }} /><div className="h-full bg-[#ff6a2c]" style={{ width: `${(selectedTrainerClientMealSummary.missed / selectedTrainerClientMealSummary.total) * 100}%` }} /></> : null}
                          </div>
                          <div className="mt-3 grid gap-2 sm:grid-cols-3 text-sm text-muted"><p>Followed: {selectedTrainerClientMealSummary.followed}</p><p>Partial: {selectedTrainerClientMealSummary.partial}</p><p>Missed: {selectedTrainerClientMealSummary.missed}</p></div>
                        </div>
                        <div className={chartCardClass}>
                          <div className="flex items-center justify-between gap-3">
                            <p className="font-semibold text-accent-deep">Attendance progress</p>
                            <p className="text-sm font-semibold text-accent-deep">{selectedTrainerClientAttendance.attended} attended</p>
                          </div>
                          <div className="mt-4 flex h-4 overflow-hidden rounded-full bg-[rgba(8,19,32,0.08)]">
                            {selectedTrainerClientAttendance.completed > 0 ? <><div className="h-full bg-[#123322]" style={{ width: `${(selectedTrainerClientAttendance.attended / selectedTrainerClientAttendance.completed) * 100}%` }} /><div className="h-full bg-[#ff6a2c]" style={{ width: `${(selectedTrainerClientAttendance.missed / selectedTrainerClientAttendance.completed) * 100}%` }} /><div className="h-full bg-[#7699ff]" style={{ width: `${(selectedTrainerClientAttendance.excused / selectedTrainerClientAttendance.completed) * 100}%` }} /></> : null}
                          </div>
                          <div className="mt-3 grid gap-2 sm:grid-cols-3 text-sm text-muted"><p>Attended: {selectedTrainerClientAttendance.attended}</p><p>Missed: {selectedTrainerClientAttendance.missed}</p><p>Excused: {selectedTrainerClientAttendance.excused}</p></div>
                        </div>
                      </div>

                      <div className="mt-4 grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
                        <div className={chartCardClass}>
                          <p className="font-semibold text-accent-deep">Coach suggestions</p>
                          <div className="mt-3 grid gap-2">
                            {trainerClientSuggestions.map((suggestion) => <p key={suggestion} className="rounded-2xl border border-black/8 bg-background px-4 py-3 text-sm text-muted">{suggestion}</p>)}
                          </div>
                          {selectedMeasurementSnapshot.latest?.note ? <div className="mt-4 rounded-2xl border border-black/8 bg-background px-4 py-4"><p className="text-xs uppercase tracking-[0.16em] text-muted">Latest measurement note</p><p className="mt-2 text-sm text-muted">{selectedMeasurementSnapshot.latest.note}</p></div> : null}
                        </div>
                        <div className={chartCardClass}>
                          <div className="flex items-center justify-between gap-3">
                            <p className="font-semibold text-accent-deep">Body measurements</p>
                            <p className="text-xs uppercase tracking-[0.16em] text-muted">Trainer update</p>
                          </div>
                          <p className="mt-3 text-sm text-muted">Measurement entry form is now hidden from this page. Use the modal to add a new check-in for the selected day.</p>
                          <div className="mt-4 flex flex-wrap gap-3">
                            <button
                              className={primaryButtonClass}
                              onClick={() => setIsTrainerMeasurementModalOpen(true)}
                              type="button"
                            >
                              Add measurement
                            </button>
                            <button
                              className={secondaryButtonClass}
                              onClick={() => setTrainerMeasurementDraft({ ...emptyTrainerMeasurementDraft, measuredAt: new Date().toISOString().slice(0, 10) })}
                              type="button"
                            >
                              Reset draft
                            </button>
                          </div>
                          <div className="mt-4 grid gap-2">
                            {selectedTrainerClientMeasurements.slice(0, 4).map((entry) => (
                              <div key={entry._id} className="rounded-2xl border border-black/8 bg-background px-4 py-3 text-sm text-muted">
                                <p className="font-semibold text-accent-deep">{entry.measuredAt}</p>
                                <p className="mt-1">
                                  {typeof entry.weightKg === "number" ? `${entry.weightKg.toFixed(1)} kg` : "-"}
                                  {" · "}
                                  {typeof entry.waistCm === "number" ? `${entry.waistCm.toFixed(1)} cm waist` : "waist -"}
                                  {" · "}
                                  {typeof entry.bodyFatPercent === "number" ? `${entry.bodyFatPercent.toFixed(1)}% fat` : "fat -"}
                                </p>
                              </div>
                            ))}
                            {selectedTrainerClientMeasurements.length === 0 ? <p className="text-sm text-muted">No measurements logged yet for this client.</p> : null}
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : <div className={emptyStateClass}>Select a client from PT or group fitness to open detailed progress analytics.</div>}
                </div>
              ) : null}
              <div className="mt-4 grid gap-3">
                {ownedTrainer ? (trainerBookings.length > 0 ? trainerBookings.slice(0, 6).map((booking) => (
                  <article key={booking._id} className="rounded-2xl border border-black/8 p-4">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="font-semibold text-accent-deep">{booking.serviceId?.title ?? "Service"}</p>
                        <p className="mt-1 text-sm text-muted">{booking.userId?.name ?? booking.userId?.email ?? "Member"}</p>
                        <p className="mt-1 text-sm text-muted">{new Date(booking.bookingDate).toLocaleDateString()} · {booking.timeSlot}</p>
                        {booking.sessionMode && booking.sessionLocation ? <p className="mt-1 text-sm text-muted">Setup: {getDeliveryModeLabel(booking.sessionMode)} at {booking.sessionLocation}</p> : null}
                        {booking.notes ? <p className="mt-2 text-sm text-muted">Notes: {booking.notes}</p> : null}
                        {booking.userId?._id && trainerClientInsights[booking.userId._id] ? <p className="mt-2 text-xs text-muted">Client progress: meals followed {trainerClientInsights[booking.userId._id].mealsFollowed}, partial {trainerClientInsights[booking.userId._id].mealsPartial}, missed {trainerClientInsights[booking.userId._id].mealsMissed} · missed sessions {trainerClientInsights[booking.userId._id].missedSessions} · reschedule threads {trainerClientInsights[booking.userId._id].rescheduleRequests}</p> : null}
                      </div>
                      <div className="text-right">
                        <p className="text-xs uppercase tracking-[0.18em] text-accent">{booking.status}</p>
                        <p className="mt-1 text-xs uppercase tracking-[0.18em] text-muted">{booking.paymentStatus?.replaceAll("_", " ") ?? "not due"}</p>
                        <p className="mt-1 text-xs uppercase tracking-[0.18em] text-muted">attendance: {booking.attendanceStatus ?? "pending"}</p>
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-3">
                      {booking.status === "requested" ? <button className="rounded-full border border-black/10 px-4 py-2 text-sm font-semibold text-accent-deep" type="button" onClick={() => handleTrainerBookingStatus(booking._id, "accepted")}>Accept request</button> : null}
                      {booking.status === "accepted" ? <button className="rounded-full border border-black/10 px-4 py-2 text-sm font-semibold text-accent-deep" type="button" onClick={() => handleTrainerBookingStatus(booking._id, "completed")}>Mark completed</button> : null}
                      <button className="rounded-full border border-black/10 px-4 py-2 text-sm font-semibold text-accent-deep" type="button" onClick={() => handleStartTrainerBookingEdit(booking)}>Suggest new time</button>
                      {booking.rescheduleStatus === "requested_by_client" || booking.rescheduleStatus === "counter_proposed_by_client" ? <button className="rounded-full border border-black/10 px-4 py-2 text-sm font-semibold text-accent-deep" type="button" onClick={() => handleTrainerRescheduleAction(booking, "approve")}>Approve request</button> : null}
                      <button className="rounded-full border border-black/10 px-4 py-2 text-sm font-semibold text-accent-deep" type="button" onClick={() => handleMarkAttendance(booking._id, "attended")}>Attended</button>
                      <button className="rounded-full border border-black/10 px-4 py-2 text-sm font-semibold text-accent-deep" type="button" onClick={() => handleMarkAttendance(booking._id, "missed")}>Missed</button>
                      <button className="rounded-full border border-black/10 px-4 py-2 text-sm font-semibold text-accent-deep" type="button" onClick={() => handleMarkAttendance(booking._id, "excused")}>Excused</button>
                      <button className="rounded-full border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-700" type="button" onClick={() => handleTrainerBookingStatus(booking._id, "cancelled")}>Decline / cancel</button>
                    </div>
                    {trainerBookingDraft?.bookingId === booking._id ? (
                      <div className="mt-4 grid gap-3 rounded-2xl bg-background px-4 py-4">
                        <p className="text-xs uppercase tracking-[0.18em] text-muted">Offer up to 3 replacement slots</p>
                        <div className="grid gap-3">
                          {trainerBookingDraft.slotOptions.map((slot, index) => (
                            <div key={`${booking._id}-slot-${index}`} className="grid gap-3 sm:grid-cols-2">
                              <input className="rounded-2xl border border-black/10 bg-white px-4 py-3 outline-none" type="date" value={slot.bookingDate} onChange={(event) => setTrainerBookingDraft((current) => current ? { ...current, slotOptions: current.slotOptions.map((currentSlot, slotIndex) => slotIndex === index ? { ...currentSlot, bookingDate: event.target.value } : currentSlot) } : current)} />
                              <input className="rounded-2xl border border-black/10 bg-white px-4 py-3 outline-none" placeholder={`Time slot option ${index + 1}`} value={slot.timeSlot} onChange={(event) => setTrainerBookingDraft((current) => current ? { ...current, slotOptions: current.slotOptions.map((currentSlot, slotIndex) => slotIndex === index ? { ...currentSlot, timeSlot: event.target.value } : currentSlot) } : current)} />
                            </div>
                          ))}
                        </div>
                        <textarea className="min-h-24 rounded-2xl border border-black/10 bg-white px-4 py-3 outline-none" placeholder="Session notes" value={trainerBookingDraft.notes} onChange={(event) => setTrainerBookingDraft((current) => current ? { ...current, notes: event.target.value } : current)} />
                        <div className="flex flex-wrap gap-3">
                          <button className="rounded-full bg-accent-deep px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#204938]" type="button" onClick={() => handleSaveTrainerBookingEdit(booking._id)}>Send suggestion</button>
                          <button className="rounded-full border border-black/10 px-5 py-3 text-sm font-semibold text-accent-deep" type="button" onClick={handleCancelTrainerBookingEdit}>Cancel edit</button>
                        </div>
                      </div>
                    ) : null}
                  </article>
                )) : <p className="text-sm text-muted">No booking requests currently assigned to this trainer profile.</p>) : <p className="text-sm text-muted">Trainer tools appear once your trainer profile is active.</p>}
              </div>
            </div>
          }
        /> : null}
        {showShopWorkspaceSection ? <ShopWorkspaceSection
          shopCard={shopCard}
          productCard={shopProductCard}
          venueOfferCard={venueOfferCard}
          requestsCard={<div className="rounded-[1.5rem] bg-background p-5"><div><p className="font-semibold text-accent-deep">Venue requests</p><p className="mt-1 text-sm text-muted">Accept gym access, class, event, and group-hosted requests from one queue.</p></div><div className="mt-4 grid gap-3">{shopBookings.length > 0 ? shopBookings.slice(0, 8).map((booking) => <article key={booking._id} className="rounded-2xl border border-black/8 p-4"><div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between"><div><p className="font-semibold text-accent-deep">{booking.serviceId?.title ?? "Venue booking"}</p><p className="mt-1 text-sm text-muted">{booking.userId?.name ?? booking.userId?.email ?? "Member"}</p><p className="mt-1 text-sm text-muted">{new Date(booking.bookingDate).toLocaleDateString()} · {booking.timeSlot}</p>{booking.accessEndDate ? <p className="mt-1 text-sm text-muted">Access window: {new Date(booking.accessStartDate ?? booking.bookingDate).toLocaleDateString()} - {new Date(booking.accessEndDate).toLocaleDateString()}</p> : null}</div><div className="text-right"><p className="text-xs uppercase tracking-[0.18em] text-accent">{booking.status}</p><p className="mt-1 text-xs uppercase tracking-[0.18em] text-muted">{booking.paymentStatus?.replaceAll("_", " ") ?? "not due"}</p><p className="mt-1 text-xs uppercase tracking-[0.18em] text-muted">attendance: {booking.attendanceStatus ?? "pending"}</p></div></div><div className="mt-3 flex flex-wrap gap-3">{booking.status === "requested" ? <button className="rounded-full border border-black/10 px-4 py-2 text-sm font-semibold text-accent-deep" type="button" onClick={() => handleShopBookingStatus(booking._id, "accepted")}>Accept request</button> : null}{booking.status === "accepted" ? <button className="rounded-full border border-black/10 px-4 py-2 text-sm font-semibold text-accent-deep" type="button" onClick={() => handleShopBookingStatus(booking._id, "completed")}>Mark completed</button> : null}<button className="rounded-full border border-black/10 px-4 py-2 text-sm font-semibold text-accent-deep" type="button" onClick={() => handleMarkAttendance(booking._id, "attended")}>Attended</button><button className="rounded-full border border-black/10 px-4 py-2 text-sm font-semibold text-accent-deep" type="button" onClick={() => handleMarkAttendance(booking._id, "missed")}>Missed</button><button className="rounded-full border border-black/10 px-4 py-2 text-sm font-semibold text-accent-deep" type="button" onClick={() => handleMarkAttendance(booking._id, "excused")}>Excused</button><button className="rounded-full border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-700" type="button" onClick={() => handleShopBookingStatus(booking._id, "cancelled")}>Decline / cancel</button></div></article>) : <div className="rounded-2xl border border-dashed border-black/10 bg-white px-4 py-4 text-sm text-muted">No venue requests yet. As soon as members request passes, classes, or events, they will appear here for approval.</div>}</div></div>}
          productsCard={<div className="rounded-[1.5rem] bg-background p-5"><div><p className="font-semibold text-accent-deep">My products</p><p className="mt-1 text-sm text-muted">Keep your visible inventory current and tidy.</p></div><div className="mt-4 grid gap-3">{products.length > 0 ? products.map((product) => <article key={product._id} className="rounded-2xl border border-black/8 p-4"><p className="font-semibold text-accent-deep">{product.name}</p><p className="mt-1 text-sm text-muted">{product.currency} {product.price}</p><p className="mt-2 text-xs uppercase tracking-[0.18em] text-accent">{product.availability ? "available" : "hidden"}</p><div className="mt-3 flex flex-wrap gap-3"><button className="rounded-full border border-black/10 px-4 py-2 text-sm font-semibold text-accent-deep" type="button" onClick={() => handleEditProduct(product)}>Edit</button><button className="rounded-full border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-700" type="button" onClick={() => handleDeleteProduct(product._id)}>Delete</button></div></article>) : <div className="rounded-2xl border border-dashed border-black/10 bg-white px-4 py-4 text-sm text-muted">No products yet for this shop. Add one product so your storefront does more than act as a venue profile.<div className="mt-4"><button className="rounded-full border border-black/10 px-4 py-2 text-sm font-semibold text-accent-deep transition-colors hover:border-accent hover:bg-accent" onClick={openShopProductModal} type="button">Add product</button></div></div>}</div></div>}
          venueOffersCard={<div className="rounded-[1.5rem] bg-background p-5"><div><p className="font-semibold text-accent-deep">Published venue offers</p><p className="mt-1 text-sm text-muted">Review memberships, day passes, classes, PT slots, and events currently attached to your venue.</p></div><div className="mt-4 grid gap-3">{ownedShopVenueServices.length > 0 ? ownedShopVenueServices.map((service) => <article key={service._id} className="rounded-2xl border border-black/8 p-4"><p className="font-semibold text-accent-deep">{service.title}</p><p className="mt-1 text-sm text-muted">{service.category} · {service.type} · {service.currency} {service.price}</p><p className="mt-1 text-sm text-muted">{service.schedule?.[0] ? `${service.schedule[0].day} ${service.schedule[0].startTime}-${service.schedule[0].endTime}` : "No slot published yet"}</p><div className="mt-2 flex flex-wrap gap-2">{getBookableDeliveryOptions(service).map((option) => <span key={`${service._id}-${option.mode}-${option.label}`} className={discoverChipClass}>{getDeliveryModeLabel(option.mode)}: {option.label}</span>)}</div><div className="mt-3 flex flex-wrap gap-3"><button className="rounded-full border border-black/10 px-4 py-2 text-sm font-semibold text-accent-deep" type="button" onClick={() => handleEditService(service)}>Edit</button><button className="rounded-full border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-700" type="button" onClick={() => handleDeleteService(service._id)}>Delete</button></div></article>) : <div className="rounded-2xl border border-dashed border-black/10 bg-white px-4 py-4 text-sm text-muted">No venue offers yet for this shop. Publish a pass, membership, class, or event so members can actually request access.<div className="mt-4"><button className="rounded-full border border-black/10 px-4 py-2 text-sm font-semibold text-accent-deep transition-colors hover:border-accent hover:bg-accent" onClick={openVenueOfferModal} type="button">Publish venue offer</button></div></div>}</div></div>}
        /> : null}
      </div></> : <><div className="mt-6 grid gap-4 lg:grid-cols-3"><article className="rounded-[1.5rem] border border-black/6 bg-background px-5 py-4"><p className="text-xs uppercase tracking-[0.18em] text-muted">Upcoming sessions</p><p className="mt-3 text-xl font-bold tracking-[-0.03em] text-accent-deep">{upcomingMemberBookings.length.toString().padStart(2, "0")}</p></article><article className="rounded-[1.5rem] border border-black/6 bg-background px-5 py-4"><p className="text-xs uppercase tracking-[0.18em] text-muted">Reschedule requests</p><p className="mt-3 text-xl font-bold tracking-[-0.03em] text-accent-deep">{memberAttendanceSummary.rescheduleRequests.toString().padStart(2, "0")}</p></article><article className="rounded-[1.5rem] border border-black/6 bg-background px-5 py-4"><p className="text-xs uppercase tracking-[0.18em] text-muted">Measurements logged</p><p className="mt-3 text-xl font-bold tracking-[-0.03em] text-accent-deep">{bodyMeasurements.length.toString().padStart(2, "0")}</p></article></div>{selectedMemberBooking ? <button className="mt-6 w-full rounded-[1.6rem] bg-accent-deep px-6 py-6 text-left text-surface shadow-[0_18px_44px_rgba(8,19,32,0.24)]" onClick={() => {
      setSelectedMemberBookingId(selectedMemberBooking._id);
      document.getElementById("member-bookings-details")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }} type="button"><p className="text-sm uppercase tracking-[0.18em] text-surface/70">Member tools</p><div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between"><div><h3 className="text-2xl font-bold tracking-[-0.04em]">Next class / session: {selectedMemberBooking.serviceId?.title ?? "Session"}</h3><p className="mt-2 max-w-3xl text-sm leading-7 text-surface/78">{formatBookingDateTime(selectedMemberBooking)} · Click to open the details section where you can request changes and cancellation.</p></div><span className="rounded-full bg-white px-5 py-3 text-sm font-semibold uppercase tracking-[0.12em] text-accent-deep">Open details</span></div></button> : null}<div className="mt-6 grid gap-4 lg:grid-cols-2 xl:grid-cols-4"><article className="rounded-[1.5rem] border border-black/6 bg-background px-5 py-5"><p className="text-sm font-semibold uppercase tracking-[0.18em]">Member tools</p><p className="mt-3 text-sm leading-7 opacity-80">Session details, change requests, cancellation requests, and measurement records in one flow.</p></article></div><div className="mt-8"><MemberWorkspaceSection
        profileCard={memberProfileCard}
        bookingCard={memberBookingCard}
        bookingsCard={memberBookingsCard}
      /></div></>}
    </section>
  );

  const adminSection = (
    <AdminSection
      currentUser={currentUser}
      adminDashboard={adminDashboard}
      onAdminBookingStatus={handleAdminBookingStatus}
      onVerifyShop={handleVerifyShop}
      onAdminUserActive={handleAdminUserActive}
      onAdminTrainerActive={handleAdminTrainerActive}
    />
  );

  const homeContent = !currentUser
    ? landingSection
    : manageSection;

  const sections = {
    home: homeContent,
    auth: currentUser ? authSection : landingSection,
    discover: discoverSection,
    manage: manageSection,
    admin: adminSection,
  };

  return (
    <main className="min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(215,255,63,0.16),_transparent_24%),radial-gradient(circle_at_top_right,_rgba(255,106,44,0.16),_transparent_26%),linear-gradient(180deg,_#07111b_0%,_#0c1724_48%,_#122032_100%)] px-4 py-6 text-foreground sm:px-8 lg:px-12">
      <div className="mx-auto flex w-full max-w-[1680px] flex-col gap-8">
        {header}
        {notice}
        {section === "home" && canToggleHomeRole ? (
          <section className="rounded-[1.4rem] border border-black/10 bg-white/88 px-4 py-4 shadow-[0_8px_18px_rgba(8,19,32,0.05)]">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Role view on Home</p>
              <div className="flex gap-2">
                <button
                  className={`rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] ${homeRoleView === "trainer" ? "border-accent bg-accent text-accent-deep" : "border-black/10 bg-white text-accent-deep"}`}
                  onClick={() => setHomeRoleView("trainer")}
                  type="button"
                >
                  Trainer workspace
                </button>
                <button
                  className={`rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] ${homeRoleView === "member" ? "border-accent bg-accent text-accent-deep" : "border-black/10 bg-white text-accent-deep"}`}
                  onClick={() => setHomeRoleView("member")}
                  type="button"
                >
                  Member dashboard
                </button>
              </div>
            </div>
          </section>
        ) : null}
        {sections[section]}
      </div>
      <WorkspaceModal description={authModalView === "login" ? "Login to open your member, trainer, venue, or admin workspace." : "Create your account with the required medical details in one focused form."} isOpen={isAuthModalOpen} onClose={() => {
        setIsAuthModalOpen(false);
        setAuthModalView("login");
      }} title={authModalView === "login" ? "Login" : "Create your Fithub account"}>
        {authModalView === "login" ? <form className="grid gap-5" id="sign-in-modal" onSubmit={handleLogin}>
          <label className="grid gap-2"><span className={fieldLabelClass}>Email</span><input className={formFieldClass} type="email" required value={loginForm.email} onChange={(event) => setLoginForm((current) => ({ ...current, email: event.target.value }))} /></label>
          <label className="grid gap-2"><span className={fieldLabelClass}>Password</span><input className={formFieldClass} type="password" required minLength={8} value={loginForm.password} onChange={(event) => setLoginForm((current) => ({ ...current, password: event.target.value }))} /></label>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <button className={primaryButtonClass} disabled={isWorking || isPending} type="submit">{isWorking || isPending ? "Logging in..." : "Login"}</button>
            <button className={secondaryButtonClass} onClick={() => openAuthModal("register")} type="button">Create user</button>
          </div>
          <button className="text-sm text-muted underline-offset-4 transition-colors hover:text-accent-deep hover:underline" onClick={() => setFeedback("Reset password is not available yet. Contact support or an admin to recover access.")} type="button">Forget password? Reset password</button>
        </form> : <form className="grid gap-6" id="create-account-modal" onSubmit={handleRegister}>
          <section className="grid gap-4 rounded-[1.5rem] border border-black/6 bg-white/86 p-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">Account basics</p>
              <p className="mt-2 text-sm text-muted">Start with the contact details tied to your account.</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="grid gap-2"><span className={fieldLabelClass}>Full name</span><input className={formFieldClass} required minLength={2} value={registerForm.name} onChange={(event) => setRegisterForm((current) => ({ ...current, name: event.target.value }))} /></label>
              <label className="grid gap-2"><span className={fieldLabelClass}>Email</span><input className={formFieldClass} type="email" required value={registerForm.email} onChange={(event) => setRegisterForm((current) => ({ ...current, email: event.target.value }))} /></label>
              <label className="grid gap-2"><span className={fieldLabelClass}>Password</span><input className={formFieldClass} type="password" required minLength={8} value={registerForm.password} onChange={(event) => setRegisterForm((current) => ({ ...current, password: event.target.value }))} /></label>
              <label className="grid gap-2"><span className={fieldLabelClass}>Phone</span><input className={formFieldClass} inputMode="tel" value={registerForm.phone} onChange={(event) => setRegisterForm((current) => ({ ...current, phone: event.target.value }))} /></label>
              <label className="grid gap-2 sm:col-span-2"><span className={fieldLabelClass}>Date of birth</span><input className={formFieldClass} type="date" required value={registerForm.dateOfBirth} onChange={(event) => setRegisterForm((current) => ({ ...current, dateOfBirth: event.target.value }))} /></label>
            </div>
          </section>
          <section className="grid gap-4 rounded-[1.5rem] border border-accent/20 bg-[linear-gradient(180deg,_rgba(215,255,63,0.12),_rgba(255,255,255,0.72))] p-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent-deep">Medical form</p>
              <p className="mt-2 text-sm leading-7 text-muted">Complete these details before registration. If a field does not apply, write “None”.</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="grid gap-2"><span className={fieldLabelClass}>Emergency contact name</span><input className={formFieldClass} required value={registerForm.emergencyContactName} onChange={(event) => setRegisterForm((current) => ({ ...current, emergencyContactName: event.target.value }))} /></label>
              <label className="grid gap-2"><span className={fieldLabelClass}>Emergency contact phone</span><input className={formFieldClass} required inputMode="tel" value={registerForm.emergencyContactPhone} onChange={(event) => setRegisterForm((current) => ({ ...current, emergencyContactPhone: event.target.value }))} /></label>
            </div>
            <div className="grid gap-4 lg:grid-cols-2">
              <label className="grid gap-2"><span className={fieldLabelClass}>Allergies</span><textarea className={formTextareaClass} required value={registerForm.allergies} onChange={(event) => setRegisterForm((current) => ({ ...current, allergies: event.target.value }))} /></label>
              <label className="grid gap-2"><span className={fieldLabelClass}>Medical conditions</span><textarea className={formTextareaClass} required value={registerForm.medicalConditions} onChange={(event) => setRegisterForm((current) => ({ ...current, medicalConditions: event.target.value }))} /></label>
              <label className="grid gap-2"><span className={fieldLabelClass}>Current medications</span><textarea className={formTextareaClass} required value={registerForm.medications} onChange={(event) => setRegisterForm((current) => ({ ...current, medications: event.target.value }))} /></label>
              <label className="grid gap-2"><span className={fieldLabelClass}>Additional notes</span><textarea className={formTextareaClass} value={registerForm.medicalNotes} onChange={(event) => setRegisterForm((current) => ({ ...current, medicalNotes: event.target.value }))} /></label>
            </div>
          </section>
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-[1.5rem] border border-black/6 bg-white/88 px-5 py-4">
            <p className="max-w-xl text-sm leading-7 text-muted">Once registered, your account opens the member workspace immediately and keeps your personal details ready for bookings.</p>
            <div className="flex flex-wrap gap-3">
              <button className={primaryButtonClass} disabled={isWorking || isPending} type="submit">{isWorking || isPending ? "Creating user..." : "Create user"}</button>
              <button className={secondaryButtonClass} onClick={() => openAuthModal("login")} type="button">Back to login</button>
            </div>
          </div>
        </form>}
      </WorkspaceModal>
      <WorkspaceModal description="Search your next move, then jump directly into the right page or workflow." isOpen={isQuickActionsOpen} onClose={() => {
        setIsQuickActionsOpen(false);
        setQuickActionQuery("");
      }} title="Quick actions"><div className="grid gap-4"><div className="rounded-[1.5rem] border border-black/8 bg-white px-4 py-4"><label className="grid gap-2"><span className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">Search actions</span><input ref={quickActionInputRef} className={formFieldClass} placeholder="Open profile, browse gyms, publish service" value={quickActionQuery} onChange={(event) => setQuickActionQuery(event.target.value)} /></label><div className="mt-3 flex flex-wrap gap-2"><span className="rounded-full border border-black/10 bg-background px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-accent-deep">Ctrl/Cmd + K</span><span className="rounded-full border border-black/10 bg-background px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-accent-deep">Enter runs top result</span></div></div>{quickActionQuery.trim().length === 0 ? <div className="rounded-[1.5rem] border border-black/8 bg-white px-4 py-4"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">Recommended for your role</p><div className="mt-3 grid gap-3">{recommendedQuickActions.map((action) => <button key={`recommended-${action.id}`} className="rounded-[1.2rem] border border-black/8 bg-background px-4 py-3 text-left transition-colors hover:border-accent hover:bg-[rgba(215,255,63,0.14)]" onClick={() => runQuickAction(action)} type="button"><p className="font-semibold text-accent-deep">{action.title}</p><p className="mt-1 text-sm text-muted">{action.description}</p></button>)}</div></div> : null}<div className="grid gap-3">{visibleQuickActions.length > 0 ? visibleQuickActions.map((action, index) => <button key={action.id} className={index === 0 ? "rounded-[1.4rem] border border-accent/60 bg-[rgba(215,255,63,0.14)] px-4 py-4 text-left transition-colors hover:border-accent hover:bg-[rgba(215,255,63,0.2)]" : "rounded-[1.4rem] border border-black/8 bg-white px-4 py-4 text-left transition-colors hover:border-accent hover:bg-[rgba(215,255,63,0.14)]"} onClick={() => runQuickAction(action)} type="button"><p className="font-semibold text-accent-deep">{action.title}</p><p className="mt-2 text-sm leading-7 text-muted">{action.description}</p></button>) : <div className="rounded-[1.4rem] border border-dashed border-black/10 bg-white px-4 py-4 text-sm text-muted">No matching action yet. Try searching for trainers, gyms, profile, workspace, or admin.</div>}</div></div></WorkspaceModal>

      <WorkspaceModal
        description="Select measured day and enter your latest body measurement values."
        isOpen={isMemberMeasurementModalOpen}
        onClose={() => setIsMemberMeasurementModalOpen(false)}
        title="Log body measurements"
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="grid gap-2 sm:col-span-2">
            <span className={fieldLabelClass}>Measured day</span>
            <input className={formFieldClass} required type="date" value={memberMeasurementDraft.measuredAt} onChange={(event) => setMemberMeasurementDraft((current) => ({ ...current, measuredAt: event.target.value }))} />
          </label>
          <input className={formFieldClass} placeholder="Weight kg" value={memberMeasurementDraft.weightKg} onChange={(event) => setMemberMeasurementDraft((current) => ({ ...current, weightKg: event.target.value }))} />
          <input className={formFieldClass} placeholder="Body fat %" value={memberMeasurementDraft.bodyFatPercent} onChange={(event) => setMemberMeasurementDraft((current) => ({ ...current, bodyFatPercent: event.target.value }))} />
          <input className={formFieldClass} placeholder="Chest cm" value={memberMeasurementDraft.chestCm} onChange={(event) => setMemberMeasurementDraft((current) => ({ ...current, chestCm: event.target.value }))} />
          <input className={formFieldClass} placeholder="Waist cm" value={memberMeasurementDraft.waistCm} onChange={(event) => setMemberMeasurementDraft((current) => ({ ...current, waistCm: event.target.value }))} />
          <input className={formFieldClass} placeholder="Hips cm" value={memberMeasurementDraft.hipsCm} onChange={(event) => setMemberMeasurementDraft((current) => ({ ...current, hipsCm: event.target.value }))} />
          <input className={formFieldClass} placeholder="Thigh cm" value={memberMeasurementDraft.thighCm} onChange={(event) => setMemberMeasurementDraft((current) => ({ ...current, thighCm: event.target.value }))} />
          <input className={formFieldClass} placeholder="Arm cm" value={memberMeasurementDraft.armCm} onChange={(event) => setMemberMeasurementDraft((current) => ({ ...current, armCm: event.target.value }))} />
          <textarea className={`${formTextareaClass} sm:col-span-2`} placeholder="Short note (optional)" value={memberMeasurementDraft.note} onChange={(event) => setMemberMeasurementDraft((current) => ({ ...current, note: event.target.value }))} />
        </div>
        <div className="mt-5 flex flex-wrap gap-3">
          <button className={primaryButtonClass} type="button" onClick={handleSaveMemberMeasurement}>Save measurements</button>
          <button className={secondaryButtonClass} type="button" onClick={() => setMemberMeasurementDraft({ ...emptyTrainerMeasurementDraft, measuredAt: new Date().toISOString().slice(0, 10) })}>Reset</button>
          <button className={secondaryButtonClass} type="button" onClick={() => setIsMemberMeasurementModalOpen(false)}>Close</button>
        </div>
      </WorkspaceModal>

      <WorkspaceModal
        description="Select the measured day and enter any values you collected for this client."
        isOpen={isTrainerMeasurementModalOpen}
        onClose={() => setIsTrainerMeasurementModalOpen(false)}
        title={`Log body measurements${selectedTrainerClient ? ` · ${selectedTrainerClient.name ?? selectedTrainerClient.email ?? "Client"}` : ""}`}
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="grid gap-2 sm:col-span-2">
            <span className={fieldLabelClass}>Measured day</span>
            <input
              className={formFieldClass}
              required
              type="date"
              value={trainerMeasurementDraft.measuredAt}
              onChange={(event) => setTrainerMeasurementDraft((current) => ({ ...current, measuredAt: event.target.value }))}
            />
          </label>
          <input className={formFieldClass} placeholder="Weight kg" value={trainerMeasurementDraft.weightKg} onChange={(event) => setTrainerMeasurementDraft((current) => ({ ...current, weightKg: event.target.value }))} />
          <input className={formFieldClass} placeholder="Body fat %" value={trainerMeasurementDraft.bodyFatPercent} onChange={(event) => setTrainerMeasurementDraft((current) => ({ ...current, bodyFatPercent: event.target.value }))} />
          <input className={formFieldClass} placeholder="Chest cm" value={trainerMeasurementDraft.chestCm} onChange={(event) => setTrainerMeasurementDraft((current) => ({ ...current, chestCm: event.target.value }))} />
          <input className={formFieldClass} placeholder="Waist cm" value={trainerMeasurementDraft.waistCm} onChange={(event) => setTrainerMeasurementDraft((current) => ({ ...current, waistCm: event.target.value }))} />
          <input className={formFieldClass} placeholder="Hips cm" value={trainerMeasurementDraft.hipsCm} onChange={(event) => setTrainerMeasurementDraft((current) => ({ ...current, hipsCm: event.target.value }))} />
          <input className={formFieldClass} placeholder="Thigh cm" value={trainerMeasurementDraft.thighCm} onChange={(event) => setTrainerMeasurementDraft((current) => ({ ...current, thighCm: event.target.value }))} />
          <input className={formFieldClass} placeholder="Arm cm" value={trainerMeasurementDraft.armCm} onChange={(event) => setTrainerMeasurementDraft((current) => ({ ...current, armCm: event.target.value }))} />
          <textarea className={`${formTextareaClass} sm:col-span-2`} placeholder="Short note about progress, context, or measurement conditions" value={trainerMeasurementDraft.note} onChange={(event) => setTrainerMeasurementDraft((current) => ({ ...current, note: event.target.value }))} />
        </div>
        <div className="mt-5 flex flex-wrap gap-3">
          <button className={primaryButtonClass} type="button" onClick={handleSaveTrainerMeasurement}>Save measurements</button>
          <button className={secondaryButtonClass} type="button" onClick={() => setTrainerMeasurementDraft({ ...emptyTrainerMeasurementDraft, measuredAt: new Date().toISOString().slice(0, 10) })}>Reset</button>
          <button className={secondaryButtonClass} type="button" onClick={() => setIsTrainerMeasurementModalOpen(false)}>Close</button>
        </div>
      </WorkspaceModal>

      {ratingModal ? (
        <div className="fixed inset-0 z-[140] flex items-center justify-center bg-[rgba(7,17,27,0.82)] px-4 py-8 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-[2rem] border border-white/10 bg-white/96 p-8 shadow-[0_28px_70px_rgba(3,10,18,0.3)] backdrop-blur-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-muted">Rate</p>
                <h3 className="mt-2 text-2xl font-bold tracking-[-0.03em] text-accent-deep">{ratingModal.targetLabel}</h3>
                <p className="mt-2 text-sm text-muted">Your rating is anonymous and cannot be changed once submitted.</p>
              </div>
              <button className="shrink-0 rounded-full border border-black/10 bg-background px-4 py-2 text-sm font-semibold text-accent-deep hover:border-accent hover:bg-accent" onClick={() => setRatingModal(null)} type="button">✕</button>
            </div>
            <div className="mt-6">
              <p className="text-sm font-semibold text-accent-deep">Score</p>
              <div className="mt-3 flex gap-3">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    className={`h-12 w-12 rounded-[1rem] border-2 text-xl transition-all ${
                      ratingForm.score >= star
                        ? "border-accent bg-accent text-accent-deep shadow-[0_6px_16px_rgba(215,255,63,0.4)]"
                        : "border-black/10 bg-white text-muted hover:border-accent/60"
                    }`}
                    onClick={() => setRatingForm((current) => ({ ...current, score: star }))}
                    type="button"
                    aria-label={`${star} star${star === 1 ? "" : "s"}`}
                  >
                    ★
                  </button>
                ))}
              </div>
              {ratingForm.score > 0 ? (
                <p className="mt-2 text-sm text-muted">
                  {["", "Poor", "Fair", "Good", "Very good", "Excellent"][ratingForm.score]}
                </p>
              ) : null}
            </div>
            <div className="mt-5">
              <label className="grid gap-2">
                <span className="text-sm font-semibold text-accent-deep">Comment <span className="font-normal text-muted">(optional)</span></span>
                <textarea
                  className="min-h-[96px] rounded-[1.2rem] border border-black/10 bg-white px-4 py-3 text-sm text-accent-deep outline-none focus:border-accent/60 focus:ring-0 resize-none"
                  maxLength={400}
                  placeholder="Share your experience…"
                  value={ratingForm.comment}
                  onChange={(e) => setRatingForm((current) => ({ ...current, comment: e.target.value }))}
                />
              </label>
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                className="rounded-full bg-accent-deep px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#204938] disabled:cursor-not-allowed disabled:opacity-60"
                disabled={ratingSubmitting || ratingForm.score < 1}
                onClick={handleSubmitRating}
                type="button"
              >
                {ratingSubmitting ? "Submitting…" : "Submit rating"}
              </button>
              <button className="rounded-full border border-black/10 bg-white px-5 py-3 text-sm font-semibold text-accent-deep hover:border-accent hover:bg-accent" onClick={() => setRatingModal(null)} type="button">Cancel</button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
