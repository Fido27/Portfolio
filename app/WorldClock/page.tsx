"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

// ---------- Types ----------

type CountryDoc = {
	$id: string;
	code?: string;
	name?: string;
	population?: number;
	capital?: string;
	area_km2?: number;
	gdp_usd?: number;
	flag_id?: string;
	timezone?: string; // e.g., "Asia/Kolkata"
	utc_offset_min?: number; // fallback minutes offset
	weather_summary?: string; // e.g., "Sunny"
};

type ListResponse = { total: number; items: CountryDoc[] };

type ColumnKey =
	| "fav"
	| "flag"
	| "name"
	| "time"
	| "weather"
	| "population"
	| "area_km2"
	| "gdp_usd";

type ColumnDef = {
	key: ColumnKey;
	label: string;
	group?: string; // for logical grouping/pinning
	render: (c: CountryDoc, ctx: RenderCtx) => React.ReactNode;
	measureText: (c: CountryDoc, ctx: RenderCtx) => string; // used to size column
	sortable?: boolean;
	wrapTitle?: boolean; // allow header wrap
};

type RenderCtx = {
	numberFmt: Intl.NumberFormat;
	currencyFmt: Intl.NumberFormat;
	timeFmt: Intl.DateTimeFormat;
	timeFmt24: Intl.DateTimeFormat;
	use24h: boolean;
	// row interactions
	pinnedCountryIds?: Set<string>;
	togglePin?: (id: string) => void;
};

// ---------- Utils ----------

function formatNumber(value: number | undefined) {
	if (value == null) return "—";
	try {
		return value.toLocaleString();
	} catch {
		return String(value);
	}
}

function formatCurrency(value: number | undefined) {
	if (value == null) return "—";
	try {
		return new Intl.NumberFormat(undefined, { style: "currency", currency: "USD", notation: "compact", maximumFractionDigits: 1 }).format(value);
	} catch {
		return `$${formatNumber(value)}`;
	}
}

function getApiBase(): string {
	return "http://localhost:3000";
}

function nowUtcMs() {
	return Date.now();
}

function getTimeForCountry(c: CountryDoc): Date | null {
	// Prefer timezone; fallback to utc_offset_min
	try {
		if (c.timezone) return new Date(nowUtcMs()); // Intl will format with timeZone option
		if (typeof c.utc_offset_min === "number") {
			const offsetMs = c.utc_offset_min * 60 * 1000;
			return new Date(nowUtcMs() + offsetMs);
		}
		return null;
	} catch {
		return null;
	}
}

// Measure text widths with a hidden canvas
function measureTextWidth(text: string, font: string, ctx2d: CanvasRenderingContext2D): number {
	ctx2d.font = font;
	return Math.ceil(ctx2d.measureText(text || "").width);
}

function useColumnWidths(columns: ColumnDef[], rows: CountryDoc[], baseFontPx = 20) {
	const [widths, setWidths] = useState<Record<ColumnKey, number>>({} as Record<ColumnKey, number>);
	useLayoutEffect(() => {
		if (!rows || rows.length === 0) return;
		const canvas = document.createElement("canvas");
		const ctx = canvas.getContext("2d");
		if (!ctx) return;
		const font = `${baseFontPx}px ui-sans-serif, system-ui, -apple-system`;
		const next: Record<ColumnKey, number> = {} as any;
		for (const col of columns) {
			// Include header label and a sample of cell strings
			const samples: string[] = [col.label];
			for (let i = 0; i < rows.length; i += Math.ceil(rows.length / 20) || 1) {
				samples.push(col.measureText(rows[i], defaultRenderCtx(false)));
			}
			const maxText = Math.max(...samples.map((s) => measureTextWidth(s, font, ctx)));
			const padding = 40; // px padding around longest
			const minW = 120;
			const maxW = 460;
			next[col.key] = Math.min(Math.max(maxText + padding, minW), maxW);
		}
		setWidths(next);
	}, [columns, rows, baseFontPx]);
	return widths;
}

// ---------- Hooks ----------

function useSyncedVerticalScroll() {
	const bodyRefs = useRef<Array<HTMLDivElement | null>>([]);
	const syncingRef = useRef(false);
	const [sharedTop, setSharedTop] = useState(0);

	function handleSyncScroll(sourceIndex: number, top: number) {
		if (syncingRef.current) return;
		syncingRef.current = true;
		setSharedTop(top);
		for (let i = 0; i < bodyRefs.current.length; i += 1) {
			const el = bodyRefs.current[i];
			if (!el || i === sourceIndex) continue;
			el.scrollTop = top;
		}
		requestAnimationFrame(() => {
			syncingRef.current = false;
		});
	}

	return { bodyRefs, handleSyncScroll, sharedTop } as const;
}

