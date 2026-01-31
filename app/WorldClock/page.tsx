"use client";

import { useState, useEffect, useCallback } from "react";
import { useCountries, useFilterOptions, type Country } from "./hooks/useCountries";
import { useUserConfig } from "./hooks/useUserConfig";
import InfiniteWorldTable from "./components/InfiniteWorldTable";
import ColumnSelector, { type ColumnConfig } from "./components/ColumnSelector";
import UserConfigPanel from "./components/UserConfigPanel";
import CountryFilters from "./components/CountryFilters";
import CountryDetail from "./components/CountryDetail";
import { InfiniteColumnGenerator, type EnhancedInfiniteColumn } from "./lib/infiniteColumns";

// Default column configuration
const defaultColumns: ColumnConfig[] = [
	{ key: "flag", label: "", visible: true, locked: true },
	{ key: "name", label: "Name", visible: true, locked: true },
	{ key: "capital", label: "Capital", visible: true },
	{ key: "region", label: "Region", visible: true },
	{ key: "population", label: "Pop", visible: true },
	{ key: "area_km2", label: "Area", visible: true },
	{ key: "peace_2023", label: "Peace", visible: true },
	{ key: "happiness_2023", label: "Happy", visible: false },
	{ key: "timezone", label: "Timezone", visible: false },
	{ key: "currency", label: "Currency", visible: true },
	{ key: "languages", label: "Lang", visible: false },
	{ key: "climate", label: "Climate", visible: false },
	{ key: "features", label: "Features", visible: false },
];

const COLUMNS_STORAGE_KEY = "worldclock-columns";

export default function WorldClockPage() {
	const {
		countries,
		loading,
		error,
		total,
		refresh,
		filters,
		setFilters,
		sort,
		setSort,
	} = useCountries();

	const { config: userConfig, setConfig: setUserConfig, resetConfig } = useUserConfig();
	const filterOptions = useFilterOptions();
	const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
	const [showFilters, setShowFilters] = useState(false);

	// Load columns from localStorage and prepare infinite columns
	const [columns, setColumns] = useState<ColumnConfig[]>(defaultColumns);
	const [infiniteColumns, setInfiniteColumns] = useState<EnhancedInfiniteColumn[]>(() => {
		const generator = InfiniteColumnGenerator.getInstance();
		const baseColumns = defaultColumns
			.filter(col => col.visible)
			.map(col => ({
				...col,
				dataType: col.key === 'flag' ? 'flag' : 
							col.key === 'name' ? 'text' :
							['population', 'area_km2'].includes(col.key) ? 'number' :
							['currency'].includes(col.key) ? 'text' :
							['peace_2023', 'happiness_2023'].includes(col.key) ? 'rank' :
							['languages', 'climate', 'features'].includes(col.key) ? 'badge' :
							'text',
				width: col.key === 'flag' ? 60 : 
					   col.key === 'name' ? 180 :
					   ['population', 'area_km2'].includes(col.key) ? 130 :
					   col.key === 'capital' ? 140 :
					   120,
				category: 'basic' as const,
				weight: 0,
				originalKey: col.key,
				position: 0,
			}));
		return baseColumns as EnhancedInfiniteColumn[];
	});

	useEffect(() => {
		const saved = localStorage.getItem(COLUMNS_STORAGE_KEY);
		if (saved) {
			try {
				const parsed = JSON.parse(saved);
				// Merge with defaults to handle new columns
				const merged = defaultColumns.map((def) => {
					const savedCol = parsed.find((c: ColumnConfig) => c.key === def.key);
					return savedCol ? { ...def, visible: savedCol.visible } : def;
				});
				setColumns(merged);
			} catch {
				// Ignore parse errors
			}
		}
	}, []);

	const handleColumnsChange = useCallback((newColumns: ColumnConfig[]) => {
		setColumns(newColumns);
		localStorage.setItem(COLUMNS_STORAGE_KEY, JSON.stringify(newColumns));
	}, []);

	return (
		<main className="h-screen w-screen bg-base-100 flex flex-col overflow-hidden">
			{/* Minimal header bar */}
			<header className="flex items-center justify-between px-4 py-2 bg-base-200/50 border-b border-base-content/10 flex-shrink-0">
				<div className="flex items-center gap-3">
					<span className="text-2xl">🌍</span>
					<div>
						<h1 className="text-sm font-bold leading-tight">WorldClock</h1>
						<p className="text-[10px] text-base-content/50">
							{loading ? "Loading..." : `${countries.length} of ${total} countries`}
						</p>
					</div>
				</div>

				<div className="flex items-center gap-1">
					{/* Filter toggle */}
					<button
						className={`btn btn-sm btn-ghost ${showFilters ? "btn-active" : ""}`}
						onClick={() => setShowFilters(!showFilters)}
						title="Filters"
					>
						<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
						</svg>
					</button>

					{/* Column selector */}
					<ColumnSelector columns={columns} onChange={handleColumnsChange} />

					{/* User settings */}
					<UserConfigPanel
						config={userConfig}
						onChange={setUserConfig}
						onReset={resetConfig}
					/>

					{/* Refresh */}
					<button
						className="btn btn-sm btn-ghost"
						onClick={refresh}
						disabled={loading}
						title="Refresh"
					>
						{loading ? (
							<span className="loading loading-spinner loading-xs"></span>
						) : (
							<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
							</svg>
						)}
					</button>
				</div>
			</header>

			{/* Collapsible filters */}
			{showFilters && (
				<div className="border-b border-base-content/10 bg-base-200/30 flex-shrink-0">
					<CountryFilters
						filters={filters}
						onChange={setFilters}
						regions={filterOptions.regions}
						climateOptions={filterOptions.climateOptions}
						featureOptions={filterOptions.featureOptions}
						sizeOptions={filterOptions.sizeOptions}
						religionOptions={filterOptions.religionOptions}
					/>
				</div>
			)}

			{/* Error message */}
			{error && (
				<div className="px-4 py-2 bg-error/10 text-error text-sm flex items-center gap-2 flex-shrink-0">
					<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
					</svg>
					<span>{error}</span>
					<button className="btn btn-xs btn-ghost" onClick={refresh}>Retry</button>
				</div>
			)}

			{/* Full-bleed infinite table */}
			<div className="flex-1 overflow-hidden">
				<InfiniteWorldTable
					countries={countries}
					loading={loading}
					sort={sort}
					onSort={setSort}
					onCountryClick={setSelectedCountry}
					baseColumns={infiniteColumns}
					selectedCountry={selectedCountry}
				/>
			</div>

			{/* Country detail modal */}
			<CountryDetail country={selectedCountry} onClose={() => setSelectedCountry(null)} />
		</main>
	);
}
