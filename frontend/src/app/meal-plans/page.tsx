"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import { ReturnToPreviousButton } from "@/components/app/ReturnToPreviousButton";
import { SiteHeader } from "@/components/app/SiteHeader";
import { ApiError, apiRequest } from "@/lib/api";

const tokenStorageKey = "fithub-token";

type AuthUser = {
  _id: string;
  name: string;
  email: string;
  roles: string[];
};

type MealProgressEntry = {
  _id: string;
  userId: string;
  date: string;
  status: "followed" | "partial" | "missed";
  completedMeals?: {
    breakfast?: boolean;
    lunch?: boolean;
    snack?: boolean;
    dinner?: boolean;
  };
  note?: string;
};

type PlanMode = "weekly" | "monthly";
type MealPlanView = "daily" | "weekly" | "monthly";

type MealKey = "breakfast" | "lunch" | "dinner" | "snack" | "evening";

type MealEntry = {
  key: MealKey;
  label: string;
  time: string;
  summary: string;
};

type DayPlan = {
  day: string;
  focus: string;
  entries: MealEntry[];
};

const viewOptions: Array<{ key: MealPlanView; label: string }> = [
  { key: "daily", label: "Today" },
  { key: "weekly", label: "Weekly table" },
  { key: "monthly", label: "Monthly table" },
];

const mealRows: Array<{ key: MealKey; label: string }> = [
  { key: "breakfast", label: "Breakfast" },
  { key: "lunch", label: "Lunch" },
  { key: "dinner", label: "Dinner" },
  { key: "snack", label: "Snack" },
  { key: "evening", label: "Evening" },
];