function defaultRenderCtx(use24h: boolean): RenderCtx {
	return {
		numberFmt: new Intl.NumberFormat(),
		currencyFmt: new Intl.NumberFormat(undefined, { style: "currency", currency: "USD", notation: "compact", maximumFractionDigits: 1 }),
		timeFmt: new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit", hour12: true }),
		timeFmt24: new Intl.DateTimeFormat(undefined, { hour: "2-digit", minute: "2-digit", hour12: false }),
		use24h,
	};
}

// ---------- Subcomponents ----------

function Column({
	col,
	index,
	isSticky,
	stickySide,
	stickyOffset,
	width,
	rows,
	rowClass,
	onHeaderClick,
	sync,
	ctx,
	headerExtra,
}: {
	col: ColumnDef;
	index: number;
	isSticky: boolean;
	stickySide?: "left" | "right";
	stickyOffset?: number;
	width: number | undefined;
	rows: CountryDoc[];
	rowClass: string;
	onHeaderClick?: () => void;
	sync: { bodyRefs: React.MutableRefObject<Array<HTMLDivElement | null>>; handleSyncScroll: (i: number, top: number) => void };
	ctx: RenderCtx;
	headerExtra?: React.ReactNode;
}) {
	const stickyStyle = isSticky
		? stickySide === "right"
			? { right: stickyOffset ?? 0 }
			: { left: stickyOffset ?? 0 }
		: undefined;
	return (
		<div
			className={`${isSticky ? "sticky z-30 bg-base-100/90 backdrop-blur" : "snap-center"}`}
			style={{ width, minWidth: width, ...(stickyStyle as any) }}
		>
			<div
				className={`sticky top-0 z-10 py-5 text-center font-semibold text-xl md:text-2xl bg-base-100/90 backdrop-blur border-b border-base-300/60 ${col.sortable ? "cursor-pointer select-none hover:bg-base-100/70" : ""}`}
				onClick={col.sortable ? onHeaderClick : undefined}
			>
				{col.label}
				{headerExtra}
			</div>
			<div
				ref={(el) => { sync.bodyRefs.current[index] = el; }}
				onScroll={(e) => sync.handleSyncScroll(index, (e.target as HTMLDivElement).scrollTop)}
				className={`h-[calc(100%-4.25rem)] overflow-y-auto ${isSticky ? "bg-base-100/80 backdrop-blur" : ""}`}
			>
				{rows.map((c) => (
					<div key={c.$id} className={rowClass}>
						<span className="truncate w-full text-center">{col.render(c, ctx)}</span>
					</div>
				))}
			</div>
		</div>
	);
}

function RowBackgroundOverlay({ count, rowHeight, top }: { count: number; rowHeight: number; top: number }) {
	return (
		<div className="pointer-events-none absolute inset-0" style={{ paddingTop: "4.25rem" }}>
			<div style={{ transform: `translateY(${-top}px)` }}>
				{Array.from({ length: count }).map((_, i) => (
					<div key={i} className="worldclock-row-bg w-full" style={{ height: rowHeight }} />
				))}
			</div>
		</div>
	);
}

// ---------- Page ----------

