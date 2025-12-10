import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils/cn";

const TWITCH_HANDLE =
  process.env.TWITCH_CHANNEL_LOGIN ??
  process.env.NEXT_PUBLIC_TWITCH_USERNAME ??
  "fido27";

const TWITCH_API_BASE = "https://api.twitch.tv/helix";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Twitch Insights | Aarav Jain",
  description:
    "Live Twitch stats, upcoming schedule, and stream health for my channel.",
};

type TwitchUser = {
  id: string;
  login: string;
  display_name: string;
  description: string;
  profile_image_url: string;
  view_count: number;
  created_at: string;
};

type TwitchChannel = {
  broadcaster_id: string;
  broadcaster_language: string;
  game_name: string;
  title: string;
};

type TwitchStream = {
  id: string;
  user_id: string;
  user_name: string;
  game_name: string;
  title: string;
  viewer_count: number;
  started_at: string;
  type: string;
  tags?: string[];
};

type TwitchScheduleSegment = {
  id: string;
  start_time: string;
  end_time: string | null;
  title: string;
  category: { id: string; name: string } | null;
  is_recurring: boolean;
};

type TwitchStatsSuccess = {
  ok: true;
  username: string;
  user: TwitchUser;
  channel: TwitchChannel | null;
  stream: TwitchStream | null;
  followers: number | null;
  schedule: TwitchScheduleSegment[];
};

type TwitchStatsError = {
  ok: false;
  username: string;
  reason: "missing_env" | "user_not_found" | "fetch_failed";
  details?: string;
};

type TwitchStatsResult = TwitchStatsSuccess | TwitchStatsError;

type TwitchUsersResponse = { data: TwitchUser[] };
type TwitchChannelResponse = { data: TwitchChannel[] };
type TwitchStreamResponse = { data: TwitchStream[] };
type TwitchFollowersResponse = { total: number };
type TwitchScheduleResponse = { data: { segments: TwitchScheduleSegment[] } };
type TwitchTokenResponse = {
  access_token: string;
  expires_in: number;
  token_type: string;
};

export default async function TwitchPage() {
  const stats = await getTwitchStats();

  return (
    <section className="relative min-h-screen overflow-hidden bg-[#01020a] text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(168,85,247,0.28),_transparent_55%)]" />
      <div className="pointer-events-none absolute inset-y-0 left-1/2 hidden w-[40rem] -translate-x-1/2 rounded-full bg-fuchsia-500/10 blur-3xl md:block" />
      <div className="relative mx-auto max-w-6xl px-6 py-16">
        <header className="mb-10 flex flex-col gap-4">
          <p className="text-xs uppercase tracking-[0.4em] text-fuchsia-200/80">
            Twitch Control Room
          </p>
          <h1 className="text-4xl font-semibold leading-tight md:text-5xl">
            {stats.ok ? `${stats.user.display_name}'s` : "Channel"} live
            dashboard
          </h1>
          <p className="max-w-3xl text-base text-white/70 md:text-lg">
            A glanceable view of follower momentum, stream health, and the next
            scheduled sessions. Data refreshes periodically—jump in when
            inspiration strikes.
          </p>
        </header>

        {stats.ok ? (
          <div className="grid gap-8 xl:grid-cols-[2fr,1fr]">
            <div className="space-y-8">
              <HeroCard stats={stats} />
              <StatsGrid stats={stats} />
              <InsightsPanel stats={stats} />
            </div>

            <div className="space-y-8">
              <LivePanel stats={stats} />
              <SchedulePanel segments={stats.schedule} />
            </div>
          </div>
        ) : (
          <ErrorState status={stats} />
        )}
      </div>
    </section>
  );
}

