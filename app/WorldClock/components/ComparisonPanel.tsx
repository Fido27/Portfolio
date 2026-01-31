"use client";

import type { Country } from "../hooks/useCountries";
import Sparkline from "./Sparkline";

type ComparisonPanelProps = {
	countries: Country[];
	onRemove: (countryId: string) => void;
	onClose: () => void;
};

function formatNumber(value: string | number | undefined): string {
	if (value == null || value === "") return "—";
	const num = typeof value === "string" ? parseFloat(value) : value;
	if (isNaN(num)) return "—";
	return num.toLocaleString();
}

function formatCompact(value: string | number | undefined): string {
	if (value == null || value === "") return "—";
	const num = typeof value === "string" ? parseFloat(value) : value;
	if (isNaN(num)) return "—";
	return Intl.NumberFormat(undefined, { notation: "compact", maximumFractionDigits: 1 }).format(num);
}

function getLatestIndex(indices: Country["indices"], indexName: string): number | null {
	if (!indices?.[indexName]) return null;
	const years = Object.keys(indices[indexName]!).sort().reverse();
	if (years.length === 0) return null;
	return indices[indexName]![years[0]];
}

type ComparisonRowProps = {
	label: string;
	values: (string | number | React.ReactNode)[];
	highlight?: "max" | "min";
};

function ComparisonRow({ label, values, highlight }: ComparisonRowProps) {
	// Find max/min for highlighting
	const numericValues = values.map((v) => (typeof v === "number" ? v : typeof v === "string" ? parseFloat(v) : NaN));
	const validValues = numericValues.filter((v) => !isNaN(v));

	let highlightIndex = -1;
	if (highlight && validValues.length > 1) {
		const targetValue = highlight === "max" ? Math.max(...validValues) : Math.min(...validValues);
		highlightIndex = numericValues.findIndex((v) => v === targetValue);
	}

	return (
		<tr className="border-b border-base-200">
			<td className="py-2 px-3 text-sm text-base-content/60 font-medium">{label}</td>
			{values.map((value, i) => (
				<td
					key={i}
					className={`py-2 px-3 text-sm text-center ${
						highlightIndex === i ? "bg-primary/10 font-semibold" : ""
					}`}
				>
					{typeof value === "number" ? formatNumber(value) : value}
				</td>
			))}
		</tr>
	);
}

export default function ComparisonPanel({ countries, onRemove, onClose }: ComparisonPanelProps) {
	if (countries.length === 0) return null;

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
			{/* Backdrop */}
			<div className="absolute inset-0 bg-black/50" />

			{/* Panel */}
			<div
				className="relative bg-base-100 rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col"
				onClick={(e) => e.stopPropagation()}
			>
				{/* Header */}
				<div className="flex items-center justify-between p-4 border-b border-base-200 bg-base-200">
					<h2 className="text-xl font-bold">Compare Countries ({countries.length})</h2>
					<button className="btn btn-sm btn-circle btn-ghost" onClick={onClose}>
						✕
					</button>
				</div>

				{/* Content */}
				<div className="flex-1 overflow-auto p-4">
					<table className="w-full">
						<thead>
							<tr className="border-b-2 border-base-300">
								<th className="py-3 px-3 text-left text-sm font-semibold w-[140px]">Metric</th>
								{countries.map((country) => (
									<th key={country.$id} className="py-3 px-3 text-center min-w-[150px]">
										<div className="flex flex-col items-center gap-1">
											<span className="text-3xl">{country.flag_emoji || "🏳️"}</span>
											<span className="font-semibold">{country.name}</span>
											<span className="text-xs text-base-content/50">{country.iso3}</span>
											<button
												className="btn btn-xs btn-ghost btn-circle mt-1"
												onClick={() => onRemove(country.$id)}
											>
												✕
											</button>
										</div>
									</th>
								))}
							</tr>
						</thead>
						<tbody>
							{/* Basic Info */}
							<tr className="bg-base-200">
								<td colSpan={countries.length + 1} className="py-2 px-3 font-semibold text-sm">
									Basic Information
								</td>
							</tr>
							<ComparisonRow label="Capital" values={countries.map((c) => c.capital || "—")} />
							<ComparisonRow label="Region" values={countries.map((c) => c.region || "—")} />
							<ComparisonRow label="Subregion" values={countries.map((c) => c.subregion || "—")} />
							<ComparisonRow
								label="Population"
								values={countries.map((c) => formatCompact(c.population))}
								highlight="max"
							/>
							<ComparisonRow
								label="Area (km²)"
								values={countries.map((c) => formatCompact(c.area_km2))}
								highlight="max"
							/>
							<ComparisonRow label="Timezone" values={countries.map((c) => c.timezone || "—")} />

							{/* Economic */}
							<tr className="bg-base-200">
								<td colSpan={countries.length + 1} className="py-2 px-3 font-semibold text-sm">
									Economic
								</td>
							</tr>
							<ComparisonRow
								label="Currency"
								values={countries.map((c) => `${c.currency || "—"} (${c.currency_name || "—"})`)}
							/>
							<ComparisonRow label="Language" values={countries.map((c) => c.national_language || "—")} />

							{/* Indices */}
							<tr className="bg-base-200">
								<td colSpan={countries.length + 1} className="py-2 px-3 font-semibold text-sm">
									Global Indices
								</td>
							</tr>
							<tr className="border-b border-base-200">
								<td className="py-2 px-3 text-sm text-base-content/60 font-medium">Peace Index</td>
								{countries.map((c) => {
									const peaceValue = getLatestIndex(c.indices, "peace");
									return (
										<td key={c.$id} className="py-2 px-3">
											<div className="flex flex-col items-center gap-1">
												{c.indices?.peace ? (
													<>
														<Sparkline
															data={c.indices.peace}
															color="#22c55e"
															width={80}
															height={32}
															invertColors
														/>
													</>
												) : (
													<span className="text-base-content/40">—</span>
												)}
											</div>
										</td>
									);
								})}
							</tr>
							<tr className="border-b border-base-200">
								<td className="py-2 px-3 text-sm text-base-content/60 font-medium">Happiness Index</td>
								{countries.map((c) => (
									<td key={c.$id} className="py-2 px-3">
										<div className="flex flex-col items-center gap-1">
											{c.indices?.happiness ? (
												<Sparkline data={c.indices.happiness} color="#3b82f6" width={80} height={32} />
											) : (
												<span className="text-base-content/40">—</span>
											)}
										</div>
									</td>
								))}
							</tr>

							{/* Features */}
							<tr className="bg-base-200">
								<td colSpan={countries.length + 1} className="py-2 px-3 font-semibold text-sm">
									Classifications
								</td>
							</tr>
							<ComparisonRow
								label="Climate"
								values={countries.map((c) =>
									c.climate_tags?.length ? c.climate_tags.join(", ") : "—"
								)}
							/>
							<ComparisonRow
								label="Features"
								values={countries.map((c) =>
									c.feature_tags?.length ? c.feature_tags.map((t) => t.replace(/_/g, " ")).join(", ") : "—"
								)}
							/>
							<ComparisonRow
								label="Borders"
								values={countries.map((c) =>
									c.border_countries?.length ? `${c.border_countries.length} countries` : "None (island)"
								)}
							/>
						</tbody>
					</table>
				</div>

				{/* Footer */}
				<div className="flex items-center justify-end gap-2 p-4 border-t border-base-200 bg-base-200">
					<button className="btn btn-ghost" onClick={onClose}>
						Close
					</button>
				</div>
			</div>
		</div>
	);
}
