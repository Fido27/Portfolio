"use client";

import type { Country } from "../hooks/useCountries";

type CountryDetailProps = {
	country: Country | null;
	onClose: () => void;
};

function formatNumber(value: string | number | undefined): string {
	if (value == null || value === "") return "—";
	const num = typeof value === "string" ? parseFloat(value) : value;
	if (isNaN(num)) return "—";
	return num.toLocaleString();
}

function IndexChart({ data, label, colorClass }: { data: Record<string, number>; label: string; colorClass: string }) {
	const years = Object.keys(data).sort();
	const values = years.map((y) => data[y]);
	const max = Math.max(...values);
	const min = Math.min(...values);
	const range = max - min || 1;

	return (
		<div className="space-y-2">
			<h4 className="font-medium text-sm">{label}</h4>
			<div className="flex items-end gap-1 h-24">
				{years.map((year, i) => {
					const value = data[year];
					const height = ((value - min) / range) * 100;
					return (
						<div
							key={year}
							className="flex-1 flex flex-col items-center group"
							title={`${year}: ${value.toFixed(3)}`}
						>
							<div
								className={`w-full rounded-t ${colorClass} transition-all group-hover:opacity-80`}
								style={{ height: `${Math.max(height, 5)}%` }}
							/>
							{i % 4 === 0 && (
								<span className="text-[10px] text-base-content/50 mt-1">{year.slice(-2)}</span>
							)}
						</div>
					);
				})}
			</div>
			<div className="flex justify-between text-xs text-base-content/50">
				<span>Latest: {values[values.length - 1]?.toFixed(3) || "—"}</span>
				<span>
					{values.length > 1 && (
						<>
							{values[values.length - 1] > values[0] ? "↑" : "↓"}
							{Math.abs(values[values.length - 1] - values[0]).toFixed(3)}
						</>
					)}
				</span>
			</div>
		</div>
	);
}

function TagList({ tags, label }: { tags?: string[]; label: string }) {
	if (!tags || tags.length === 0) return null;
	return (
		<div className="space-y-1">
			<span className="text-xs text-base-content/50">{label}</span>
			<div className="flex flex-wrap gap-1">
				{tags.map((tag) => (
					<span key={tag} className="badge badge-sm badge-outline">
						{tag.replace(/_/g, " ")}
					</span>
				))}
			</div>
		</div>
	);
}