function HeroCard({ stats }: { stats: TwitchStatsSuccess }) {
  const avatar =
    stats.user.profile_image_url || "/icons/instagram purple.svg" || "/pic.jpg";

  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#1b0f24] via-[#090112] to-[#050108] p-8 shadow-[0_25px_80px_rgba(0,0,0,0.45)]">
      <div className="absolute inset-0 opacity-30 blur-3xl" />
      <div className="relative flex flex-col gap-6 md:flex-row md:items-center">
        <div className="relative h-28 w-28 overflow-hidden rounded-2xl border border-white/20 shadow-2xl shadow-fuchsia-900/40">
          <Image
            src={avatar}
            alt={`${stats.user.display_name} avatar`}
            width={112}
            height={112}
            className="h-full w-full object-cover"
          />
        </div>

        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-3xl font-semibold">{stats.user.display_name}</p>
            <StatusBadge stream={stats.stream} />
          </div>
          <p className="mt-2 max-w-2xl text-sm text-white/70 md:text-base">
            {stats.user.description || "No channel bio yet—time to write one!"}
          </p>

          <div className="mt-6 flex flex-wrap gap-3 text-sm font-semibold">
            <Link
              href={`https://twitch.tv/${stats.username}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-fuchsia-500/80 px-5 py-2 text-sm text-white transition hover:bg-fuchsia-400"
            >
              Open channel
              <span aria-hidden>↗</span>
            </Link>
            <Link
              href="/twitch?refresh=1"
              prefetch={false}
              className="rounded-full border border-white/20 px-5 py-2 text-sm text-white/80 transition hover:bg-white/10"
            >
              Refresh stats
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatsGrid({ stats }: { stats: TwitchStatsSuccess }) {
  const liveDuration = stats.stream
    ? computeDurationMinutes(stats.stream.started_at)
    : null;

  return (
    <div className="grid gap-5 sm:grid-cols-2">
      <StatCard
        label="Followers"
        value={formatNumber(stats.followers)}
        helper="Total people who hit follow."
        accent="from-fuchsia-500/30 to-rose-500/10"
      />
      <StatCard
        label="Total views"
        value={formatNumber(stats.user.view_count)}
        helper="Lifetime channel views."
        accent="from-sky-500/30 to-cyan-500/10"
      />
      <StatCard
        label="Live viewers"
        value={
          stats.stream ? formatNumber(stats.stream.viewer_count) : "Offline"
        }
        helper={
          stats.stream
            ? "People tuned in right now."
            : "Go live to light this up."
        }
        accent="from-emerald-500/25 to-lime-500/5"
      />
      <StatCard
        label="Uptime"
        value={stats.stream && liveDuration ? formatDuration(liveDuration) : "—"}
        helper={
          stats.stream
            ? `Started ${formatAbsolute(stats.stream.started_at)}`
            : "No active broadcast."
        }
        accent="from-amber-500/25 to-orange-500/10"
      />
    </div>
  );
}

function LivePanel({ stats }: { stats: TwitchStatsSuccess }) {
  const stream = stats.stream;
  const liveDuration = stream ? computeDurationMinutes(stream.started_at) : null;

  return (
    <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-[#12031f] via-[#07010c] to-[#040106] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.45)]">
      <p className="text-xs uppercase tracking-[0.4em] text-white/60">
        Live status
      </p>

      {stream ? (
        <>
          <p className="mt-4 text-2xl font-semibold leading-tight">
            {stream.title || "Live on Twitch"}
          </p>
          <p className="mt-2 text-sm text-white/60">
            {stream.game_name || "Playing something new"}
          </p>
          <div className="mt-5 flex flex-wrap gap-4 text-sm text-white/80">
            <span className="inline-flex items-center gap-2">
              <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
              {formatNumber(stream.viewer_count)} watching
            </span>
            {liveDuration ? (
              <span>{formatDuration(liveDuration)} live</span>
            ) : null}
          </div>
          {stream.tags && stream.tags.length > 0 ? (
            <div className="mt-5 flex flex-wrap gap-2">
              {stream.tags.slice(0, 5).map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-white/10 px-3 py-1 text-xs uppercase tracking-wide text-white/70"
                >
                  {tag}
                </span>
              ))}
            </div>
          ) : null}
        </>
      ) : (
        <div className="mt-4 space-y-3 text-white/70">
          <p className="text-xl font-semibold">Currently offline</p>
          <p className="text-sm">
            The next live session will appear here the moment you press “Start
            Streaming”.
          </p>
          <div className="flex flex-wrap gap-2 text-xs uppercase text-white/50">
            <span className="rounded-full border border-white/10 px-3 py-1">
              Category: {stats.channel?.game_name ?? "Variety"}
            </span>
            <span className="rounded-full border border-white/10 px-3 py-1">
              Language:{" "}
              {(stats.channel?.broadcaster_language || "en").toUpperCase()}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

function InsightsPanel({ stats }: { stats: TwitchStatsSuccess }) {
  const insights = [
    {
      label: "Account age",
      value: formatAccountAge(stats.user.created_at) ?? "—",
      description: `Created ${formatAbsolute(stats.user.created_at)}`,
    },
    {
      label: "Primary language",
      value: (stats.channel?.broadcaster_language || "en").toUpperCase(),
      description: "Managed inside Twitch Creator Dashboard.",
    },
    {
      label: "Current category",
      value: stats.stream?.game_name ?? stats.channel?.game_name ?? "Variety",
      description: stats.stream
        ? "Live right now."
        : "Last configured category.",
    },
    {
      label: "Channel title",
      value: stats.channel?.title ?? "Untitled stream",
      description: "Update titles before you go live to set expectations.",
    },
  ];

  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-[0_25px_70px_rgba(0,0,0,0.35)]">
      <p className="text-xs uppercase tracking-[0.4em] text-white/60">
        Channel insights
      </p>
      <div className="mt-6 grid gap-5 md:grid-cols-2">
        {insights.map((insight) => (
          <div
            key={insight.label}
            className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/10 to-transparent p-4"
          >
            <p className="text-xs uppercase tracking-[0.3em] text-white/50">
              {insight.label}
            </p>
            <p className="mt-2 text-lg font-semibold leading-snug text-white">
              {insight.value}
            </p>
            <p className="mt-1 text-xs text-white/60">{insight.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function SchedulePanel({
  segments,
}: {
  segments: TwitchScheduleSegment[];
}) {
  const upcoming = filterUpcomingSegments(segments).slice(0, 3);
  const fallback = segments.slice(0, 3);
  const entries = upcoming.length ? upcoming : fallback;

  return (
    <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-white/10 via-transparent to-transparent p-6 shadow-[0_25px_70px_rgba(0,0,0,0.35)]">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.4em] text-white/60">
            Schedule
          </p>
          <p className="text-2xl font-semibold text-white">What&apos;s next</p>
        </div>
        <span className="text-xs text-white/50">
          {segments.length ? `${segments.length} planned` : "No entries yet"}
        </span>
      </div>

      <div className="mt-6 space-y-4">
        {entries.length ? (
          entries.map((segment) => {
            const descriptor = describeSegment(segment);
            return (
              <div
                key={segment.id}
                className="rounded-2xl border border-white/10 bg-white/5 p-4"
              >
                <p className="text-xs uppercase tracking-[0.3em] text-fuchsia-200/90">
                  {segment.category?.name ?? "Variety"}
                </p>
                <p className="mt-1 text-lg font-semibold text-white">
                  {segment.title || "Untitled block"}
                </p>
                <p className="text-sm text-white/60">
                  {descriptor ?? "Time to be announced"}
                </p>
                {segment.is_recurring ? (
                  <span className="mt-2 inline-block rounded-full bg-white/10 px-3 py-1 text-xs uppercase tracking-[0.2em] text-white/70">
                    Recurring slot
                  </span>
                ) : null}
              </div>
            );
          })
        ) : (
          <p className="text-sm text-white/60">
            Nothing scheduled yet. Set up recurring segments inside the Twitch
            Creator Dashboard to see them here.
          </p>
        )}
      </div>
    </div>
  );
}

function ErrorState({ status }: { status: TwitchStatsError }) {
  const isEnvMissing = status.reason === "missing_env";

  return (
    <div className="rounded-3xl border border-rose-500/30 bg-rose-500/5 p-10 shadow-[0_25px_60px_rgba(124,29,74,0.35)]">
      <p className="text-sm uppercase tracking-[0.3em] text-rose-200/90">
        Heads up
      </p>
      <p className="mt-3 text-3xl font-semibold text-white">
        We couldn&apos;t reach Twitch right now.
      </p>
      <p className="mt-2 text-white/70">
        {isEnvMissing
          ? "Add your Twitch credentials to the .env file so the dashboard can authenticate."
          : status.details ?? "Try again in a minute."}
      </p>

      {isEnvMissing ? (
        <div className="mt-6 rounded-2xl border border-white/10 bg-black/40 p-5 font-mono text-sm text-white/80">
          <p>TWITCH_CLIENT_ID=</p>
          <p>TWITCH_CLIENT_SECRET=</p>
          <p>{`TWITCH_CHANNEL_LOGIN=${TWITCH_HANDLE}`}</p>
          <p className="mt-3 text-xs text-white/50">
            Generate a Client ID + Secret from dev.twitch.tv and restart the
            dev server.
          </p>
        </div>
      ) : null}
    </div>
  );
}

function StatCard({
  label,
  value,
  helper,
  accent = "from-fuchsia-500/20 to-indigo-500/5",
}: {
  label: string;
  value: ReactNode;
  helper?: string;
  accent?: string;
}) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-6 shadow-[0_20px_50px_rgba(0,0,0,0.35)]">
      <div
        className={cn(
          "pointer-events-none absolute inset-0 bg-gradient-to-br opacity-0 transition-opacity duration-500 group-hover:opacity-100",
          accent,
        )}
      />
      <div className="relative">
        <p className="text-xs uppercase tracking-[0.4em] text-white/60">
          {label}
        </p>
        <p className="mt-3 text-3xl font-semibold">{value}</p>
        {helper ? (
          <p className="mt-2 text-sm text-white/60">{helper}</p>
        ) : null}
      </div>
    </div>
  );
}

function StatusBadge({ stream }: { stream: TwitchStream | null }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em]",
        stream
          ? "bg-green-500/20 text-green-200"
          : "bg-white/10 text-white/70",
      )}
    >
      <span
        className={cn(
          "h-2 w-2 rounded-full",
          stream ? "bg-green-400 animate-pulse" : "bg-white/50",
        )}
      />
      {stream ? "Live" : "Offline"}
    </span>
  );
}

async function getTwitchStats(): Promise<TwitchStatsResult> {
  const clientId = process.env.TWITCH_CLIENT_ID;
  const clientSecret = process.env.TWITCH_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return {
      ok: false,
      username: TWITCH_HANDLE,
      reason: "missing_env",
      details:
        "Missing TWITCH_CLIENT_ID or TWITCH_CLIENT_SECRET. Add them to your environment.",
    };
  }

  try {
    const token = await fetchAppToken(clientId, clientSecret);
    const userPayload = await fetchHelix<TwitchUsersResponse>(
      `${TWITCH_API_BASE}/users?login=${encodeURIComponent(TWITCH_HANDLE)}`,
      token,
      clientId,
    );

    const user = userPayload?.data?.[0];
    if (!user) {
      return {
        ok: false,
        username: TWITCH_HANDLE,
        reason: "user_not_found",
        details: "Twitch user not found. Double-check TWITCH_CHANNEL_LOGIN.",
      };
    }

    const userId = user.id;
    const [channelRes, streamRes, followerRes, scheduleRes] =
      await Promise.all([
        fetchHelix<TwitchChannelResponse>(
          `${TWITCH_API_BASE}/channels?broadcaster_id=${userId}`,
          token,
          clientId,
        ),
        fetchHelix<TwitchStreamResponse>(
          `${TWITCH_API_BASE}/streams?user_id=${userId}`,
          token,
          clientId,
        ),
        fetchHelix<TwitchFollowersResponse>(
          `${TWITCH_API_BASE}/channels/followers?broadcaster_id=${userId}`,
          token,
          clientId,
        ),
        fetchHelix<TwitchScheduleResponse>(
          `${TWITCH_API_BASE}/schedule?broadcaster_id=${userId}`,
          token,
          clientId,
          { allow404: true },
        ),
      ]);

    return {
      ok: true,
      username: user.login,
      user,
      channel: channelRes?.data?.[0] ?? null,
      stream: streamRes?.data?.[0] ?? null,
      followers: followerRes?.total ?? null,
      schedule: scheduleRes?.data?.segments ?? [],
    };
  } catch (error) {
    console.error("[twitch-page]", error);
    return {
      ok: false,
      username: TWITCH_HANDLE,
      reason: "fetch_failed",
      details:
        error instanceof Error ? error.message : "Unexpected Twitch API error.",
    };
  }
}

async function fetchAppToken(clientId: string, clientSecret: string) {
  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: "client_credentials",
  });

  const response = await fetch("https://id.twitch.tv/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Token request failed (${response.status})`);
  }

  const data = (await response.json()) as TwitchTokenResponse;
  return data.access_token;
}

