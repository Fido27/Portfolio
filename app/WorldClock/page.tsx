"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type CountryDoc = {
	$id: string;
	code?: string;
	name?: string;
	population?: number;
	capital?: string;
	area_km2?: number;
	gdp_usd?: number;
	flag_url?: string;
};

type ListResponse = { total: number; items: CountryDoc[] };

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

export default function Page() {
	const [countries, setCountries] = useState<CountryDoc[] | null>(null);
	const [error, setError] = useState<string | null>(null);

	const columns = useMemo(
		() => [
			{ key: "name" as const, label: "Name", render: (c: CountryDoc) => c.name ?? "—" },
			{ key: "population" as const, label: "Population", render: (c: CountryDoc) => formatNumber(c.population) },
			{ key: "capital" as const, label: "Capital", render: (c: CountryDoc) => c.capital ?? "—" },
			{ key: "area_km2" as const, label: "Size (km²)", render: (c: CountryDoc) => formatNumber(c.area_km2) },
			{ key: "gdp_usd" as const, label: "GDP", render: (c: CountryDoc) => formatCurrency(c.gdp_usd) },
		],
		[]
	);

	// vertically synchronize scroll across columns
	const bodyRefs = useRef<Array<HTMLDivElement | null>>([]);
	const syncingRef = useRef(false);

	function handleSyncScroll(sourceIndex: number, top: number) {
		if (syncingRef.current) return;
		syncingRef.current = true;
		for (let i = 0; i < bodyRefs.current.length; i += 1) {
			const el = bodyRefs.current[i];
			if (!el || i === sourceIndex) continue;
			el.scrollTop = top;
		}
		requestAnimationFrame(() => {
			syncingRef.current = false;
		});
	}

	useEffect(() => {
		const base = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000";
		const url = `${base}/WorldClock?page=1&pageSize=200&sort=name:asc`;
		fetch(url, { cache: "no-store" })
			.then(async (r) => {
				if (!r.ok) throw new Error(`Request failed ${r.status}`);
				return (await r.json()) as ListResponse;
			})
			.then((data) => setCountries(data.items))
			.catch((e) => setError(String(e)));
	}, []);

	const rowBase = "h-20 md:h-24 flex items-center my-3 px-5 md:px-8 text-lg md:text-xl bg-base-200/20 hover:bg-base-200/30 transition-colors shadow-sm backdrop-blur";

	return (
		<main className="p-0 md:p-2 text-lg md:text-xl">
			{error ? (
				<div className="p-6 text-error">{error}</div>
			) : countries == null ? (
				<div className="p-6 opacity-60">Loading…</div>
			) : (
				<div className="h-[85vh] overflow-hidden rounded-2xl">
					{/* Horizontal scroll with snap */}
					<div className="h-full overflow-x-auto snap-x snap-mandatory">
						<div className="flex h-full w-max gap-2 px-2">
							{columns.map((col, colIndex) => {
								const isFirst = colIndex === 0;
								const isLast = colIndex === columns.length - 1;
								return (
									<div key={col.key} className="snap-center w-80 md:w-96 shrink-0">
										{/* Column header */}
										<div className="sticky top-0 z-10 py-6 text-center font-semibold text-xl md:text-2xl bg-gradient-to-b from-base-100/90 to-base-100/60 backdrop-blur rounded-t-2xl">
											{col.label}
										</div>
										{/* Column body */}
										<div
											ref={(el) => { bodyRefs.current[colIndex] = el; }}
											onScroll={(e) => handleSyncScroll(colIndex, (e.target as HTMLDivElement).scrollTop)}
											className="h-[calc(100%-5.5rem)] overflow-y-auto px-1"
										>
											{countries.map((c) => (
												<div
													key={c.$id}
													className={`${rowBase} ${isFirst ? "rounded-l-2xl pl-7 md:pl-9" : ""} ${isLast ? "rounded-r-2xl pr-7 md:pr-9" : ""}`}
												>
													<span className="truncate w-full text-center">{col.render(c)}</span>
												</div>
											))}
										</div>
									</div>
								);
							})}
						</div>
					</div>
				</div>
			)}
		</main>
	);
}