const plans: Record<PlanMode, DayPlan[]> = {
  weekly: [
    {
      day: "Monday",
      focus: "Fat loss and appetite control",
      entries: [
        { key: "breakfast", label: "Breakfast", time: "07:30", summary: "Greek yogurt, berries, chia, and boiled eggs" },
        { key: "lunch", label: "Lunch", time: "13:00", summary: "Grilled chicken bowl with rice, greens, and cucumber" },
        { key: "dinner", label: "Dinner", time: "19:30", summary: "Baked fish, sweet potato, and steamed vegetables" },
        { key: "snack", label: "Snack", time: "16:30", summary: "Apple, almonds, and water" },
        { key: "evening", label: "Evening", time: "21:00", summary: "Herbal tea and cottage cheese" },
      ],
    },
    {
      day: "Tuesday",
      focus: "Strength day recovery",
      entries: [
        { key: "breakfast", label: "Breakfast", time: "07:00", summary: "Oats, whey, banana, and peanut butter" },
        { key: "lunch", label: "Lunch", time: "12:30", summary: "Turkey wrap, salad, and yogurt" },
        { key: "dinner", label: "Dinner", time: "20:00", summary: "Beef stir-fry with vegetables and jasmine rice" },
        { key: "snack", label: "Snack", time: "17:00", summary: "Low-fat cheese and crackers" },
        { key: "evening", label: "Evening", time: "21:15", summary: "Casein shake and kiwi" },
      ],
    },
    {
      day: "Wednesday",
      focus: "Lower-calorie rest day",
      entries: [
        { key: "breakfast", label: "Breakfast", time: "08:00", summary: "Omelette, avocado, and tomatoes" },
        { key: "lunch", label: "Lunch", time: "13:00", summary: "Tuna salad with mixed greens and olive oil" },
        { key: "dinner", label: "Dinner", time: "19:00", summary: "Chicken soup with roasted vegetables" },
        { key: "snack", label: "Snack", time: "15:30", summary: "Protein shake and strawberries" },
        { key: "evening", label: "Evening", time: "20:45", summary: "Chamomile tea and walnuts" },
      ],
    },
    {
      day: "Thursday",
      focus: "High-output coaching day",
      entries: [
        { key: "breakfast", label: "Breakfast", time: "07:15", summary: "Smoothie with oats, banana, and spinach" },
        { key: "lunch", label: "Lunch", time: "13:15", summary: "Chicken pasta with greens" },
        { key: "dinner", label: "Dinner", time: "20:15", summary: "Shrimp couscous and green beans" },
        { key: "snack", label: "Snack", time: "17:30", summary: "Boiled eggs and fruit" },
        { key: "evening", label: "Evening", time: "21:30", summary: "Greek yogurt with cinnamon" },
      ],
    },
    {
      day: "Friday",
      focus: "Balanced day with one planned cheat meal",
      entries: [
        { key: "breakfast", label: "Breakfast", time: "07:30", summary: "Scrambled eggs, toast, and mixed fruit" },
        { key: "lunch", label: "Lunch", time: "13:00", summary: "Grilled chicken wrap with salad and yogurt dip" },
        { key: "dinner", label: "Dinner", time: "19:30", summary: "Salmon, potatoes, and roasted vegetables" },
        { key: "snack", label: "Snack", time: "16:30", summary: "Cheat meal: burger and fries or favorite afternoon treat" },
        { key: "evening", label: "Evening", time: "21:00", summary: "Keep evening intake light with tea and fruit" },
      ],
    },
    {
      day: "Saturday",
      focus: "Social day with structure",
      entries: [
        { key: "breakfast", label: "Breakfast", time: "08:30", summary: "Protein pancakes with berries" },
        { key: "lunch", label: "Lunch", time: "13:30", summary: "Rice bowl with lean beef and vegetables" },
        { key: "dinner", label: "Dinner", time: "20:00", summary: "Chicken skewers, flatbread, and salad" },
        { key: "snack", label: "Snack", time: "16:00", summary: "Greek yogurt and nuts" },
        { key: "evening", label: "Evening", time: "21:30", summary: "Cottage cheese and cucumber slices" },
      ],
    },
    {
      day: "Sunday",
      focus: "Reset and prep for the next week",
      entries: [
        { key: "breakfast", label: "Breakfast", time: "08:30", summary: "Oats, banana, and boiled eggs" },
        { key: "lunch", label: "Lunch", time: "13:00", summary: "Chicken soup with bread and side salad" },
        { key: "dinner", label: "Dinner", time: "19:00", summary: "Turkey meatballs with rice and vegetables" },
        { key: "snack", label: "Snack", time: "16:00", summary: "Apple slices with peanut butter" },
        { key: "evening", label: "Evening", time: "21:00", summary: "Herbal tea and a small yogurt" },
      ],
    },
  ],
  monthly: [
    {
      day: "Week 1",
      focus: "Reset food quality and portion routine",
      entries: [
        { key: "breakfast", label: "Breakfast", time: "Daily", summary: "Repeat two approved breakfasts to build consistency" },
        { key: "lunch", label: "Lunch", time: "Daily", summary: "Lean protein, one carb source, two vegetables" },
        { key: "dinner", label: "Dinner", time: "Daily", summary: "Lighter evening meal with protein and vegetables" },
        { key: "snack", label: "Snack", time: "Daily", summary: "One planned snack only" },
        { key: "evening", label: "Evening", time: "Daily", summary: "Use the same light evening mini-meal each day" },
      ],
    },
    {
      day: "Week 2",
      focus: "Increase protein and hydration compliance",
      entries: [
        { key: "breakfast", label: "Breakfast", time: "Daily", summary: "Add 25g protein target before 9am" },
        { key: "lunch", label: "Lunch", time: "Daily", summary: "Track lunch photos for trainer review" },
        { key: "dinner", label: "Dinner", time: "Daily", summary: "Finish dinner 2-3 hours before sleep" },
        { key: "snack", label: "Snack", time: "Daily", summary: "Fruit or yogurt instead of unplanned sweets" },
        { key: "evening", label: "Evening", time: "Daily", summary: "Keep evening hunger under control with a fixed option" },
      ],
    },
    {
      day: "Week 3",
      focus: "Support training intensity",
      entries: [
        { key: "breakfast", label: "Breakfast", time: "Daily", summary: "Add workout-fuel carbs on hard training days" },
        { key: "lunch", label: "Lunch", time: "Daily", summary: "Keep lunch balanced to avoid evening cravings" },
        { key: "dinner", label: "Dinner", time: "Daily", summary: "Use a recovery-focused dinner after hard sessions" },
        { key: "snack", label: "Snack", time: "Daily", summary: "Keep one portable protein snack ready" },
        { key: "evening", label: "Evening", time: "Daily", summary: "Add a small recovery snack after late sessions" },
      ],
    },
    {
      day: "Week 4",
      focus: "Audit adherence and adjust target calories",
      entries: [
        { key: "breakfast", label: "Breakfast", time: "Daily", summary: "Repeat best-performing breakfast options" },
        { key: "lunch", label: "Lunch", time: "Daily", summary: "Reduce hidden calories from sauces and drinks" },
        { key: "dinner", label: "Dinner", time: "Daily", summary: "Hold portions steady and review hunger cues" },
        { key: "snack", label: "Snack", time: "Daily", summary: "Trainer reviews compliance before next cycle" },
        { key: "evening", label: "Evening", time: "Daily", summary: "Use the easiest high-adherence evening option" },
      ],
    },
  ],
};