async function fetchHelix<T>(
  url: string,
  token: string,
  clientId: string,
  options?: { allow404?: boolean },
): Promise<T | null> {
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Client-Id": clientId,
    },
    cache: "no-store",
  });

  if (response.status === 404 && options?.allow404) {
    return null;
  }

  if (!response.ok) {
    throw new Error(`Twitch API error (${response.status}) for ${url}`);
  }

  return (await response.json()) as T;
}

function formatNumber(value?: number | null) {
  if (value === null || value === undefined) {
    return "—";
  }
  return new Intl.NumberFormat("en-US").format(value);
}

function computeDurationMinutes(ts: string) {
  const start = new Date(ts);
  if (Number.isNaN(start.getTime())) {
    return null;
  }
  return Math.max(1, Math.floor((Date.now() - start.getTime()) / 60000));
}

function formatDuration(minutes: number) {
  if (!Number.isFinite(minutes)) return "—";
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) {
    return `${mins}m`;
  }
  return mins ? `${hours}h ${mins}m` : `${hours}h`;
}

function formatAbsolute(value?: string) {
  if (!value) return "N/A";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "N/A";
  }
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "numeric",
  }).format(date);
}

function formatAccountAge(createdAt?: string) {
  if (!createdAt) return null;
  const created = new Date(createdAt);
  if (Number.isNaN(created.getTime())) {
    return null;
  }

  const diff = Date.now() - created.getTime();
  const years = Math.floor(diff / (1000 * 60 * 60 * 24 * 365));
  const months = Math.floor(
    (diff % (1000 * 60 * 60 * 24 * 365)) / (1000 * 60 * 60 * 24 * 30),
  );

  if (years <= 0) {
    return `${Math.max(1, months)}mo old`;
  }

  return months ? `${years}y ${months}mo` : `${years}y`;
}

function describeSegment(segment: TwitchScheduleSegment) {
  const start = safeDate(segment.start_time);
  const end = segment.end_time ? safeDate(segment.end_time) : null;

  if (!start) return null;

  const day = new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(start);

  const time = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "numeric",
  }).format(start);

  const endLabel = end
    ? new Intl.DateTimeFormat("en-US", {
        hour: "numeric",
        minute: "numeric",
      }).format(end)
    : null;

  return endLabel ? `${day} · ${time} – ${endLabel}` : `${day} · ${time}`;
}

function safeDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date;
}

function filterUpcomingSegments(segments: TwitchScheduleSegment[]) {
  const now = Date.now();
  return segments.filter((segment) => {
    const start = new Date(segment.start_time).getTime();
    return Number.isFinite(start) && start >= now;
  });
}

