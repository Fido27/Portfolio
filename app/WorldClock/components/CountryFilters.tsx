"use client";

import { useState, useCallback } from "react";
import type { CountryFilters as FilterType } from "../hooks/useCountries";

type CountryFiltersProps = {
	filters: FilterType;
	onChange: (filters: FilterType) => void;
	regions: string[];
	climateOptions: string[];
	featureOptions: string[];
	sizeOptions: string[];
	religionOptions: string[];
};

export default function CountryFilters({
	filters,
	onChange,
	regions,
	climateOptions,
	featureOptions,
	sizeOptions,
	religionOptions,
}: CountryFiltersProps) {
	const [searchValue, setSearchValue] = useState(filters.search || "");
	const [showAdvanced, setShowAdvanced] = useState(false);

	// Debounced search
	const handleSearchChange = useCallback(
		(value: string) => {
			setSearchValue(value);
			// Simple debounce
			const timer = setTimeout(() => {
				onChange({ ...filters, search: value || undefined });
			}, 300);
			return () => clearTimeout(timer);
		},
		[filters, onChange]
	);

	const handleFilterChange = (key: keyof FilterType, value: string) => {
		onChange({ ...filters, [key]: value || undefined });
	};

	const clearFilters = () => {
		setSearchValue("");
		onChange({});
	};

	const hasActiveFilters =
		filters.region ||
		filters.climate ||
		filters.language ||
		filters.religion ||
		filters.feature ||
		filters.size_tag ||
		filters.search;

	return (
		<div className="bg-base-200 rounded-box p-4 space-y-4">
			{/* Search bar */}
			<div className="flex gap-2">
				<div className="flex-1 relative">
					<input
						type="text"
						placeholder="Search countries, capitals..."
						className="input input-bordered w-full pl-10"
						value={searchValue}
						onChange={(e) => handleSearchChange(e.target.value)}
					/>
					<svg
						className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-base-content/40"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
						/>
					</svg>
				</div>
				<button
					className={`btn ${showAdvanced ? "btn-primary" : "btn-ghost"}`}
					onClick={() => setShowAdvanced(!showAdvanced)}
				>
					<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
						/>
					</svg>
					<span className="hidden sm:inline">Filters</span>
					{hasActiveFilters && (
						<span className="badge badge-primary badge-xs ml-1">!</span>
					)}
				</button>
				{hasActiveFilters && (
					<button className="btn btn-ghost btn-sm" onClick={clearFilters}>
						Clear
					</button>
				)}
			</div>

			{/* Advanced filters */}
			{showAdvanced && (
				<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
					{/* Region */}
					<div className="form-control">
						<label className="label py-1">
							<span className="label-text text-xs">Region</span>
						</label>
						<select
							className="select select-bordered select-sm w-full"
							value={filters.region || ""}
							onChange={(e) => handleFilterChange("region", e.target.value)}
						>
							<option value="">All regions</option>
							{regions.map((r) => (
								<option key={r} value={r}>
									{r}
								</option>
							))}
						</select>
					</div>

					{/* Climate */}
					<div className="form-control">
						<label className="label py-1">
							<span className="label-text text-xs">Climate</span>
						</label>
						<select
							className="select select-bordered select-sm w-full"
							value={filters.climate || ""}
							onChange={(e) => handleFilterChange("climate", e.target.value)}
						>
							<option value="">Any climate</option>
							{climateOptions.map((c) => (
								<option key={c} value={c}>
									{c.charAt(0).toUpperCase() + c.slice(1)}
								</option>
							))}
						</select>
					</div>

					{/* Features */}
					<div className="form-control">
						<label className="label py-1">
							<span className="label-text text-xs">Features</span>
						</label>
						<select
							className="select select-bordered select-sm w-full"
							value={filters.feature || ""}
							onChange={(e) => handleFilterChange("feature", e.target.value)}
						>
							<option value="">Any feature</option>
							{featureOptions.map((f) => (
								<option key={f} value={f}>
									{f.charAt(0).toUpperCase() + f.slice(1).replace("_", " ")}
								</option>
							))}
						</select>
					</div>

					{/* Size */}
					<div className="form-control">
						<label className="label py-1">
							<span className="label-text text-xs">Size</span>
						</label>
						<select
							className="select select-bordered select-sm w-full"
							value={filters.size_tag || ""}
							onChange={(e) => handleFilterChange("size_tag", e.target.value)}
						>
							<option value="">Any size</option>
							{sizeOptions.map((s) => (
								<option key={s} value={s}>
									{s.split("_").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")}
								</option>
							))}
						</select>
					</div>

					{/* Religion */}
					<div className="form-control">
						<label className="label py-1">
							<span className="label-text text-xs">Religion</span>
						</label>
						<select
							className="select select-bordered select-sm w-full"
							value={filters.religion || ""}
							onChange={(e) => handleFilterChange("religion", e.target.value)}
						>
							<option value="">Any religion</option>
							{religionOptions.map((r) => (
								<option key={r} value={r}>
									{r.split("_").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")}
								</option>
							))}
						</select>
					</div>

					{/* Language - text input */}
					<div className="form-control">
						<label className="label py-1">
							<span className="label-text text-xs">Language</span>
						</label>
						<input
							type="text"
							placeholder="e.g., en, es, fr"
							className="input input-bordered input-sm w-full"
							value={filters.language || ""}
							onChange={(e) => handleFilterChange("language", e.target.value)}
						/>
					</div>
				</div>
			)}

			{/* Active filter tags */}
			{hasActiveFilters && (
				<div className="flex flex-wrap gap-2">
					{filters.search && (
						<span className="badge badge-primary gap-1">
							Search: {filters.search}
							<button onClick={() => { setSearchValue(""); onChange({ ...filters, search: undefined }); }}>✕</button>
						</span>
					)}
					{filters.region && (
						<span className="badge badge-secondary gap-1">
							Region: {filters.region}
							<button onClick={() => handleFilterChange("region", "")}>✕</button>
						</span>
					)}
					{filters.climate && (
						<span className="badge badge-accent gap-1">
							Climate: {filters.climate}
							<button onClick={() => handleFilterChange("climate", "")}>✕</button>
						</span>
					)}
					{filters.feature && (
						<span className="badge badge-info gap-1">
							Feature: {filters.feature}
							<button onClick={() => handleFilterChange("feature", "")}>✕</button>
						</span>
					)}
					{filters.size_tag && (
						<span className="badge badge-warning gap-1">
							Size: {filters.size_tag.replace("_", " ")}
							<button onClick={() => handleFilterChange("size_tag", "")}>✕</button>
						</span>
					)}
					{filters.religion && (
						<span className="badge badge-success gap-1">
							Religion: {filters.religion.replace(/_/g, " ")}
							<button onClick={() => handleFilterChange("religion", "")}>✕</button>
						</span>
					)}
					{filters.language && (
						<span className="badge gap-1">
							Language: {filters.language}
							<button onClick={() => handleFilterChange("language", "")}>✕</button>
						</span>
					)}
				</div>
			)}
		</div>
	);
}
