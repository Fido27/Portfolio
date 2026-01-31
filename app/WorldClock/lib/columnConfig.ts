export type { EnhancedColumnConfig } from "../hooks/useCountries";

import type { EnhancedColumnConfig } from "../hooks/useCountries";

export const DEFAULT_COLUMNS: EnhancedColumnConfig[] = [
	// Basic Info - Fixed columns
	{
		key: "flag_emoji",
		label: "Flag",
		category: "basic",
		dataType: "flag",
		width: 48,
		visible: true,
		fixed: true,
		sortable: false,
		description: "Country flag emoji",
	},
	{
		key: "name",
		label: "Country",
		category: "basic",
		dataType: "text",
		width: 180,
		visible: true,
		fixed: true,
		sortable: true,
		description: "Country name and ISO3 code",
	},
	{
		key: "capital",
		label: "Capital",
		category: "basic",
		dataType: "text",
		width: 140,
		visible: true,
		fixed: false,
		sortable: true,
		description: "Capital city",
	},

	// Geographic Category
	{
		key: "region",
		label: "Region",
		category: "geographic",
		dataType: "text",
		width: 140,
		visible: true,
		sortable: true,
		description: "Geographic region and subregion",
	},
	{
		key: "area_km2",
		label: "Area (km²)",
		category: "geographic",
		dataType: "number",
		width: 110,
		visible: true,
		sortable: true,
		description: "Total area in square kilometers",
	},
	{
		key: "population",
		label: "Population",
		category: "geographic",
		dataType: "number",
		width: 120,
		visible: true,
		sortable: true,
		description: "Total population",
	},
	{
		key: "timezone",
		label: "Timezone",
		category: "geographic",
		dataType: "text",
		width: 160,
		visible: false,
		sortable: false,
		description: "Primary timezone",
	},
	{
		key: "languages",
		label: "Languages",
		category: "geographic",
		dataType: "badge",
		width: 120,
		visible: false,
		sortable: false,
		description: "Official languages",
	},
	{
		key: "climate",
		label: "Climate",
		category: "geographic",
		dataType: "badge",
		width: 120,
		visible: false,
		sortable: false,
		description: "Climate classification tags",
	},
	{
		key: "features",
		label: "Features",
		category: "geographic",
		dataType: "badge",
		width: 140,
		visible: false,
		sortable: false,
		description: "Geographic features (island, mountainous, etc.)",
	},

	// Economic Category
	{
		key: "currency",
		label: "Currency",
		category: "economic",
		dataType: "badge",
		width: 100,
		visible: true,
		sortable: false,
		description: "Currency code",
	},
	{
		key: "currency_to_usd",
		label: "Currency to USD",
		category: "economic",
		dataType: "currency",
		width: 120,
		visible: true,
		sortable: true,
		description: "Exchange rate to US Dollar",
	},
	{
		key: "gdp_per_capita",
		label: "GDP per Capita",
		category: "economic",
		dataType: "currency",
		width: 140,
		visible: true,
		sortable: true,
		description: "GDP per capita in USD",
	},
	{
		key: "main_industry",
		label: "Main Industry",
		category: "economic",
		dataType: "text",
		width: 150,
		visible: true,
		sortable: false,
		description: "Primary industry sector",
	},
	{
		key: "biggest_company",
		label: "Biggest Company",
		category: "economic",
		dataType: "text",
		width: 180,
		visible: false,
		sortable: false,
		description: "Largest company by revenue",
	},

	// Social Category
	{
		key: "national_language",
		label: "National Language",
		category: "social",
		dataType: "text",
		width: 140,
		visible: false,
		sortable: false,
		description: "Primary national language",
	},
	{
		key: "national_sport",
		label: "National Sport",
		category: "social",
		dataType: "text",
		width: 120,
		visible: false,
		sortable: false,
		description: "National sport",
	},
	{
		key: "famous_food",
		label: "Famous Food",
		category: "social",
		dataType: "text",
		width: 140,
		visible: false,
		sortable: false,
		description: "National dish or famous food",
	},
	{
		key: "famous_people",
		label: "Famous People",
		category: "social",
		dataType: "text",
		width: 160,
		visible: false,
		sortable: false,
		description: "Notable people from the country",
	},

	// Indices Category
	{
		key: "peace_index_2023",
		label: "Peace Index 2023",
		category: "indices",
		dataType: "rank",
		width: 140,
		visible: true,
		sortable: true,
		description: "Global Peace Index ranking (lower is better)",
	},
	{
		key: "peace_2023",
		label: "Peace Trend",
		category: "indices",
		dataType: "sparkline",
		width: 140,
		visible: true,
		sortable: true,
		description: "Peace Index historical trend",
	},
	{
		key: "happiness_index_2023",
		label: "Happiness Index 2023",
		category: "indices",
		dataType: "rank",
		width: 140,
		visible: true,
		sortable: true,
		description: "World Happiness Index ranking (higher is better)",
	},
	{
		key: "happiness_2023",
		label: "Happiness Trend",
		category: "indices",
		dataType: "sparkline",
		width: 140,
		visible: true,
		sortable: true,
		description: "Happiness Index historical trend",
	},
	{
		key: "hdi_2021",
		label: "HDI 2021",
		category: "indices",
		dataType: "rank",
		width: 120,
		visible: false,
		sortable: true,
		description: "Human Development Index ranking",
	},
	{
		key: "democracy_index_2023",
		label: "Democracy Index 2023",
		category: "indices",
		dataType: "rank",
		width: 160,
		visible: false,
		sortable: true,
		description: "Democracy Index ranking",
	},
];

export const COLUMN_CATEGORIES = {
	basic: { label: "Basic Info", icon: "🏛️", color: "blue" },
	economic: { label: "Economic", icon: "💰", color: "green" },
	social: { label: "Social & Cultural", icon: "🎭", color: "purple" },
	geographic: { label: "Geographic", icon: "🌍", color: "orange" },
	indices: { label: "Global Indices", icon: "📊", color: "red" },
} as const;

export const getColumnsByCategory = (category: keyof typeof COLUMN_CATEGORIES) => {
	return DEFAULT_COLUMNS.filter(col => col.category === category);
};

export const getVisibleColumns = (columns: EnhancedColumnConfig[] = DEFAULT_COLUMNS) => {
	return columns.filter(col => col.visible);
};

export const getFixedColumns = (columns: EnhancedColumnConfig[] = DEFAULT_COLUMNS) => {
	return columns.filter(col => col.fixed);
};

export const getScrollableColumns = (columns: EnhancedColumnConfig[] = DEFAULT_COLUMNS) => {
	return columns.filter(col => !col.fixed);
};