const goalCards = [
  { title: "Target", value: "Fat loss" },
  { title: "Assigned by", value: "Coach Lina" },
  { title: "Current cycle", value: "Weekly" },
];

const toIsoDate = (value: Date) => value.toISOString().slice(0, 10);

const formatMonthLabel = (value: Date) => value.toLocaleDateString(undefined, { month: "long", year: "numeric" });

const buildCalendarGrid = (monthDate: Date) => {
  const startOfMonth = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
  const endOfMonth = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);
  const startWeekday = startOfMonth.getDay();
  const totalDays = endOfMonth.getDate();
  const cells: Array<{ isoDate: string; day: number; inMonth: boolean }> = [];

  for (let index = 0; index < startWeekday; index += 1) {
    const date = new Date(startOfMonth);
    date.setDate(date.getDate() - (startWeekday - index));
    cells.push({ isoDate: toIsoDate(date), day: date.getDate(), inMonth: false });
  }

  for (let day = 1; day <= totalDays; day += 1) {
    const date = new Date(monthDate.getFullYear(), monthDate.getMonth(), day);
    cells.push({ isoDate: toIsoDate(date), day, inMonth: true });
  }

  while (cells.length % 7 !== 0 || cells.length < 42) {
    const previous = cells[cells.length - 1];
    const date = new Date(previous.isoDate);
    date.setDate(date.getDate() + 1);
    cells.push({ isoDate: toIsoDate(date), day: date.getDate(), inMonth: false });
  }

  return cells;
};

