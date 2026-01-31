"use client";

import { useCallback, useRef, useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import type { Country, SortConfig } from "../hooks/useCountries";
import type { EnhancedInfiniteColumn, ZoomState } from "../lib/infiniteColumns";
import { useZoomGestures } from "../hooks/useZoomGestures";
import { InfiniteColumnGenerator } from "../lib/infiniteColumns";
import CountryDetailView from "./CountryDetailView";
import GlobalTimelineView from "./GlobalTimelineView";

type InfiniteWorldTableProps = {
	countries: Country[];
	loading: boolean;
	sort: SortConfig;
	onSort: (sort: SortConfig) => void;
	onCountryClick?: (country: Country) => void;
	baseColumns: EnhancedInfiniteColumn[];
	selectedCountry?: Country | null;
};

const ROW_HEIGHT = 48;
const BUFFER_SIZE = 10;
const LOAD_MORE_THRESHOLD = 200;
const GENERATION_SEED_KEY = "infinite-columns-seed";

// Enhanced formatters for different data types
function formatValue(value: any, dataType: string): string {
	if (value == null || value === "") return "—";

	switch (dataType) {
		case "currency":
			const num = typeof value === "string" ? parseFloat(value) : value;
			if (isNaN(num)) return "—";
			return new Intl.NumberFormat("en-US", {
				style: "currency",
				currency: "USD",
				minimumFractionDigits: 0,
				maximumFractionDigits: 0,
			}).format(num);

		case "number":
			const numVal = typeof value === "string" ? parseFloat(value) : value;
			if (isNaN(numVal)) return "—";
			return numVal.toLocaleString();

		case "rank":
			const rankVal = typeof value === "string" ? parseInt(value) : value;
			if (isNaN(rankVal)) return "—";
			return `#${rankVal}`;

		case "boolean":
			return value ? "✓" : "✗";

		default:
			return String(value);
	}
}

// Column renderers for different data types
const createColumnRenderer = (column: EnhancedInfiniteColumn) => {
	const { key, dataType, width } = column;

	switch (dataType) {
		case "flag":
			return (country: Country) => (
				<span className="text-2xl" title={country.name}>
					{country.flag_emoji || "🏳️"}
				</span>
			);

		case "text":
			if (key.startsWith("name") || key === "name") {
				return (country: Country) => (
					<div className="flex flex-col">
						<span className="font-medium truncate">{country.name}</span>
						<span className="text-xs text-base-content/50">{country.iso3}</span>
					</div>
				);
			}
			if (key === "region") {
				return (country: Country) => (
					<div className="flex flex-col">
						<span className="truncate text-sm">{country.region || "—"}</span>
						<span className="text-xs text-base-content/50 truncate">{country.subregion}</span>
					</div>
				);
			}
			return (country: Country) => {
				const actualKey = (column as any).originalKey || key;
				return (
					<span className="truncate">{formatValue(country[actualKey as keyof Country], dataType)}</span>
				);
			};

		case "number":
		case "currency":
		case "rank":
			return (country: Country) => {
				const actualKey = (column as any).originalKey || key;
				const value = country[actualKey as keyof Country] || country.indices?.[actualKey];
				return (
					<span className="font-mono text-right block w-full">
						{formatValue(value, dataType)}
					</span>
				);
			};

		case "badge":
			if (key.includes("languages")) {
				return (country: Country) => (
					<div className="flex flex-wrap gap-1">
						{country.languages?.slice(0, 2).map((lang) => (
							<span key={lang} className="badge badge-outline badge-xs">
								{lang}
							</span>
						))}
						{(country.languages?.length || 0) > 2 && (
							<span className="text-xs text-base-content/50">+{country.languages!.length - 2}</span>
						)}
					</div>
				);
			}
			if (key.includes("climate")) {
				return (country: Country) => (
					<div className="flex flex-wrap gap-1">
						{country.climate_tags?.slice(0, 2).map((tag) => (
							<span key={tag} className="badge badge-outline badge-xs">
								{tag}
							</span>
						))}
					</div>
				);
			}
			if (key.includes("feature")) {
				return (country: Country) => (
					<div className="flex flex-wrap gap-1">
						{country.feature_tags?.slice(0, 2).map((tag) => (
							<span key={tag} className="badge badge-outline badge-xs">
								{tag.replace(/_/g, " ")}
							</span>
						))}
					</div>
				);
			}
			if (key.includes("currency")) {
				return (country: Country) => (
					<span className="badge badge-ghost badge-sm" title={country.currency_name}>
						{country.currency || "—"}
					</span>
				);
			}
			return (country: Country) => {
				const actualKey = (column as any).originalKey || key;
				const value = country[actualKey as keyof Country];
				if (Array.isArray(value)) {
					return (
						<div className="flex flex-wrap gap-1">
							{value.slice(0, 2).map((item) => (
								<span key={item} className="badge badge-outline badge-xs">
									{String(item)}
								</span>
							))}
							{value.length > 2 && (
								<span className="text-xs text-base-content/50">+{value.length - 2}</span>
							)}
						</div>
					);
				}
				return <span>{formatValue(value, dataType)}</span>;
			};

		default:
			return (country: Country) => {
				const actualKey = (column as any).originalKey || key;
				return <span>{formatValue(country[actualKey as keyof Country], dataType)}</span>;
			};
	}
};

export default function InfiniteWorldTable({
	countries,
	loading,
	sort,
	onSort,
	onCountryClick,
	baseColumns,
	selectedCountry,
}: InfiniteWorldTableProps) {
	const containerRef = useRef<HTMLDivElement>(null);
	const scrollContainerRef = useRef<HTMLDivElement>(null);
	const [scrollTop, setScrollTop] = useState(0);
	const [scrollLeft, setScrollLeft] = useState(0);
	const [containerHeight, setContainerHeight] = useState(600);
	const [containerWidth, setContainerWidth] = useState(800);

	// Infinite columns state
	const [infiniteColumns, setInfiniteColumns] = useState<EnhancedInfiniteColumn[]>(baseColumns);
	const [columnGenerator] = useState(() => {
		if (typeof window === "undefined") {
			return InfiniteColumnGenerator.getInstance();
		}
		const savedSeed = localStorage.getItem(GENERATION_SEED_KEY);
		const seed = savedSeed || InfiniteColumnGenerator.getInstance().getRandomSeed();
		if (!savedSeed) {
			localStorage.setItem(GENERATION_SEED_KEY, seed);
		}
		return InfiniteColumnGenerator.getInstance(seed);
	});

	// Resolve country under pinch/zoom center
	const resolveFocus = useCallback((center: { x: number, y: number }) => {
		if (!scrollContainerRef.current) return undefined;

		const rect = scrollContainerRef.current.getBoundingClientRect();

		// Check if point is within the scrollable area
		if (
			center.x < rect.left ||
			center.x > rect.right ||
			center.y < rect.top ||
			center.y > rect.bottom
		) {
			return undefined;
		}

		const relativeY = center.y - rect.top + scrollContainerRef.current.scrollTop;
		const rowIndex = Math.floor(relativeY / ROW_HEIGHT);

		if (rowIndex >= 0 && rowIndex < countries.length) {
			return countries[rowIndex].$id;
		}
		return undefined;
	}, [countries]);

	// Zoom gestures
	const { zoomState, setZoomLevel, resetZoom } = useZoomGestures(containerRef as any, { resolveFocus });

	// Generate more columns as we scroll horizontally
	const generateMoreColumns = useCallback((scrollPosition: number) => {
		const currentColumnCount = infiniteColumns.length;
		const viewportWidth = containerWidth;
		const totalWidth = infiniteColumns.reduce((sum, col) => sum + col.width, 0);

		// Generate more columns if we're near the end
		if (scrollPosition + viewportWidth > totalWidth - LOAD_MORE_THRESHOLD) {
			const newColumns = columnGenerator.generateNextColumns(currentColumnCount, 15);
			if (newColumns.length > 0) {
				setInfiniteColumns(prev => [...prev, ...newColumns as EnhancedInfiniteColumn[]]);
			}
		}
	}, [infiniteColumns, containerWidth, columnGenerator]);

	// Handle scroll
	const handleScroll = useCallback(() => {
		if (!scrollContainerRef.current) return;
		const { scrollTop, scrollLeft } = scrollContainerRef.current;
		setScrollTop(scrollTop);
		setScrollLeft(scrollLeft);

		// Generate more columns based on horizontal scroll
		generateMoreColumns(scrollLeft);
	}, [generateMoreColumns]);

	// Set container dimensions
	useEffect(() => {
		if (containerRef.current) {
			const rect = containerRef.current.getBoundingClientRect();
			setContainerHeight(rect.height);
			setContainerWidth(rect.width);
		}

		const resizeObserver = new ResizeObserver((entries) => {
			for (const entry of entries) {
				const rect = entry.contentRect;
				setContainerHeight(rect.height);
				setContainerWidth(rect.width);
			}
		});

		if (containerRef.current) {
			resizeObserver.observe(containerRef.current);
		}

		return () => resizeObserver.disconnect();
	}, []);

	// Filter visible columns for horizontal virtualization
	const visibleColumns = useMemo(() => {
		const visible = [];
		let accumulatedWidth = 0;

		for (let i = 0; i < infiniteColumns.length; i++) {
			const col = infiniteColumns[i];
			const colEnd = accumulatedWidth + col.width;

			// Show column if it's visible or adjacent to viewport
			if (colEnd >= scrollLeft - BUFFER_SIZE * col.width && accumulatedWidth <= scrollLeft + containerWidth + BUFFER_SIZE * col.width) {
				visible.push({ ...col, virtualizedLeft: accumulatedWidth });
			}

			accumulatedWidth = colEnd;
			if (accumulatedWidth > scrollLeft + containerWidth + BUFFER_SIZE * col.width * 2) break;
		}

		return visible;
	}, [infiniteColumns, scrollLeft, containerWidth]);

	// Calculate visible rows
	const startIndex = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - BUFFER_SIZE);
	const visibleCount = Math.ceil(containerHeight / ROW_HEIGHT) + BUFFER_SIZE * 2;
	const endIndex = Math.min(countries.length, startIndex + visibleCount);
	const visibleCountries = countries.slice(startIndex, endIndex);
	const totalHeight = countries.length * ROW_HEIGHT;
	const offsetY = startIndex * ROW_HEIGHT;

	// Calculate total width
	const totalWidth = useMemo(() => {
		return infiniteColumns.reduce((sum, col) => sum + col.width, 0);
	}, [infiniteColumns]);

	// Handle sort click
	const handleSortClick = (key: string) => {
		if (sort.key === key) {
			onSort({ key: key as SortConfig["key"], direction: sort.direction === "asc" ? "desc" : "asc" });
		} else {
			onSort({ key: key as SortConfig["key"], direction: "asc" });
		}
	};

	// Handle country click with zoom
	const handleCountryClick = useCallback((country: Country, event: React.MouseEvent) => {
		if (zoomState.level === 'table') {
			setZoomLevel('detail', country.$id);
		} else {
			onCountryClick?.(country);
		}
	}, [zoomState.level, setZoomLevel, onCountryClick]);

	// Render different views based on zoom level
	// Render different views based on zoom level
	return (
		<div ref={containerRef} className="h-full w-full overflow-hidden bg-base-100 relative">
			<AnimatePresence mode="wait">
				{zoomState.level === 'detail' && zoomState.focusedCountryId && (() => {
					const focusedCountry = countries.find(c => c.$id === zoomState.focusedCountryId);
					return focusedCountry && (
						<motion.div
							key="detail"
							initial={{ opacity: 0, scale: 0.8 }}
							animate={{ opacity: 1, scale: 1 }}
							exit={{ opacity: 0, scale: 0.5, filter: 'blur(10px)' }}
							transition={{ duration: 0.3, ease: "easeInOut" }}
							className="h-full w-full absolute inset-0 z-20"
						>
							<CountryDetailView
								country={focusedCountry}
								onBack={() => { }} // Back navigation is now handled by gestures
								onTimelineView={() => { }} // Disabled
							/>
						</motion.div>
					);
				})()}

				{zoomState.level === 'timeline' && (
					<motion.div
						key="timeline-global"
						initial={{ opacity: 0, scale: 2 }}
						animate={{
							opacity: 1,
							scale: 1,
						}}
						exit={{ opacity: 0, scale: 2, filter: 'blur(10px)' }}
						transition={{ duration: 0.5, ease: "easeInOut" }}
						className="h-full w-full absolute inset-0 z-30"
					>
						<GlobalTimelineView onBack={() => setZoomLevel('table')} />
					</motion.div>
				)}

				{zoomState.level === 'table' && (
					<motion.div
						key="table"
						initial={{ opacity: 0, scale: 0.5, filter: 'blur(10px)' }}
						animate={{ opacity: 1, scale: 1, filter: 'none' }}
						exit={{ opacity: 0, scale: 0.5, filter: 'blur(10px)' }}
						transition={{ duration: 0.3, ease: "easeInOut" }}
						className="h-full w-full absolute inset-0 bg-base-100"
					>
						<div
							className="flex flex-col h-full rounded-box border border-base-300 overflow-hidden relative"
						>
							{/* Header with zoom controls */}
							<div className="flex items-center justify-between px-4 py-2 bg-base-200/50 border-b border-base-content/10 flex-shrink-0">
								<div className="flex items-center gap-2">
									<span className="text-lg">🌍</span>
									<span className="text-sm font-medium">Infinite World Data</span>
									<span className="text-xs text-base-content/50">
										{countries.length} countries • {infiniteColumns.length} columns
									</span>
								</div>

								<div className="flex items-center gap-2">
									<span className="text-xs text-base-content/50">Pinch to zoom • Scroll to explore</span>
								</div>
							</div>

							{/* Table Header */}
							<div
								className="flex bg-base-200 border-b border-base-300 flex-shrink-0"
								style={{ minWidth: totalWidth }}
							>
								{visibleColumns.map((col) => {
									const isSorted = sort.key === ((col as any).originalKey || col.key);
									const renderer = createColumnRenderer(col);
									const actualKey = (col as any).originalKey || col.key;

									return (
										<div
											key={col.key}
											className={`
								flex items-center px-3 py-3 text-sm font-semibold select-none
								${col.sortable ? "cursor-pointer hover:bg-base-300" : ""}
								border-l border-base-300
							`}
											style={{
												width: col.width,
												minWidth: col.width,
												position: "absolute",
												left: col.virtualizedLeft,
											}}
											onClick={col.sortable ? () => handleSortClick(actualKey) : undefined}
										>
											<span className="truncate">{col.label}</span>
											{col.sortable && isSorted && (
												<span className="ml-1 text-primary">
													{sort.direction === "asc" ? "↑" : "↓"}
												</span>
											)}
										</div>
									);
								})}
							</div>

							{/* Table Body - Virtualized */}
							<div
								ref={scrollContainerRef}
								className="flex-1 overflow-auto"
								style={{ minWidth: totalWidth }}
								onScroll={handleScroll}
							>
								<div style={{ height: totalHeight, position: "relative", minWidth: totalWidth }}>
									<div
										style={{
											position: "absolute",
											top: offsetY,
											left: 0,
											right: 0,
											minWidth: totalWidth,
										}}
									>
										{visibleCountries.map((country, i) => (
											<div
												key={country.$id}
												className={`
									flex items-center hover:bg-base-200 cursor-pointer
									${(startIndex + i) % 2 === 0 ? "bg-base-100" : "bg-base-100/50"}
									${selectedCountry?.$id === country.$id ? "bg-primary/10" : ""}
									border-b border-base-200
								`}
												style={{ height: ROW_HEIGHT, minWidth: totalWidth }}
												onClick={(e) => handleCountryClick(country, e)}
											>
												{visibleColumns.map((col) => {
													const renderer = createColumnRenderer(col);

													return (
														<div
															key={col.key}
															className="flex items-center px-3 border-l border-base-200/50"
															style={{
																width: col.width,
																minWidth: col.width,
																position: "absolute",
																left: col.virtualizedLeft,
															}}
														>
															{renderer(country)}
														</div>
													);
												})}
											</div>
										))}
									</div>
								</div>

								{/* Loading indicator */}
								{loading && (
									<motion.div
										initial={{ opacity: 0 }}
										animate={{ opacity: 1 }}
										exit={{ opacity: 0 }}
										className="flex items-center justify-center py-4"
									>
										<span className="loading loading-spinner loading-md"></span>
										<span className="ml-2 text-sm text-base-content/60">Loading more data...</span>
									</motion.div>
								)}
							</div>
						</div>
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
}