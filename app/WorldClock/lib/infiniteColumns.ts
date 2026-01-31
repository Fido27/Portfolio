export interface InfiniteColumnConfig {
	key: string;
	label: string;
	dataType: 'text' | 'number' | 'currency' | 'rank' | 'badge' | 'flag' | 'sparkline' | 'boolean';
	width: number;
	visible: boolean;
	fixed?: boolean;
	sortable?: boolean;
	category: 'basic' | 'economic' | 'social' | 'geographic' | 'political' | 'cultural' | 'environmental';
	weight: number; // Probability weight for random generation
}

export interface ZoomState {
	level: 'table' | 'detail' | 'timeline';
	scale: number;
	transitioning: boolean;
	focusedCountryId?: string;
	scrollPosition: { x: number; y: number };
}

export interface PinchGestureState {
	isActive: boolean;
	startDistance: number;
	startScale: number;
	currentScale: number;
	centerPoint: { x: number; y: number };
}

// Master column definitions with infinite possibilities
export const MASTER_COLUMNS: InfiniteColumnConfig[] = [
	// Basic columns (always visible)
	{ key: 'flag_emoji', label: '', dataType: 'flag', width: 60, visible: true, fixed: true, category: 'basic', weight: 0 },
	{ key: 'name', label: 'Country', dataType: 'text', width: 180, visible: true, fixed: true, sortable: true, category: 'basic', weight: 0 },
	{ key: 'iso3', label: 'Code', dataType: 'text', width: 60, visible: true, fixed: false, sortable: true, category: 'basic', weight: 5 },
	{ key: 'capital', label: 'Capital', dataType: 'text', width: 140, visible: true, sortable: true, category: 'basic', weight: 10 },

	// Geographic columns
	{ key: 'area_km2', label: 'Area (km²)', dataType: 'number', width: 120, visible: true, sortable: true, category: 'geographic', weight: 8 },
	{ key: 'population', label: 'Population', dataType: 'number', width: 130, visible: true, sortable: true, category: 'geographic', weight: 9 },
	{ key: 'latitude', label: 'Latitude', dataType: 'number', width: 100, visible: false, sortable: true, category: 'geographic', weight: 6 },
	{ key: 'longitude', label: 'Longitude', dataType: 'number', width: 100, visible: false, sortable: true, category: 'geographic', weight: 6 },
	{ key: 'region', label: 'Region', dataType: 'text', width: 120, visible: true, sortable: true, category: 'geographic', weight: 7 },
	{ key: 'subregion', label: 'Subregion', dataType: 'text', width: 140, visible: false, sortable: true, category: 'geographic', weight: 5 },
	{ key: 'timezone', label: 'Timezone', dataType: 'text', width: 120, visible: false, sortable: true, category: 'geographic', weight: 4 },
	{ key: 'utc_offset', label: 'UTC Offset', dataType: 'text', width: 100, visible: false, sortable: true, category: 'geographic', weight: 3 },
	{ key: 'climate_tags', label: 'Climate', dataType: 'badge', width: 160, visible: false, sortable: false, category: 'environmental', weight: 7 },
	{ key: 'feature_tags', label: 'Features', dataType: 'badge', width: 180, visible: false, sortable: false, category: 'geographic', weight: 6 },
	{ key: 'size_tags', label: 'Size Category', dataType: 'badge', width: 140, visible: false, sortable: true, category: 'geographic', weight: 5 },
	{ key: 'border_countries', label: 'Borders', dataType: 'badge', width: 200, visible: false, sortable: false, category: 'geographic', weight: 4 },

	// Economic columns
	{ key: 'currency', label: 'Currency', dataType: 'text', width: 100, visible: true, sortable: true, category: 'economic', weight: 8 },
	{ key: 'currency_name', label: 'Currency Name', dataType: 'text', width: 140, visible: false, sortable: true, category: 'economic', weight: 6 },
	{ key: 'gdp_nominal', label: 'GDP (Nominal)', dataType: 'currency', width: 150, visible: false, sortable: true, category: 'economic', weight: 9 },
	{ key: 'gdp_ppp', label: 'GDP (PPP)', dataType: 'currency', width: 150, visible: false, sortable: true, category: 'economic', weight: 9 },
	{ key: 'gdp_per_capita', label: 'GDP per Capita', dataType: 'currency', width: 140, visible: false, sortable: true, category: 'economic', weight: 8 },
	{ key: 'gini_coefficient', label: 'Gini Index', dataType: 'number', width: 100, visible: false, sortable: true, category: 'economic', weight: 7 },
	{ key: 'inflation_rate', label: 'Inflation %', dataType: 'number', width: 110, visible: false, sortable: true, category: 'economic', weight: 6 },
	{ key: 'unemployment_rate', label: 'Unemployment %', dataType: 'number', width: 130, visible: false, sortable: true, category: 'economic', weight: 7 },
	{ key: 'exports', label: 'Exports', dataType: 'currency', width: 140, visible: false, sortable: true, category: 'economic', weight: 5 },
	{ key: 'imports', label: 'Imports', dataType: 'currency', width: 140, visible: false, sortable: true, category: 'economic', weight: 5 },

	// Political columns
	{ key: 'government_type', label: 'Government', dataType: 'text', width: 160, visible: false, sortable: true, category: 'political', weight: 8 },
	{ key: 'leader_title', label: 'Leader Title', dataType: 'text', width: 120, visible: false, sortable: true, category: 'political', weight: 6 },
	{ key: 'leader_name', label: 'Leader', dataType: 'text', width: 140, visible: false, sortable: true, category: 'political', weight: 7 },
	{ key: 'independence_year', label: 'Independence', dataType: 'number', width: 120, visible: false, sortable: true, category: 'political', weight: 5 },
	{ key: 'un_member', label: 'UN Member', dataType: 'boolean', width: 100, visible: false, sortable: true, category: 'political', weight: 3 },
	{ key: 'eu_member', label: 'EU Member', dataType: 'boolean', width: 100, visible: false, sortable: true, category: 'political', weight: 4 },
	{ key: 'nato_member', label: 'NATO Member', dataType: 'boolean', width: 110, visible: false, sortable: true, category: 'political', weight: 4 },
	{ key: 'peace_2023', label: 'Peace Index', dataType: 'rank', width: 110, visible: true, sortable: true, category: 'political', weight: 8 },
	{ key: 'democracy_index', label: 'Democracy Index', dataType: 'number', width: 130, visible: false, sortable: true, category: 'political', weight: 7 },
	{ key: 'press_freedom_index', label: 'Press Freedom', dataType: 'rank', width: 130, visible: false, sortable: true, category: 'political', weight: 6 },

	// Social columns
	{ key: 'languages', label: 'Languages', dataType: 'badge', width: 180, visible: false, sortable: false, category: 'cultural', weight: 7 },
	{ key: 'national_language', label: 'National Language', dataType: 'text', width: 140, visible: false, sortable: true, category: 'cultural', weight: 5 },
	{ key: 'literacy_rate', label: 'Literacy %', dataType: 'number', width: 100, visible: false, sortable: true, category: 'social', weight: 7 },
	{ key: 'life_expectancy', label: 'Life Expectancy', dataType: 'number', width: 130, visible: false, sortable: true, category: 'social', weight: 8 },
	{ key: 'happiness_2023', label: 'Happiness Index', dataType: 'rank', width: 120, visible: false, sortable: true, category: 'social', weight: 8 },
	{ key: 'hdi_2023', label: 'HDI Index', dataType: 'number', width: 100, visible: false, sortable: true, category: 'social', weight: 7 },
	{ key: 'religion_tags', label: 'Religions', dataType: 'badge', width: 160, visible: false, sortable: false, category: 'cultural', weight: 6 },
	{ key: 'ethnic_groups', label: 'Ethnic Groups', dataType: 'badge', width: 180, visible: false, sortable: false, category: 'social', weight: 6 },
	{ key: 'urbanization_rate', label: 'Urbanization %', dataType: 'number', width: 130, visible: false, sortable: true, category: 'social', weight: 5 },
	{ key: 'internet_penetration', label: 'Internet %', dataType: 'number', width: 120, visible: false, sortable: true, category: 'social', weight: 6 },

	// Cultural columns
	{ key: 'national_anthem', label: 'National Anthem', dataType: 'text', width: 200, visible: false, sortable: false, category: 'cultural', weight: 4 },
	{ key: 'national_sport', label: 'National Sport', dataType: 'text', width: 140, visible: false, sortable: false, category: 'cultural', weight: 5 },
	{ key: 'famous_food', label: 'Famous Food', dataType: 'text', width: 160, visible: false, sortable: false, category: 'cultural', weight: 6 },
	{ key: 'famous_people', label: 'Famous People', dataType: 'text', width: 200, visible: false, sortable: false, category: 'cultural', weight: 5 },
	{ key: 'tourism_sites', label: 'Tourist Sites', dataType: 'badge', width: 200, visible: false, sortable: false, category: 'cultural', weight: 4 },
	{ key: 'cultural_heritage', label: 'UNESCO Sites', dataType: 'number', width: 120, visible: false, sortable: true, category: 'cultural', weight: 5 },

	// Environmental columns
	{ key: 'carbon_emissions', label: 'CO₂ Emissions', dataType: 'number', width: 140, visible: false, sortable: true, category: 'environmental', weight: 6 },
	{ key: 'renewable_energy', label: 'Renewable Energy %', dataType: 'number', width: 150, visible: false, sortable: true, category: 'environmental', weight: 7 },
	{ key: 'forest_coverage', label: 'Forest Coverage %', dataType: 'number', width: 140, visible: false, sortable: true, category: 'environmental', weight: 5 },
	{ key: 'water_stress_index', label: 'Water Stress', dataType: 'rank', width: 120, visible: false, sortable: true, category: 'environmental', weight: 6 },
	{ key: 'biodiversity_index', label: 'Biodiversity', dataType: 'number', width: 130, visible: false, sortable: true, category: 'environmental', weight: 5 },
	{ key: 'average_temperature', label: 'Avg Temp °C', dataType: 'number', width: 120, visible: false, sortable: true, category: 'environmental', weight: 6 },
	{ key: 'annual_rainfall', label: 'Annual Rainfall', dataType: 'number', width: 140, visible: false, sortable: true, category: 'environmental', weight: 5 },
];