export default function MealPlansPage() {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [view, setView] = useState<MealPlanView>("weekly");
  const [token, setToken] = useState<string | null>(null);
  const [mealProgress, setMealProgress] = useState<MealProgressEntry[]>([]);
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<string>(toIsoDate(new Date()));
  const [selectedDateMeals, setSelectedDateMeals] = useState({ breakfast: false, lunch: false, snack: false, dinner: false });
  const [calendarMonth, setCalendarMonth] = useState<Date>(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [savingProgress, setSavingProgress] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const returnToCurrentPage = `${pathname}${searchParams.toString() ? `?${searchParams.toString()}` : ""}`;

  useEffect(() => {
    let ignore = false;

    void (async () => {
      const token = typeof window !== "undefined" ? window.localStorage.getItem(tokenStorageKey) : null;
      if (!token) {
        return;
      }

      if (!ignore) {
        setToken(token);
      }

      try {
        const response = await apiRequest<{ user: AuthUser }>("/auth/me", { token });
        if (!ignore) {
          setCurrentUser(response.user);
          const progressData = await apiRequest<MealProgressEntry[]>(`/meal-progress/user/${response.user._id}?days=180`, { token });
          if (!ignore) {
            setMealProgress(progressData);
          }
        }
      } catch (error) {
        if (ignore) {
          return;
        }

        if (error instanceof ApiError && error.status === 401) {
          window.localStorage.removeItem(tokenStorageKey);
        }

        setCurrentUser(null);
      }
    })();

    return () => {
      ignore = true;
    };
  }, []);

  const handleLogout = () => {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(tokenStorageKey);
    }
    setToken(null);
    setCurrentUser(null);
    setMealProgress([]);
  };

  const dailyPlan = plans.weekly;
  const currentDay = dailyPlan[0];
  const activePlan = useMemo(() => {
    if (view === "daily") {
      return [currentDay];
    }

    return view === "monthly" ? plans.monthly : plans.weekly;
  }, [currentDay, view]);

  const progressByDate = useMemo(
    () => Object.fromEntries(mealProgress.map((entry) => [entry.date, entry])),
    [mealProgress]
  );

  const todayIsoDate = useMemo(() => toIsoDate(new Date()), []);

  const resolveDerivedStatus = useCallback((entry?: MealProgressEntry) => {
    if (!entry) {
      return undefined;
    }

    if (entry.completedMeals) {
      const meals = {
        breakfast: Boolean(entry.completedMeals.breakfast),
        lunch: Boolean(entry.completedMeals.lunch),
        snack: Boolean(entry.completedMeals.snack),
        dinner: Boolean(entry.completedMeals.dinner),
      };

      return Object.values(meals).every(Boolean) ? "followed" : "missed";
    }

    return entry.status;
  }, []);

  const getCalendarStatus = useCallback((isoDate: string) => {
    const entry = progressByDate[isoDate];
    if (entry) {
      return resolveDerivedStatus(entry);
    }

    return isoDate <= todayIsoDate ? "missed" : undefined;
  }, [progressByDate, resolveDerivedStatus, todayIsoDate]);

  const selectedDateProgress = progressByDate[selectedCalendarDate] ?? null;

  const calendarCells = useMemo(
    () => buildCalendarGrid(calendarMonth),
    [calendarMonth]
  );

  const monthProgressStats = useMemo(() => {
    const monthStart = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), 1);
    const monthEnd = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 0);
    const maxDate = monthEnd > new Date(todayIsoDate) ? new Date(todayIsoDate) : monthEnd;

    let followed = 0;
    let missed = 0;
    let total = 0;

    for (let day = 1; day <= maxDate.getDate(); day += 1) {
      const date = new Date(monthStart.getFullYear(), monthStart.getMonth(), day);
      const isoDate = toIsoDate(date);
      const status = getCalendarStatus(isoDate);
      if (!status) {
        continue;
      }

      total += 1;
      if (status === "followed") {
        followed += 1;
      } else {
        missed += 1;
      }
    }

    return {
      followed,
      missed,
      total,
      adherence: total > 0 ? Math.round((followed / total) * 100) : 0,
    };
  }, [calendarMonth, getCalendarStatus, todayIsoDate]);

  const followedCount = useMemo(
    () => mealProgress.filter((entry) => resolveDerivedStatus(entry) === "followed").length,
    [mealProgress, resolveDerivedStatus]
  );

  const trackedDays = mealProgress.length;
  const adherence = trackedDays === 0 ? 0 : Math.round((followedCount / trackedDays) * 100);

  const chartBlocks = useMemo(() => {
    const followed = mealProgress.filter((entry) => resolveDerivedStatus(entry) === "followed").length;
    const missed = mealProgress.filter((entry) => resolveDerivedStatus(entry) === "missed").length;
    const total = followed + missed || 1;
    return [
      { label: "Followed", percent: Math.round((followed / total) * 100) },
      { label: "Missed", percent: Math.round((missed / total) * 100) },
    ];
  }, [mealProgress, resolveDerivedStatus]);

  const handleSaveSelectedDateMeals = async () => {
    if (!token || !currentUser) {
      setError("Sign in to update meal progress.");
      return;
    }

    setSavingProgress(true);
    setError(null);
    setFeedback(null);

    const allComplete = Object.values(selectedDateMeals).every(Boolean);
    const status: MealProgressEntry["status"] = allComplete ? "followed" : "missed";

    try {
      const updated = await apiRequest<MealProgressEntry>(`/meal-progress/user/${currentUser._id}`, {
        method: "POST",
        token,
        body: {
          date: selectedCalendarDate,
          status,
          completedMeals: selectedDateMeals,
        },
      });

      setMealProgress((current) => {
        const remaining = current.filter((entry) => entry.date !== updated.date);
        return [updated, ...remaining].sort((left, right) => right.date.localeCompare(left.date));
      });
      setFeedback(`Saved meal completion for ${new Date(selectedCalendarDate).toLocaleDateString()}.`);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Failed to save meal completion.");
    } finally {
      setSavingProgress(false);
    }
  };

  const statusClass = (status?: MealProgressEntry["status"]) => {
    if (status === "followed") return "bg-[#123322] text-white";
    if (status === "partial") return "bg-[#d7ff3f] text-accent-deep";
    if (status === "missed") return "bg-[#ff6a2c] text-white";
    return "bg-white text-muted border border-black/10";
  };

  useEffect(() => {
    const completedMeals = selectedDateProgress?.completedMeals;
    setSelectedDateMeals({
      breakfast: Boolean(completedMeals?.breakfast),
      lunch: Boolean(completedMeals?.lunch),
      snack: Boolean(completedMeals?.snack),
      dinner: Boolean(completedMeals?.dinner),
    });
  }, [selectedDateProgress?.completedMeals, selectedCalendarDate]);

  const planColumns = activePlan;

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(216,146,88,0.16),_transparent_30%),linear-gradient(180deg,_#fbf4e8_0%,_#f4ecdf_54%,_#efe5d8_100%)] px-2 py-6 text-foreground sm:px-4 lg:px-6 xl:px-8">
      <div className="mx-auto flex w-full max-w-[1680px] flex-col gap-8">
        <section className="overflow-hidden rounded-[2.75rem] border border-black/5 bg-surface/95 shadow-[0_35px_90px_rgba(18,33,23,0.08)]">
          <SiteHeader activeKey={null} currentUser={currentUser} onLogout={handleLogout} />

          <div className="grid gap-8 px-6 py-8 sm:px-8 sm:py-10 lg:grid-cols-[1.12fr_0.88fr] lg:px-10 lg:py-12">
            <div>
              <span className="inline-flex rounded-full bg-[#d97941]/12 px-4 py-2 text-sm font-semibold uppercase tracking-[0.18em] text-[#b85f26]">Meal plans</span>
              <div className="mt-5">
                <ReturnToPreviousButton className="inline-flex rounded-full border border-black/10 px-5 py-3 text-sm font-semibold text-accent-deep transition-colors hover:border-accent hover:text-accent" fallbackHref="/discover" label="Back to previous page" />
              </div>
              <h1 className="mt-5 max-w-4xl text-5xl font-black tracking-[-0.05em] text-accent-deep sm:text-6xl">Trainer-assigned meal timetable with calendar-based completion tracking.</h1>
              <p className="mt-5 max-w-2xl text-lg leading-8 text-muted">The timetable is read-only so members only follow assigned meals, while day completion is recorded from the calendar card.</p>
              <div className="mt-8 flex flex-wrap gap-3">
                {viewOptions.map((option) => <button key={option.key} className={view === option.key ? "rounded-full bg-accent-deep px-6 py-3 text-sm font-semibold text-white" : "rounded-full border border-black/10 px-6 py-3 text-sm font-semibold text-accent-deep"} onClick={() => setView(option.key)} type="button">{option.label}</button>)}
              </div>
              <div className="mt-8 grid gap-3 sm:grid-cols-3">
                {goalCards.map((card) => <article key={card.title} className="rounded-[1.4rem] border border-black/6 bg-white/85 px-4 py-4"><p className="text-xs uppercase tracking-[0.18em] text-muted">{card.title}</p><p className="mt-3 text-xl font-bold tracking-[-0.03em] text-accent-deep">{card.value}</p></article>)}
              </div>
            </div>

            <div className="rounded-[2rem] bg-[linear-gradient(145deg,_rgba(255,255,255,0.92),_rgba(247,236,219,0.96))] p-6 shadow-[0_22px_55px_rgba(18,33,23,0.08)]">
              <p className="text-sm uppercase tracking-[0.18em] text-muted">Progress</p>
              <div className="mt-4 rounded-[1.7rem] bg-accent-deep p-5 text-surface">
                <div className="flex items-end justify-between gap-3">
                  <div>
                    <p className="text-sm uppercase tracking-[0.18em] text-surface/70">Adherence</p>
                    <p className="mt-2 text-5xl font-black tracking-[-0.05em]">{adherence}%</p>
                  </div>
                  <p className="text-sm text-surface/78">{followedCount}/{trackedDays || 0} tracked days</p>
                </div>
                <div className="mt-6 flex min-h-36 items-end gap-3">
                  {chartBlocks.map((block) => <div key={block.label} className="flex flex-1 flex-col items-center gap-3"><div className="flex h-28 w-full items-end rounded-2xl bg-white/10 p-2"><div className="w-full rounded-xl bg-[#f0dcc2]" style={{ height: `${Math.max(block.percent, 10)}%` }} /></div><div className="text-center"><p className="text-xs uppercase tracking-[0.16em] text-surface/70">{block.label}</p><p className="mt-1 text-sm font-semibold text-surface">{block.percent}%</p></div></div>)}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-[2.2rem] border border-black/5 bg-[linear-gradient(180deg,_rgba(255,255,255,0.96)_0%,_rgba(246,236,223,0.92)_100%)] p-4 shadow-[0_24px_60px_rgba(18,33,23,0.07)] sm:p-6 lg:p-8">
          <div className="rounded-[1.9rem] border border-white/70 bg-white/70 p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.75)] sm:p-8">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.2em] text-muted">Meal progress calendar</p>
                <h2 className="mt-3 text-3xl font-bold tracking-[-0.03em] text-accent-deep">Track each day and save it by date</h2>
                <p className="mt-3 text-sm text-muted">Select a day, set the status, and it is stored for that specific date in your meal history.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button className="rounded-full border border-black/10 px-4 py-2 text-sm font-semibold text-accent-deep" onClick={() => setCalendarMonth((current) => new Date(current.getFullYear(), current.getMonth() - 1, 1))} type="button">Previous</button>
                <div className="rounded-full bg-accent-deep px-5 py-2 text-sm font-semibold text-white">{formatMonthLabel(calendarMonth)}</div>
                <button className="rounded-full border border-black/10 px-4 py-2 text-sm font-semibold text-accent-deep" onClick={() => setCalendarMonth((current) => new Date(current.getFullYear(), current.getMonth() + 1, 1))} type="button">Next</button>
              </div>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-7 text-xs font-semibold uppercase tracking-[0.14em] text-muted">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => <div key={day} className="px-3">{day}</div>)}
            </div>

            <div className="mt-2 grid gap-3 sm:grid-cols-7">
              {calendarCells.map((cell) => {
                const dayStatus = getCalendarStatus(cell.isoDate);
                const isSelected = selectedCalendarDate === cell.isoDate;
                return (
                  <button
                    key={cell.isoDate}
                    className={isSelected ? "rounded-2xl border border-accent bg-[rgba(215,255,63,0.2)] px-3 py-3 text-left" : cell.inMonth ? "rounded-2xl border border-black/8 bg-white px-3 py-3 text-left" : "rounded-2xl border border-black/6 bg-[rgba(8,19,32,0.04)] px-3 py-3 text-left opacity-75"}
                    onClick={() => setSelectedCalendarDate(cell.isoDate)}
                    type="button"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-semibold text-accent-deep">{cell.day}</span>
                      <span className={`rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] ${statusClass(dayStatus)}`}>{dayStatus ?? "none"}</span>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="mt-6 grid gap-4 lg:grid-cols-[0.85fr_1.15fr]">
              <div className="rounded-2xl border border-black/8 bg-white px-4 py-4">
                <p className="text-sm font-semibold uppercase tracking-[0.16em] text-muted">Selected day</p>
                <p className="mt-2 text-xl font-bold tracking-[-0.03em] text-accent-deep">{new Date(selectedCalendarDate).toLocaleDateString()}</p>
                <p className="mt-2 text-sm text-muted">Current status: {getCalendarStatus(selectedCalendarDate) ?? "not set"}</p>
                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  {(["breakfast", "lunch", "snack", "dinner"] as const).map((mealKey) => (
                    <button
                      key={mealKey}
                      className={selectedDateMeals[mealKey]
                        ? "rounded-full border border-emerald-300 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700"
                        : "rounded-full border border-black/10 px-4 py-2 text-sm font-semibold text-accent-deep"}
                      onClick={() => setSelectedDateMeals((current) => ({ ...current, [mealKey]: !current[mealKey] }))}
                      type="button"
                    >
                      {mealKey} {selectedDateMeals[mealKey] ? "completed" : "pending"}
                    </button>
                  ))}
                </div>
                <div className="mt-3">
                  <button className="rounded-full border border-black/10 px-4 py-2 text-sm font-semibold text-accent-deep" disabled={savingProgress} onClick={handleSaveSelectedDateMeals} type="button">Save day meals</button>
                </div>
                {feedback ? <p className="mt-3 rounded-xl border border-lime-300/70 bg-lime-100 px-3 py-2 text-sm text-lime-900">{feedback}</p> : null}
                {error ? <p className="mt-3 rounded-xl border border-rose-300/60 bg-rose-100 px-3 py-2 text-sm text-rose-700">{error}</p> : null}
              </div>

              <div className="rounded-2xl border border-black/8 bg-white px-4 py-4">
                <p className="text-sm font-semibold uppercase tracking-[0.16em] text-muted">{formatMonthLabel(calendarMonth)} summary</p>
                <div className="mt-4 grid gap-3 sm:grid-cols-4">
                  <article className="rounded-xl border border-black/8 bg-background px-3 py-3"><p className="text-xs uppercase tracking-[0.14em] text-muted">Logged days</p><p className="mt-2 text-lg font-semibold text-accent-deep">{monthProgressStats.total}</p></article>
                  <article className="rounded-xl border border-black/8 bg-background px-3 py-3"><p className="text-xs uppercase tracking-[0.14em] text-muted">Followed</p><p className="mt-2 text-lg font-semibold text-accent-deep">{monthProgressStats.followed}</p></article>
                  <article className="rounded-xl border border-black/8 bg-background px-3 py-3"><p className="text-xs uppercase tracking-[0.14em] text-muted">Missed</p><p className="mt-2 text-lg font-semibold text-accent-deep">{monthProgressStats.missed}</p></article>
                </div>
                <div className="mt-4 rounded-xl border border-black/8 bg-background px-3 py-3 text-sm text-muted">Monthly adherence from saved calendar entries: <span className="font-semibold text-accent-deep">{monthProgressStats.adherence}%</span></div>
              </div>
            </div>
          </div>
        </section>

        <section>
          <div className="rounded-[2.2rem] border border-black/5 bg-[linear-gradient(180deg,_rgba(255,255,255,0.96)_0%,_rgba(246,236,223,0.92)_100%)] p-4 shadow-[0_24px_60px_rgba(18,33,23,0.07)] sm:p-6 lg:p-8">
            <div className="rounded-[1.9rem] border border-white/70 bg-white/70 p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.75)] sm:p-8">
              <div className="border-b border-black/6 pb-6">
              <div>
                <p className="text-sm uppercase tracking-[0.2em] text-muted">{view === "daily" ? "Today" : view === "weekly" ? "Weekly plan" : "Monthly plan"}</p>
                <h2 className="mt-3 text-3xl font-bold tracking-[-0.03em] text-accent-deep">Meal timetable</h2>
                <p className="mt-3 text-sm text-muted">
                  {view === "daily"
                    ? currentDay.focus
                    : "This timetable shows the trainer-assigned meal plan only. Meal completion is recorded in the calendar section above."}
                </p>
              </div>
              </div>

              <div className="mt-6 overflow-x-auto pb-2">
                <div className="min-w-[1200px] rounded-[1.8rem] bg-[radial-gradient(circle_at_top,_rgba(234,219,194,0.42),_transparent_42%),linear-gradient(180deg,_rgba(247,240,230,0.9)_0%,_rgba(241,232,220,0.88)_100%)] p-2.5 sm:p-3 2xl:min-w-0">
                  <div className="grid gap-3" style={{ gridTemplateColumns: `10.75rem repeat(${planColumns.length}, minmax(9rem, 1fr))` }}>
                    <div className="rounded-[1.35rem] border border-[#dcc9ab] bg-[linear-gradient(180deg,_#eadbc2_0%,_#dfc8a8_100%)] px-4 py-5 shadow-[0_10px_24px_rgba(146,112,60,0.12)]">
                      <p className="text-xs uppercase tracking-[0.18em] text-muted">Meals</p>
                      <p className="mt-2 text-lg font-bold tracking-[-0.03em] text-accent-deep">Schedule</p>
                      <p className="mt-2 text-sm text-accent-deep/70">Weekly structure</p>
                    </div>
                    {planColumns.map((column, columnIndex) => <div key={column.day} className={columnIndex === planColumns.length - 1 ? "rounded-[1.35rem] border border-[#d0b48a] bg-[linear-gradient(180deg,_#e4cfad_0%,_#d6ba8d_100%)] px-4 py-5 shadow-[0_10px_24px_rgba(146,112,60,0.15)]" : "rounded-[1.35rem] border border-[#dcc9ab] bg-[linear-gradient(180deg,_#eadbc2_0%,_#dfc8a8_100%)] px-4 py-5 shadow-[0_10px_24px_rgba(146,112,60,0.12)]"}><p className="text-[10px] uppercase tracking-[0.18em] text-muted">{view === "monthly" ? "Week block" : "Day"}</p><p className="mt-2 text-lg font-bold tracking-[-0.03em] text-accent-deep">{column.day}</p><p className="mt-2 text-xs leading-5 text-accent-deep/72">{column.focus}</p></div>)}

                    {mealRows.flatMap((meal) => {
                      const mealLabelCell = <div key={`${meal.key}-label`} className="rounded-[1.35rem] border border-[#ebe2d2] bg-[linear-gradient(180deg,_rgba(255,255,255,0.98)_0%,_rgba(249,245,239,0.96)_100%)] px-4 py-5 shadow-[0_8px_20px_rgba(18,33,23,0.05)]"><p className="text-xs uppercase tracking-[0.18em] text-muted">Meal</p><p className="mt-2 text-xl font-bold tracking-[-0.03em] text-accent-deep">{meal.label}</p><div className="mt-4 h-1.5 w-10 rounded-full bg-[#e9d1ad]" /></div>;

                      const mealCells = planColumns.map((column, columnIndex) => {
                        const entry = column.entries.find((item) => item.key === meal.key);

                        if (!entry) {
                          return <div key={`${column.day}-${meal.key}`} className={columnIndex === planColumns.length - 1 ? "rounded-[1.35rem] border border-[#d0b48a] bg-[linear-gradient(180deg,_#ead5b3_0%,_#dcc095_100%)] p-3" : "rounded-[1.35rem] border border-black/8 bg-[#f3ecdf] p-3"}><div className="flex min-h-[172px] items-center rounded-[1.1rem] bg-white px-4 py-4 text-sm text-muted shadow-[0_10px_24px_rgba(18,33,23,0.05)]">No meal assigned.</div></div>;
                        }

                        const entryId = `${view === "monthly" ? "monthly" : "weekly"}-${column.day}-${entry.key}`;

                        return <div key={entryId} className={columnIndex === planColumns.length - 1 ? "rounded-[1.35rem] border border-[#d0b48a] bg-[linear-gradient(180deg,_#ead5b3_0%,_#dcc095_100%)] p-3" : "rounded-[1.35rem] border border-black/8 bg-[#f3ecdf] p-3"}><div className="flex min-h-[172px] flex-col rounded-[1.1rem] bg-white px-4 py-4 shadow-[0_10px_24px_rgba(18,33,23,0.05)]"><p className="text-[13px] leading-6 text-muted">{entry.summary}</p><p className="mt-4 text-xs uppercase tracking-[0.16em] text-accent-deep">{entry.time}</p></div></div>;
                      });

                      return [mealLabelCell, ...mealCells];
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}