export default function CountryDetail({ country, onClose }: CountryDetailProps) {
	if (!country) return null;

	const indices = country.indices || {};
	const hasIndices = Object.keys(indices).some((k) => indices[k] && Object.keys(indices[k]!).length > 0);

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
			{/* Backdrop */}
			<div className="absolute inset-0 bg-black/50" />

			{/* Modal */}
			<div
				className="relative bg-base-100 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col"
				onClick={(e) => e.stopPropagation()}
			>
				{/* Header */}
				<div className="flex items-center gap-4 p-6 border-b border-base-200 bg-base-200">
					<span className="text-5xl">{country.flag_emoji || "🏳️"}</span>
					<div className="flex-1">
						<h2 className="text-2xl font-bold">{country.name}</h2>
						<p className="text-base-content/60">{country.official_name}</p>
						<div className="flex gap-2 mt-2">
							<span className="badge badge-primary">{country.iso3}</span>
							<span className="badge badge-ghost">{country.region}</span>
							{country.subregion && <span className="badge badge-ghost badge-sm">{country.subregion}</span>}
						</div>
					</div>
					<button className="btn btn-sm btn-circle btn-ghost" onClick={onClose}>
						✕
					</button>
				</div>

				{/* Content */}
				<div className="flex-1 overflow-y-auto p-6 space-y-6">
					{/* Basic Info Grid */}
					<div className="grid grid-cols-2 md:grid-cols-3 gap-4">
						<div>
							<span className="text-xs text-base-content/50">Capital</span>
							<p className="font-medium">{country.capital || "—"}</p>
						</div>
						<div>
							<span className="text-xs text-base-content/50">Population</span>
							<p className="font-medium">{formatNumber(country.population)}</p>
						</div>
						<div>
							<span className="text-xs text-base-content/50">Area</span>
							<p className="font-medium">{formatNumber(country.area_km2)} km²</p>
						</div>
						<div>
							<span className="text-xs text-base-content/50">Currency</span>
							<p className="font-medium">
								{country.currency} {country.currency_name && `(${country.currency_name})`}
							</p>
						</div>
						<div>
							<span className="text-xs text-base-content/50">Timezone</span>
							<p className="font-medium">{country.timezone || "—"}</p>
						</div>
						<div>
							<span className="text-xs text-base-content/50">National Language</span>
							<p className="font-medium">{country.national_language || "—"}</p>
						</div>
					</div>

					{/* Coordinates */}
					{(country.latitude != null || country.longitude != null) && (
						<div className="flex gap-4">
							<div>
								<span className="text-xs text-base-content/50">Latitude</span>
								<p className="font-mono">{country.latitude?.toFixed(4) || "—"}</p>
							</div>
							<div>
								<span className="text-xs text-base-content/50">Longitude</span>
								<p className="font-mono">{country.longitude?.toFixed(4) || "—"}</p>
							</div>
						</div>
					)}

					{/* Cultural Info */}
					{(country.famous_food || country.national_sport || country.famous_people) && (
						<div className="space-y-3">
							<h3 className="font-semibold text-lg">Cultural Info</h3>
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								{country.famous_food && (
									<div>
										<span className="text-xs text-base-content/50">Famous Food</span>
										<p className="text-sm">{country.famous_food}</p>
									</div>
								)}
								{country.national_sport && (
									<div>
										<span className="text-xs text-base-content/50">National Sport</span>
										<p className="text-sm">{country.national_sport}</p>
									</div>
								)}
								{country.famous_people && (
									<div className="col-span-full">
										<span className="text-xs text-base-content/50">Famous People</span>
										<p className="text-sm">{country.famous_people}</p>
									</div>
								)}
							</div>
						</div>
					)}

					{/* Tags */}
					<div className="space-y-3">
						<h3 className="font-semibold text-lg">Classifications</h3>
						<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
							<TagList tags={country.languages} label="Languages" />
							<TagList tags={country.climate_tags} label="Climate" />
							<TagList tags={country.feature_tags} label="Geographic Features" />
							<TagList tags={country.size_tags} label="Size Classification" />
							<TagList tags={country.religion_tags} label="Religion" />
							<TagList tags={country.border_countries} label="Borders" />
						</div>
					</div>

					{/* Indices */}
					{hasIndices && (
						<div className="space-y-4">
							<h3 className="font-semibold text-lg">Global Indices (Time Series)</h3>
							<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
								{indices.peace && Object.keys(indices.peace).length > 0 && (
									<div className="p-4 bg-base-200 rounded-lg">
										<IndexChart
											data={indices.peace}
											label="Global Peace Index"
											colorClass="bg-success"
										/>
									</div>
								)}
								{indices.happiness && Object.keys(indices.happiness).length > 0 && (
									<div className="p-4 bg-base-200 rounded-lg">
										<IndexChart
											data={indices.happiness}
											label="World Happiness Index"
											colorClass="bg-info"
										/>
									</div>
								)}
								{indices.hdi && Object.keys(indices.hdi).length > 0 && (
									<div className="p-4 bg-base-200 rounded-lg">
										<IndexChart
											data={indices.hdi}
											label="Human Development Index"
											colorClass="bg-warning"
										/>
									</div>
								)}
								{indices.democracy && Object.keys(indices.democracy).length > 0 && (
									<div className="p-4 bg-base-200 rounded-lg">
										<IndexChart
											data={indices.democracy}
											label="Democracy Index"
											colorClass="bg-primary"
										/>
									</div>
								)}
							</div>
						</div>
					)}

					{/* Data source */}
					{country.data_source && (
						<div className="text-xs text-base-content/40 pt-4 border-t border-base-200">
							Data source: {country.data_source}
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