// Simple RNG interface
interface SimpleRNG {
	quick(): number;
	double(): number;
	int32(): number;
}

// Column generator for infinite scrolling
export class InfiniteColumnGenerator {
	private static instance: InfiniteColumnGenerator;
	private rng: SimpleRNG;
	private columnPool: InfiniteColumnConfig[];
	private usedColumns = new Set<string>();

	private constructor(seed?: string) {
		// Using simple Math.random as fallback
		this.rng = {
			quick: () => Math.random(),
			double: () => Math.random(),
			int32: () => Math.floor(Math.random() * 0xFFFFFFFF),
		};

		if (seed) {
			// Simple seed-based random for reproducibility
			let hash = 0;
			for (let i = 0; i < seed.length; i++) {
				hash = ((hash << 5) - hash) + seed.charCodeAt(i);
				hash = hash & hash;
			}
			let seedValue = Math.abs(hash) / 0x7FFFFFFF;
			this.rng = {
				quick: () => {
					seedValue = (seedValue * 9301 + 49297) % 233280;
					return seedValue / 233280;
				},
				double: () => this.rng.quick(),
				int32: () => Math.floor(this.rng.quick() * 0xFFFFFFFF),
			};
		}

		this.columnPool = [...MASTER_COLUMNS];
	}

	static getInstance(seed?: string): InfiniteColumnGenerator {
		if (!this.instance || seed) {
			this.instance = new InfiniteColumnGenerator(seed);
		}
		return this.instance;
	}

