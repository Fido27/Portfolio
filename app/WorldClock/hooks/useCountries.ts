"use client";

import { useState, useEffect, useCallback, useRef } from "react";

// Types matching our Appwrite schema
export type CountryIndices = {
	peace?: Record<string, number>;
	happiness?: Record<string, number>;
	hdi?: Record<string, number>;
	democracy?: Record<string, number>;
	[key: string]: Record<string, number> | undefined;
};

export type Country = {
	$id: string;
	iso3: string;
	name: string;
	official_name?: string;
	capital?: string;
	latitude?: number;
	longitude?: number;
	area_km2?: string;
	region?: string;
	subregion?: string;
	population?: string;
	currency?: string;
	currency_name?: string;
	national_language?: string;
	famous_food?: string;
	famous_people?: string;
	national_sport?: string;
	national_anthem?: string;
	flag_emoji?: string;
	flag_url?: string;
	timezone?: string;
	utc_offset?: string;
	languages?: string[];
	climate_tags?: string[];
	region_tags?: string[];
	feature_tags?: string[];
	size_tags?: string[];
	religion_tags?: string[];
	border_countries?: string[];
	indices?: CountryIndices;
	data_source?: string;
};

export type CountryFilters = {
	region?: string;
	climate?: string;
	language?: string;
	religion?: string;
	feature?: string;
	size_tag?: string;
	search?: string;
};

export type ColumnCategory = "basic" | "economic" | "social" | "geographic" | "indices";

export type EnhancedColumnConfig = {
	key: string;
	label: string;
	category: ColumnCategory;
	dataType: "text" | "number" | "currency" | "rank" | "badge" | "flag" | "sparkline";
	width: number;
	visible: boolean;
	fixed?: boolean;
	sortable?: boolean;
	description?: string;
};

export type CountryMetrics = {
	gdp?: number;
	gdpPerCapita?: number;
	unemployment?: number;
	[key: string]: number | undefined;
};

export type SortConfig = {
	key: keyof Country | "peace_2023" | "happiness_2023";
	direction: "asc" | "desc";
};

type UseCountriesResult = {
	countries: Country[];
	loading: boolean;
	error: string | null;
	total: number;
	refresh: () => void;
	filters: CountryFilters;
	setFilters: (filters: CountryFilters) => void;
	sort: SortConfig;
	setSort: (sort: SortConfig) => void;
};

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000";

export function useCountries(): UseCountriesResult {
	const [countries, setCountries] = useState<Country[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [total, setTotal] = useState(0);
	const [filters, setFilters] = useState<CountryFilters>({});
	const [sort, setSort] = useState<SortConfig>({ key: "name", direction: "asc" });

	const fetchingRef = useRef(false);

	const fetchAllCountries = useCallback(async () => {
		if (fetchingRef.current) return;
		fetchingRef.current = true;

		try {
			setLoading(true);
			setError(null);

			// Build query params - fetch all at once
			const params = new URLSearchParams();
			params.set("limit", "500");

			if (filters.region?.trim()) params.set("region", filters.region.trim());
			if (filters.climate?.trim()) params.set("climate", filters.climate.trim());
			if (filters.language?.trim()) params.set("language", filters.language.trim());
			if (filters.religion?.trim()) params.set("religion", filters.religion.trim());
			if (filters.feature?.trim()) params.set("feature", filters.feature.trim());
			if (filters.size_tag?.trim()) params.set("size_tag", filters.size_tag.trim());

			const response = await fetch(`${API_BASE}/worldclock/countries?${params}`, {
				cache: "no-store",
			});

			if (!response.ok) {
				throw new Error(`Failed to fetch countries: ${response.status}`);
			}

			const data = await response.json();
			setCountries(data.countries || []);
			setTotal(data.total || 0);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Unknown error");
		} finally {
			setLoading(false);
			fetchingRef.current = false;
		}
	}, [filters]);

	// Fetch on mount and when filters change
	useEffect(() => {
		fetchAllCountries();
	}, [fetchAllCountries]);

	// Sort countries client-side
	const sortedCountries = [...countries].sort((a, b) => {
		const dir = sort.direction === "asc" ? 1 : -1;

		// Handle special index sorting
		if (sort.key === "peace_2023") {
			const aVal = a.indices?.peace?.["2023"] ?? Infinity;
			const bVal = b.indices?.peace?.["2023"] ?? Infinity;
			return (aVal - bVal) * dir;
		}
		if (sort.key === "happiness_2023") {
			const aVal = a.indices?.happiness?.["2023"] ?? -Infinity;
			const bVal = b.indices?.happiness?.["2023"] ?? -Infinity;
			return (aVal - bVal) * dir;
		}

		// Handle regular fields
		const aVal = a[sort.key as keyof Country];
		const bVal = b[sort.key as keyof Country];

		if (aVal == null && bVal == null) return 0;
		if (aVal == null) return 1 * dir;
		if (bVal == null) return -1 * dir;

		// Numeric comparison for string numbers
		if (sort.key === "population" || sort.key === "area_km2") {
			const aNum = parseFloat(String(aVal)) || 0;
			const bNum = parseFloat(String(bVal)) || 0;
			return (aNum - bNum) * dir;
		}

		// String comparison
		if (typeof aVal === "string" && typeof bVal === "string") {
			return aVal.localeCompare(bVal) * dir;
		}

		return 0;
	});

	// Filter by search term client-side
	const filteredCountries = filters.search
		? sortedCountries.filter(
				(c) =>
					c.name.toLowerCase().includes(filters.search!.toLowerCase()) ||
					c.iso3.toLowerCase().includes(filters.search!.toLowerCase()) ||
					c.capital?.toLowerCase().includes(filters.search!.toLowerCase())
		  )
		: sortedCountries;

	const refresh = useCallback(() => {
		fetchAllCountries();
	}, [fetchAllCountries]);

	return {
		countries: filteredCountries,
		loading,
		error,
		total,
		refresh,
		filters,
		setFilters,
		sort,
		setSort,
	};
}

// Hook to get available filter options
export function useFilterOptions() {
	const [regions, setRegions] = useState<string[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		async function fetchRegions() {
			try {
				const response = await fetch(`${API_BASE}/worldclock/regions`);
				if (response.ok) {
					const data = await response.json();
					setRegions(data.regions || []);
				}
			} catch {
				// Ignore errors
			} finally {
				setLoading(false);
			}
		}
		fetchRegions();
	}, []);

	// Static options for other filters
	const climateOptions = ["cold", "arctic", "tropical", "temperate", "desert", "arid", "hot"];
	const featureOptions = ["island", "landlocked", "coastal", "mountainous", "fjords", "archipelago"];
	const sizeOptions = ["large_area", "small_area", "large_population", "small_population"];
	const religionOptions = ["muslim_majority", "christian_majority", "hindu_majority", "buddhist_majority"];

	return {
		regions,
		climateOptions,
		featureOptions,
		sizeOptions,
		religionOptions,
		loading,
	};
}