export default function Page() {
	const [countries, setCountries] = useState<CountryDoc[] | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [sortKey, setSortKey] = useState<"name" | "population" | "time">("name");
	const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
	const [use24h, setUse24h] = useState(false);
	const [scrollSide, setScrollSide] = useState<"left" | "right">("left");
	const [focusKey, setFocusKey] = useState<ColumnKey | null>(null);
	const [pinnedCountryIds, setPinnedCountryIds] = useState<Set<string>>(new Set());
	const [autoPinnedKeys, setAutoPinnedKeys] = useState<Set<ColumnKey>>(new Set());

	const ctxBase = useMemo(() => defaultRenderCtx(use24h), [use24h]);
	const ctx: RenderCtx = useMemo(() => ({
		...ctxBase,
		pinnedCountryIds,
		togglePin: (id: string) => setPinnedCountryIds((prev) => {
			const next = new Set(prev);
			next.has(id) ? next.delete(id) : next.add(id);
			return next;
		}),
	}), [ctxBase, pinnedCountryIds]);

	// Column model
	const columns: ColumnDef[] = useMemo(
		() => [
			{
				key: "fav",
				label: "",
				group: "meta",
				render: (c, rctx) => (
					<button className="text-xl" onClick={(e) => { e.stopPropagation(); rctx.togglePin?.(c.$id); }}>
						{rctx.pinnedCountryIds?.has(c.$id) ? "♥" : "♡"}
					</button>
				),
				measureText: () => "♥",
			},
			{
				key: "flag",
				label: "Flag",
				group: "meta",
				render: (c) => (c.flag_id ? "🖼️" : "—"),
				measureText: (c) => (c.flag_id ? "image" : "-"),
			},
			{
				key: "name",
				label: "Name",
				group: "identity",
				render: (c) => c.name ?? "—",
				measureText: (c) => c.name ?? "-",
			},
			{
				key: "time",
				label: "Time",
				group: "time-weather",
				sortable: true,
				render: (c, rctx) => {
					const t = getTimeForCountry(c);
					if (!t) return "-";
					return rctx.use24h ? rctx.timeFmt24.format(t) : rctx.timeFmt.format(t);
				},
				measureText: (c) => {
					const t = getTimeForCountry(c);
					return t ? new Intl.DateTimeFormat(undefined, { hour: "2-digit", minute: "2-digit" }).format(t) : "-";
				},
			},
			{
				key: "weather",
				label: "Weather",
				group: "time-weather",
				render: (c) => c.weather_summary ?? "-",
				measureText: (c) => c.weather_summary ?? "-",
			},
			{
				key: "population",
				label: "Population",
				group: "demography",
				sortable: true,
				render: (c) => formatNumber(c.population),
				measureText: (c) => String(c.population ?? "-"),
			},
			{
				key: "area_km2",
				label: "Size (km²)",
				group: "geography",
				render: (c) => formatNumber(c.area_km2),
				measureText: (c) => String(c.area_km2 ?? "-"),
			},
			{
				key: "gdp_usd",
				label: "GDP",
				group: "economy",
				render: (c) => formatCurrency(c.gdp_usd),
				measureText: (c) => String(c.gdp_usd ?? "-"),
			},
		],
		[ctxBase, pinnedCountryIds]
	);

	// Dynamic widths
	const widths = useColumnWidths(columns, countries ?? [], 22);

	// Horizontal scroll/focus handling
	const hScrollRef = useRef<HTMLDivElement | null>(null);
	const lastScrollLeft = useRef(0);
	const basePinnedKeys: ColumnKey[] = ["fav", "flag", "name"]; // always pinned
	const autoPinGroups = ["economy"] as const; // example autopin group

	// precompute cumulative x-positions for columns (in order)
	const colStarts = useMemo(() => {
		const arr: number[] = [];
		let x = 0;
		for (const col of columns) {
			arr.push(x);
			x += widths[col.key] ?? 200;
		}
		return arr;
	}, [columns, widths]);

	useEffect(() => {
		const el = hScrollRef.current;
		if (!el) return;
		function onScroll() {
			const current = hScrollRef.current;
			if (!current) return;
			const sl = current.scrollLeft;
			setScrollSide(sl > lastScrollLeft.current ? "right" : "left");
			lastScrollLeft.current = sl;
			// focus detection: 25% after pinned width
			const leftPinnedWidth = basePinnedKeys.reduce((acc, k) => acc + (widths[k] ?? 0), 0);
			const viewport = current.clientWidth;
			const targetX = sl + leftPinnedWidth + 0.25 * Math.max(0, viewport - leftPinnedWidth);
			let found: ColumnKey | null = null;
			for (let i = 0; i < columns.length; i += 1) {
				const k = columns[i].key;
				if (basePinnedKeys.includes(k)) continue;
				const start = colStarts[i];
				const w = widths[k] ?? 200;
				if (start + w / 2 >= targetX) { found = k; break; }
			}
			setFocusKey((prev) => (found ?? prev));

			// autopin groups if intersecting viewport
			const viewStart = sl;
			const viewEnd = sl + viewport;
			const nextAuto = new Set<ColumnKey>();
			for (const g of autoPinGroups) {
				let gStart = Infinity; let gEnd = -Infinity;
				const gKeys: ColumnKey[] = [] as any;
				for (let i = 0; i < columns.length; i += 1) {
					if (columns[i].group === g) {
						gStart = Math.min(gStart, colStarts[i]);
						gEnd = Math.max(gEnd, colStarts[i] + (widths[columns[i].key] ?? 200));
						gKeys.push(columns[i].key);
					}
				}
				if (gKeys.length > 0 && gStart < viewEnd && gEnd > viewStart) {
					for (const k of gKeys) nextAuto.add(k);
				}
			}
			setAutoPinnedKeys(nextAuto);
		}
		el.addEventListener("scroll", onScroll, { passive: true });
		return () => el.removeEventListener("scroll", onScroll);
	}, [columns, colStarts, widths, basePinnedKeys]);

	useEffect(() => {
		document.documentElement.style.setProperty("--worldclock-focus", focusKey ?? "");
	}, [focusKey]);

	const sync = useSyncedVerticalScroll();

	useEffect(() => {
		fetch(`/api/worldclock`, { cache: "no-store" })
			.then(async (r) => {
				if (!r.ok) throw new Error(`Request failed ${r.status}`);
				return (await r.json()) as ListResponse;
			})
			.then((data) => setCountries(data.items))
			.catch((e) => setError(String(e)));
	}, []);

	function toggleSort(key: "name" | "population" | "time") {
		if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
		else { setSortKey(key); setSortDir("asc"); }
	}

	// pinned rows first
	const sortedCountries = useMemo(() => {
		if (!countries) return null;
		const arr = [...countries];
		arr.sort((a, b) => {
			let cmp = 0;
			if (sortKey === "population") {
				cmp = (a.population ?? -Infinity) - (b.population ?? -Infinity);
			} else if (sortKey === "time") {
				const ta = getTimeForCountry(a);
				const tb = getTimeForCountry(b);
				if (!ta && !tb) cmp = 0; else if (!ta) cmp = 1; else if (!tb) cmp = -1; else cmp = (ta.getUTCHours()*60+ta.getUTCMinutes()) - (tb.getUTCHours()*60+tb.getUTCMinutes());
			} else {
				const na = a.name ?? ""; const nb = b.name ?? ""; cmp = na.localeCompare(nb);
			}
			return sortDir === "asc" ? cmp : -cmp;
		});
		// move pinned countries to top, preserving relative order
		if (pinnedCountryIds.size > 0) {
			const pinned: CountryDoc[] = [];
			const rest: CountryDoc[] = [];
			for (const c of arr) (pinnedCountryIds.has(c.$id) ? pinned : rest).push(c);
			return [...pinned, ...rest];
		}
		return arr;
	}, [countries, sortKey, sortDir, pinnedCountryIds]);

	// Only horizontal separators; no cell backgrounds or gaps
	const rowClass = "worldclock-row h-20 md:h-24 flex items-center px-6 md:px-8 text-lg md:text-xl border-b border-base-300/50 last:border-b-0";

	// sticky offsets for pinned columns (left and right)
	const pinnedKeys = useMemo(() => {
		const extra = Array.from(autoPinnedKeys);
		return Array.from(new Set<ColumnKey>([...basePinnedKeys, ...extra]));
	}, [autoPinnedKeys]);

	const pinnedOffsetsLeft: Record<ColumnKey, number> = {} as any;
	let accLeft = 0;
	for (const col of columns) {
		if (pinnedKeys.includes(col.key)) { pinnedOffsetsLeft[col.key] = accLeft; accLeft += widths[col.key] ?? 200; }
	}

	const totalPinnedWidth = accLeft;
	const pinnedOffsetsRight: Record<ColumnKey, number> = {} as any;
	let accRight = 0;
	for (let i = columns.length - 1; i >= 0; i -= 1) {
		const k = columns[i].key;
		if (pinnedKeys.includes(k)) { pinnedOffsetsRight[k] = accRight; accRight += widths[k] ?? 200; }
	}

	// estimate row height from CSS (80-96). We'll read the first rendered row later if needed.
	const approxRowHeight = 88;

	return (
		<main className="relative p-0 text-lg md:text-xl">
			{error ? (
				<div className="p-6 text-error">{error}</div>
			) : countries == null ? (
				<div className="p-6 opacity-60">Loading…</div>
			) : (
				<div className="h-[85vh] overflow-hidden relative">
					{/* Background overlay that does not move horizontally */}
					<RowBackgroundOverlay count={(sortedCountries ?? countries).length} rowHeight={approxRowHeight} top={sync.sharedTop} />

					{/* Horizontal scroll with snap */}
					<div ref={hScrollRef} className="h-full overflow-x-auto snap-x snap-mandatory relative">
						<div className="flex h-full w-max gap-0">
							{columns.map((col, idx) => (
								<Column
									key={col.key}
									col={col}
									index={idx}
									isSticky={pinnedKeys.includes(col.key)}
									stickySide={scrollSide === "right" ? "right" : "left"}
									stickyOffset={scrollSide === "right" ? pinnedOffsetsRight[col.key] : pinnedOffsetsLeft[col.key]}
									width={widths[col.key]}
									rows={(sortedCountries ?? countries)}
									rowClass={rowClass}
									onHeaderClick={col.key === "population" ? () => toggleSort("population") : col.key === "time" ? () => toggleSort("time") : undefined}
									sync={sync}
									ctx={ctx}
									headerExtra={col.key === "time" ? (
										<span className="ml-3 text-base md:text-lg opacity-80" onClick={(e) => { e.stopPropagation(); setUse24h((v) => !v); }}>
											{use24h ? "24 hr" : "12 hr"}
										</span>
									) : null}
								/>
							))}
						</div>
					</div>
				</div>
			)}
		</main>
	);
}