	// Generate next batch of columns for infinite scrolling
	generateNextColumns(startIndex: number, count: number = 10): InfiniteColumnConfig[] {
		const columns: InfiniteColumnConfig[] = [];
		const availableColumns = this.columnPool.filter(col => !this.usedColumns.has(col.key) || col.weight > 0);

		// Weighted random selection
		for (let i = 0; i < count; i++) {
			const weights = availableColumns.map(col => col.weight);
			const totalWeight = weights.reduce((sum, w) => sum + w, 0);

			if (totalWeight === 0) break;

			let random = this.rng.quick() * totalWeight;
			let selectedIndex = 0;

			for (let j = 0; j < weights.length; j++) {
				random -= weights[j];
				if (random <= 0) {
					selectedIndex = j;
					break;
				}
			}

			const selectedColumn = availableColumns[selectedIndex];
			if (selectedColumn) {
				// Create a new column instance with position info
				columns.push({
					...selectedColumn,
					key: `${selectedColumn.key}_${startIndex + i}`,
					originalKey: selectedColumn.key,
					position: startIndex + i,
				} as any);

				this.usedColumns.add(selectedColumn.key);
			}
		}

		return columns;
	}

	// Reset used columns for new session
	reset(): void {
		this.usedColumns.clear();
	}

	// Get random seed for session
	getRandomSeed(): string {
		return Math.random().toString(36).substring(2);
	}
}

// Type for enhanced column with position info
export interface EnhancedInfiniteColumn extends InfiniteColumnConfig {
	originalKey: string;
	position: number;
}

export type { InfiniteColumnConfig as ColumnConfig };