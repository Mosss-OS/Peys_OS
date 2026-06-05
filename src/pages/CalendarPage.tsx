import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, ArrowUpRight, ArrowDownLeft, Clock, X } from "lucide-react";
import { useApp } from "@/contexts/AppContext";
import type { Transaction } from "@/types/transaction";
import AppHeader from "@/components/AppHeader";
import Footer from "@/components/Footer";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

function isSameDay(d1: Date, d2: Date): boolean {
  return d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate();
}

function TxIcon({ type }: { type: Transaction["type"] }) {
  if (type === "sent") return <ArrowUpRight className="h-4 w-4" />;
  if (type === "claimed") return <ArrowDownLeft className="h-4 w-4" />;
  return <Clock className="h-4 w-4" />;
}

const iconBg = {
  sent: "bg-destructive/10 text-destructive",
  claimed: "bg-primary/10 text-primary",
  pending: "bg-warning/10 text-warning",
};

interface DayEvent {
  transaction: Transaction;
}

export default function CalendarPage() {
  const { isLoggedIn, login, transactions, transactionsLoading } = useApp();
  const today = new Date();
  const [currentDate, setCurrentDate] = useState({ year: today.getFullYear(), month: today.getMonth() });
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const transactionsByDate = useMemo(() => {
    const map = new Map<string, DayEvent[]>();
    transactions.forEach((tx) => {
      const dateKey = tx.timestamp.toDateString();
      const existing = map.get(dateKey) || [];
      existing.push({ transaction: tx });
      map.set(dateKey, existing);
    });
    return map;
  }, [transactions]);

  const daysInMonth = getDaysInMonth(currentDate.year, currentDate.month);
  const firstDayOfMonth = getFirstDayOfMonth(currentDate.year, currentDate.month);

  const calendarDays = useMemo(() => {
    const days: { date: Date; isCurrentMonth: boolean; isToday: boolean; hasEvents: boolean; eventCount: number }[] = [];
    
    // Previous month padding
    const prevMonth = currentDate.month === 0 ? 11 : currentDate.month - 1;
    const prevYear = currentDate.month === 0 ? currentDate.year - 1 : currentDate.year;
    const daysInPrevMonth = getDaysInMonth(prevYear, prevMonth);
    
    for (let i = firstDayOfMonth - 1; i >= 0; i--) {
      const date = new Date(prevYear, prevMonth, daysInPrevMonth - i);
      const dateKey = date.toDateString();
      const events = transactionsByDate.get(dateKey);
      days.push({
        date,
        isCurrentMonth: false,
        isToday: false,
        hasEvents: !!events?.length,
        eventCount: events?.length || 0,
      });
    }

    // Current month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentDate.year, currentDate.month, day);
      const isToday = isSameDay(date, today);
      const dateKey = date.toDateString();
      const events = transactionsByDate.get(dateKey);
      days.push({
        date,
        isCurrentMonth: true,
        isToday,
        hasEvents: !!events?.length,
        eventCount: events?.length || 0,
      });
    }

    // Next month padding
    const nextMonth = currentDate.month === 11 ? 0 : currentDate.month + 1;
    const nextYear = currentDate.month === 11 ? currentDate.year + 1 : currentDate.year;
    const remainingDays = 42 - days.length;
    for (let day = 1; day <= remainingDays; day++) {
      const date = new Date(nextYear, nextMonth, day);
      const dateKey = date.toDateString();
      const events = transactionsByDate.get(dateKey);
      days.push({
        date,
        isCurrentMonth: false,
        isToday: false,
        hasEvents: !!events?.length,
        eventCount: events?.length || 0,
      });
    }

    return days;
  }, [currentDate.year, currentDate.month, transactionsByDate, today]);

  const goToPrevMonth = () => {
    setCurrentDate((prev) => ({
      year: prev.month === 0 ? prev.year - 1 : prev.year,
      month: prev.month === 0 ? 11 : prev.month - 1,
    }));
  };

  const goToNextMonth = () => {
    setCurrentDate((prev) => ({
      year: prev.month === 11 ? prev.year + 1 : prev.year,
      month: prev.month === 11 ? 0 : prev.month + 1,
    }));
  };

  const goToToday = () => {
    setCurrentDate({ year: today.getFullYear(), month: today.getMonth() });
    setSelectedDate(today);
  };

  const selectedDateEvents = useMemo(() => {
    if (!selectedDate) return [];
    const dateKey = selectedDate.toDateString();
    return transactionsByDate.get(dateKey) || [];
  }, [selectedDate, transactionsByDate]);

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <div className="flex min-h-[80vh] flex-col items-center justify-center px-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
            <h2 className="mb-3 font-display text-2xl text-foreground sm:text-3xl">Sign in to view your calendar</h2>
            <p className="mb-6 text-sm text-muted-foreground sm:text-base">Track your payment schedule and history.</p>
            <button onClick={login} className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 font-semibold text-primary-foreground shadow-glow transition-opacity hover:opacity-90">
              Sign In
            </button>
          </motion.div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <div className="relative container mx-auto max-w-5xl px-4 pt-20 pb-12 sm:pt-24 sm:pb-16">
        <div className="pointer-events-none absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: "linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }} />

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CalendarIcon className="h-6 w-6 text-primary" />
            <h1 className="font-display text-2xl text-foreground sm:text-3xl">Calendar</h1>
          </div>
          <button
            onClick={goToToday}
            className="rounded-lg border border-border bg-card px-3 py-1.5 text-sm font-medium text-foreground shadow-soft transition-colors hover:bg-secondary sm:px-4"
          >
            Today
          </button>
        </motion.div>

        {/* Month Navigation */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
          className="mb-4 flex items-center justify-between rounded-xl border border-border bg-card p-4"
        >
          <button onClick={goToPrevMonth} className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <h2 className="font-display text-lg font-semibold text-foreground sm:text-xl">
            {MONTHS[currentDate.month]} {currentDate.year}
          </h2>
          <button onClick={goToNextMonth} className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
            <ChevronRight className="h-5 w-5" />
          </button>
        </motion.div>

        {/* Calendar Grid */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="mb-4 overflow-hidden rounded-xl border border-border bg-card"
        >
          {/* Day headers */}
          <div className="grid grid-cols-7 border-b border-border bg-secondary/50">
            {DAYS.map((day) => (
              <div key={day} className="p-2 text-center text-xs font-semibold text-muted-foreground sm:p-3 sm:text-sm">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar days */}
          <div className="grid grid-cols-7">
            {calendarDays.map((day, index) => (
              <button
                key={index}
                onClick={() => setSelectedDate(day.date)}
                className={`
                  relative min-h-[60px] border-b border-r border-border p-1 text-center transition-colors sm:min-h-[80px] sm:p-2
                  ${day.isCurrentMonth ? "bg-card hover:bg-secondary/30" : "bg-secondary/20 text-muted-foreground/50"}
                  ${day.isToday ? "ring-2 ring-inset ring-primary" : ""}
                  ${selectedDate && isSameDay(day.date, selectedDate) ? "bg-primary/10" : ""}
                `}
              >
                <span className={`
                  inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium sm:h-8 sm:w-8 sm:text-sm
                  ${day.isToday ? "bg-primary text-primary-foreground" : ""}
                  ${!day.isCurrentMonth ? "text-muted-foreground/50" : "text-foreground"}
                `}>
                  {day.date.getDate()}
                </span>
                
                {/* Event indicators */}
                {day.hasEvents && (
                  <div className="mt-1 flex justify-center gap-0.5">
                    {day.eventCount <= 3 ? (
                      Array.from({ length: day.eventCount }).map((_, i) => (
                        <span key={i} className="h-1.5 w-1.5 rounded-full bg-primary" />
                      ))
                    ) : (
                      <span className="text-[10px] text-muted-foreground sm:text-xs">{day.eventCount}</span>
                    )}
                  </div>
                )}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Legend */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
          className="mb-4 flex flex-wrap items-center gap-4 text-xs text-muted-foreground"
        >
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-primary" />
            <span>Sent</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-primary" />
            <span>Claimed</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-warning" />
            <span>Scheduled</span>
          </div>
        </motion.div>

        {/* Selected Date Events */}
        <AnimatePresence>
          {selectedDate && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="rounded-xl border border-border bg-card p-4"
            >
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-display text-lg text-foreground">
                  {selectedDate.toLocaleDateString("en", { weekday: "long", month: "long", day: "numeric" })}
                </h3>
                <button onClick={() => setSelectedDate(null)} className="rounded-lg p-1 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
                  <X className="h-4 w-4" />
                </button>
              </div>

              {transactionsLoading ? (
                <div className="space-y-2">
                  {[1, 2].map((i) => (
                    <div key={i} className="h-14 animate-pulse rounded-lg bg-muted" />
                  ))}
                </div>
              ) : selectedDateEvents.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">No transactions on this day.</p>
              ) : (
                <div className="space-y-2">
                  {selectedDateEvents.map(({ transaction: tx }, index) => (
                    <motion.div
                      key={tx.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-center gap-3 rounded-lg border border-border bg-background p-3 transition-colors hover:bg-secondary/30 sm:p-4"
                    >
                      <div className={`flex h-8 w-8 items-center justify-center rounded-full sm:h-9 sm:w-9 ${iconBg[tx.type]}`}>
                        <TxIcon type={tx.type} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="truncate text-sm font-medium text-foreground">{tx.counterparty}</p>
                          <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${tx.type === "sent" ? "bg-destructive/10 text-destructive" : tx.type === "claimed" ? "bg-primary/10 text-primary" : "bg-warning/10 text-warning"}`}>
                            {tx.type}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">{tx.memo || tx.timestamp.toLocaleTimeString()}</p>
                      </div>
                      <div className="text-right">
                        <p className={`text-sm font-semibold ${tx.type === "claimed" ? "text-primary" : "text-foreground"}`}>
                          {tx.type === "claimed" ? "+" : "-"}{tx.amount} {tx.token}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Upcoming Scheduled */}
        {!selectedDate && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
            className="rounded-xl border border-border bg-card p-4"
          >
            <h3 className="mb-4 font-display text-lg text-foreground">Upcoming Scheduled Payments</h3>
            {transactions.filter((tx) => tx.type === "pending" && tx.expiresAt && new Date(tx.expiresAt) > today).length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">No upcoming scheduled payments.</p>
            ) : (
              <div className="space-y-2">
                {transactions
                  .filter((tx) => tx.type === "pending" && tx.expiresAt && new Date(tx.expiresAt) > today)
                  .sort((a, b) => new Date(a.expiresAt!).getTime() - new Date(b.expiresAt!).getTime())
                  .map((tx) => (
                    <div key={tx.id} className="flex items-center justify-between rounded-lg border border-border bg-background p-3">
                      <div>
                        <p className="text-sm font-medium text-foreground">{tx.counterparty}</p>
                        <p className="text-xs text-muted-foreground">Expires {new Date(tx.expiresAt!).toLocaleDateString()}</p>
                      </div>
                      <p className="text-sm font-semibold text-foreground">
                        {tx.amount} {tx.token}
                      </p>
                    </div>
                  ))}
              </div>
            )}
          </motion.div>
        )}
      </div>
      <Footer />
    </div>
  );
}
