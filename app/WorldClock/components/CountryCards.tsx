"use client";

import { useCallback, useRef, useEffect } from "react";
import type { Country } from "../hooks/useCountries";
import Sparkline from "./Sparkline";

type CountryCardsProps = {
	countries: Country[];
	loading: boolean;
	hasMore: boolean;
	onLoadMore: () => void;
	onCountryClick?: (country: Country) => void;
	selectedCountries?: Set<string>;
	onToggleSelect?: (countryId: string) => void;
	comparisonMode?: boolean;
};

function formatCompact(value: string | number | undefined): string {
	if (value == null || value === "") return "—";
	const num = typeof value === "string" ? parseFloat(value) : value;
	if (isNaN(num)) return "—";
	return Intl.NumberFormat(undefined, { notation: "compact", maximumFractionDigits: 1 }).format(num);
}

export default function CountryCards({
	countries,
	loading,
	hasMore,
	onLoadMore,
	onCountryClick,
	selectedCountries,
	onToggleSelect,
	comparisonMode = false,
}: CountryCardsProps) {
	const containerRef = useRef<HTMLDivElement>(null);

	// Infinite scroll
	const handleScroll = useCallback(() => {
		if (!containerRef.current) return;
		const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
		if (scrollTop + clientHeight >= scrollHeight - 200 && hasMore && !loading) {
			onLoadMore();
		}
	}, [hasMore, loading, onLoadMore]);

	useEffect(() => {
		const container = containerRef.current;
		if (container) {
			container.addEventListener("scroll", handleScroll);
			return () => container.removeEventListener("scroll", handleScroll);
		}
	}, [handleScroll]);

	return (
		<div ref={containerRef} className="h-full overflow-y-auto p-4">
			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
				{countries.map((country) => {
					const isSelected = selectedCountries?.has(country.$id);
					return (
						<div
							key={country.$id}
							className={`
								card bg-base-100 shadow-md hover:shadow-lg transition-all cursor-pointer
								border-2 ${isSelected ? "border-primary" : "border-transparent"}
								${comparisonMode ? "hover:border-primary/50" : ""}
							`}
							onClick={() => {
								if (comparisonMode && onToggleSelect) {
									onToggleSelect(country.$id);
								} else {
									onCountryClick?.(country);
								}
							}}
						>
							{/* Comparison checkbox */}
							{comparisonMode && (
								<div className="absolute top-2 right-2 z-10">
									<input
										type="checkbox"
										className="checkbox checkbox-primary checkbox-sm"
										checked={isSelected}
										onChange={(e) => {
											e.stopPropagation();
											onToggleSelect?.(country.$id);
										}}
									/>
								</div>
							)}

							<div className="card-body p-4">
								{/* Header */}
								<div className="flex items-start gap-3">
									<span className="text-4xl">{country.flag_emoji || "🏳️"}</span>
									<div className="flex-1 min-w-0">
										<h3 className="card-title text-base truncate">{country.name}</h3>
										<p className="text-sm text-base-content/60 truncate">
											{country.capital || "No capital"}
										</p>
										<div className="flex gap-1 mt-1">
											<span className="badge badge-ghost badge-xs">{country.iso3}</span>
											<span className="badge badge-ghost badge-xs truncate">{country.region}</span>
										</div>
									</div>
								</div>

								{/* Stats */}
								<div className="grid grid-cols-2 gap-2 mt-3 text-sm">
									<div>
										<span className="text-xs text-base-content/50">Population</span>
										<p className="font-medium">{formatCompact(country.population)}</p>
									</div>
									<div>
										<span className="text-xs text-base-content/50">Area</span>
										<p className="font-medium">{formatCompact(country.area_km2)} km²</p>
									</div>
								</div>

								{/* Indices with sparklines */}
								{country.indices && (
									<div className="mt-3 space-y-2">
										{country.indices.peace && Object.keys(country.indices.peace).length > 0 && (
											<div className="flex items-center justify-between">
												<span className="text-xs text-base-content/50">Peace Index</span>
												<Sparkline
													data={country.indices.peace}
													color="#22c55e"
													width={50}
													height={20}
													invertColors
												/>
											</div>
										)}
										{country.indices.happiness && Object.keys(country.indices.happiness).length > 0 && (
											<div className="flex items-center justify-between">
												<span className="text-xs text-base-content/50">Happiness</span>
												<Sparkline
													data={country.indices.happiness}
													color="#3b82f6"
													width={50}
													height={20}
												/>
											</div>
										)}
									</div>
								)}

								{/* Tags preview */}
								{country.feature_tags && country.feature_tags.length > 0 && (
									<div className="flex flex-wrap gap-1 mt-2">
										{country.feature_tags.slice(0, 3).map((tag) => (
											<span key={tag} className="badge badge-outline badge-xs">
												{tag.replace(/_/g, " ")}
											</span>
										))}
									</div>
								)}
							</div>
						</div>
					);
				})}
			</div>

			{/* Loading indicator */}
			{loading && (
				<div className="flex items-center justify-center py-8">
					<span className="loading loading-spinner loading-md"></span>
					<span className="ml-2 text-sm text-base-content/60">Loading more...</span>
				</div>
			)}

			{/* Load more button */}
			{hasMore && !loading && (
				<div className="flex justify-center py-4">
					<button className="btn btn-ghost" onClick={onLoadMore}>
						Load more countries
					</button>
				</div>
			)}
		</div>
	);
}
