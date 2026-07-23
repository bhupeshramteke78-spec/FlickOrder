"use client";

import { Moon, Sun, Sunrise, Sunset } from "lucide-react";
import { useEffect, useState } from "react";

const timeFormatter = new Intl.DateTimeFormat("en-IN", {
  hour: "2-digit",
  minute: "2-digit",
  hour12: true,
});

const dayFormatter = new Intl.DateTimeFormat("en-IN", {
  weekday: "long",
  month: "long",
  day: "numeric",
});

type SyncedClock = {
  epochMs: number;
  localSyncedAt: number;
  timezone: string;
  utcOffset: string;
  source: string;
};

function getTimeOfDay(date: Date | null) {
  if (!date) {
    return { label: "Syncing", Icon: Sun, tone: "day" };
  }

  const hour = date.getHours();

  if (hour >= 5 && hour < 11) {
    return { label: "Morning", Icon: Sunrise, tone: "morning" };
  }

  if (hour >= 11 && hour < 17) {
    return { label: "Day", Icon: Sun, tone: "day" };
  }

  if (hour >= 17 && hour < 20) {
    return { label: "Evening", Icon: Sunset, tone: "evening" };
  }

  return { label: "Night", Icon: Moon, tone: "night" };
}

function formatClockTime(date: Date) {
  const parts = timeFormatter.formatToParts(date);
  const time = `${parts.find((part) => part.type === "hour")?.value ?? "00"}:${parts.find((part) => part.type === "minute")?.value ?? "00"}`;
  const period = parts.find((part) => part.type === "dayPeriod")?.value ?? "";

  return { time, period };
}

function createLocalFallbackClock(): SyncedClock {
  const localNow = Date.now();

  return {
    epochMs: localNow,
    localSyncedAt: localNow,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "Local time",
    utcOffset: "Local",
    source: "Local fallback",
  };
}

export function DashboardClock() {
  const [syncedClock, setSyncedClock] = useState<SyncedClock | null>(null);
  const [now, setNow] = useState<Date | null>(null);
  const { time, period } = formatClockTime(now ?? new Date(0));
  const timeOfDay = getTimeOfDay(now);
  const ClockIcon = timeOfDay.Icon;

  useEffect(() => {
    let isMounted = true;

    async function syncInternetTime() {
      const response = await fetch("/api/time", { cache: "no-store" }).catch(() => null);
      const body = response
        ? ((await response.json().catch(() => null)) as {
            epochMs?: number;
            timezone?: string;
            utcOffset?: string;
            source?: string;
          } | null)
        : null;

      if (!isMounted) {
        return;
      }

      if (!response?.ok || typeof body?.epochMs !== "number") {
        setSyncedClock(createLocalFallbackClock());
        return;
      }

      setSyncedClock({
        epochMs: body.epochMs,
        localSyncedAt: Date.now(),
        timezone: body.timezone ?? "Asia/Kolkata",
        utcOffset: body.utcOffset ?? "+05:30",
        source: body.source ?? "Internet time",
      });
    }

    void syncInternetTime();

    const resyncIntervalId = window.setInterval(() => {
      void syncInternetTime();
    }, 60_000);

    return () => {
      isMounted = false;
      window.clearInterval(resyncIntervalId);
    };
  }, []);

  useEffect(() => {
    if (!syncedClock) {
      return;
    }

    const activeClock = syncedClock;

    function tick() {
      setNow(new Date(activeClock.epochMs + Date.now() - activeClock.localSyncedAt));
    }

    tick();
    const tickIntervalId = window.setInterval(tick, 1000);

    return () => window.clearInterval(tickIntervalId);
  }, [syncedClock]);

  return (
    <div
      className="dashboard-clock-card"
      data-tone={timeOfDay.tone}
      aria-label={now ? `Current time ${time} ${period}, ${timeOfDay.label}` : "Syncing internet time"}
    >
      {now ? (
        <>
          <p className="dashboard-clock-time">
            <span>{time}</span>
            <span className="dashboard-clock-period">{period}</span>
          </p>
          <p className="dashboard-clock-day">{dayFormatter.format(now)}</p>
        </>
      ) : (
        <div className="ml-4">
          <p className="text-xl font-bold">Syncing...</p>
          <p className="mt-2 max-w-48 text-sm font-medium text-blue-100">Fetching time and date from the internet</p>
        </div>
      )}
      <ClockIcon className="dashboard-clock-icon" />
    </div>
  );
}
