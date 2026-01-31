"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import type { Country, SortConfig } from "../hooks/useCountries";
import type { ColumnConfig } from "./ColumnSelector";
import type { UserConfig } from "../hooks/useUserConfig";
import Sparkline from "./Sparkline";

type CountryTableProps = {
	countries: Country[];
	loading: boolean;
	sort: SortConfig;
	onSort: (sort: SortConfig) => void;
	onCountryClick?: (country: Country) => void;
	columns: ColumnConfig[];
	selectedCountries?: Set<string>;
	onToggleSelect?: (countryId: string) => void;
	comparisonMode?: boolean;
	userConfig: UserConfig;
};

const ROW_HEIGHT = 44;
const HEADER_HEIGHT = 32;
const OVERSCAN = 5;

function formatCompact(value: string | number | undefined): string {
	if (value == null || value === "") return "—";
	const num = typeof value === "string" ? parseFloat(value) : value;
	if (isNaN(num)) return "—";
	return Intl.NumberFormat(undefined, { notation: "compact", maximumFractionDigits: 1 }).format(num);
}

// Column definitions with renderers
const columnRenderers: Record<string, {
	width: number;
	sortable?: boolean;
	sticky?: boolean;
	render: (country: Country) => React.ReactNode;
}> = {
	flag: {
		width: 44,
		sticky: true,
		render: (c) => (
			<span className="text-xl" title={c.name}>
				{c.flag_emoji || "🏳️"}
			</span>
		),
	},
	name: {
		width: 160,
		sortable: true,
		sticky: true,
		render: (c) => (
			<div className="flex flex-col leading-tight">
				<span className="font-medium truncate text-sm">{c.name}</span>
				<span className="text-[10px] text-base-content/40">{c.iso3}</span>
			</div>
		),
	},
	capital: {
		width: 120,
		sortable: true,
		render: (c) => <span className="truncate text-sm">{c.capital || "—"}</span>,
	},
	region: {
		width: 130,
		sortable: true,
		render: (c) => (
			<div className="flex flex-col leading-tight">
				<span className="truncate text-sm">{c.region || "—"}</span>
				<span className="text-[10px] text-base-content/40 truncate">{c.subregion}</span>
			</div>
		),
	},
	population: {
		width: 90,
		sortable: true,
		render: (c) => <span className="font-mono text-sm text-right block">{formatCompact(c.population)}</span>,
	},
	area_km2: {
		width: 90,
		sortable: true,
		render: (c) => <span className="font-mono text-sm text-right block">{formatCompact(c.area_km2)}</span>,
	},
	peace_2023: {
		width: 120,
		sortable: true,
		render: (c) => (
			<Sparkline
				data={c.indices?.peace}
				color="#22c55e"
				width={50}
				height={20}
				invertColors
			/>
		),
	},
	happiness_2023: {
		width: 120,
		sortable: true,
		render: (c) => (
			<Sparkline
				data={c.indices?.happiness}
				color="#3b82f6"
				width={50}
				height={20}
			/>
		),
	},
	timezone: {
		width: 140,
		render: (c) => <span className="text-sm truncate">{c.timezone || "—"}</span>,
	},
	currency: {
		width: 80,
		render: (c) => (
			<span className="text-sm font-medium" title={c.currency_name}>
				{c.currency || "—"}
			</span>
		),
	},
	languages: {
		width: 100,
		render: (c) => (
			<div className="flex flex-wrap gap-0.5">
				{c.languages?.slice(0, 2).map((lang) => (
					<span key={lang} className="text-xs px-1 py-0.5 bg-base-200 rounded">
						{lang}
					</span>
				))}
			</div>
		),
	},
	climate: {
		width: 100,
		render: (c) => (
			<div className="flex flex-wrap gap-0.5">
				{c.climate_tags?.slice(0, 2).map((tag) => (
					<span key={tag} className="text-xs px-1 py-0.5 bg-base-200 rounded">
						{tag}
					</span>
				))}
			</div>
		),
	},
	features: {
		width: 120,
		render: (c) => (
			<div className="flex flex-wrap gap-0.5">
				{c.feature_tags?.slice(0, 2).map((tag) => (
					<span key={tag} className="text-xs px-1 py-0.5 bg-base-200 rounded">
						{tag.replace(/_/g, " ")}
					</span>
				))}
			</div>
		),
	},
};



export default function CountryTable({
	countries,
	loading,
	sort,
	onSort,
	onCountryClick,
	columns,
	selectedCountries,
	onToggleSelect,
	comparisonMode = false,
	userConfig,
}: CountryTableProps) {
	const scrollContainerRef = useRef<HTMLDivElement>(null);
	const [scrollTop, setScrollTop] = useState(0);
	const [containerHeight, setContainerHeight] = useState(800);

	// Extract config options
	const {
		scrollMode,
		rowAlternateColors,
		showGridLines,
		highlightOnHover,
	} = userConfig;

	const isTogetherMode = scrollMode === "together";

	// Filter to only visible columns
	const visibleColumns = columns.filter((c) => c.visible);

	// Calculate column widths
	const stickyColumns = visibleColumns.filter(c => columnRenderers[c.key]?.sticky);
	const scrollableColumns = visibleColumns.filter(c => !columnRenderers[c.key]?.sticky);

	const stickyWidth = stickyColumns.reduce((sum, col) => sum + (columnRenderers[col.key]?.width || 100), 0);
	const singleSetWidth = scrollableColumns.reduce((sum, col) => sum + (columnRenderers[col.key]?.width || 100), 0);

	// Handle scroll - Infinite Loop Logic
	const handleScroll = useCallback(() => {
		if (!scrollContainerRef.current) return;
		setScrollTop(scrollContainerRef.current.scrollTop);

		// Infinite horizontal loop in together mode
		if (isTogetherMode && singleSetWidth > 0) {
			const scrollLeft = scrollContainerRef.current.scrollLeft;

			// We only teleport if we are FAR enough into the buffer zones to avoid flickering
			// Buffer 1 (Left) | Buffer 2 (Center) | Buffer 3 (Right)
			// Default start is at Buffer 2 start (singleSetWidth)

			if (scrollLeft < 10) {
				// Too far left (hit start) -> Jump to middle
				scrollContainerRef.current.scrollLeft = singleSetWidth + scrollLeft;
			} else if (scrollLeft >= singleSetWidth * 2) {
				// Too far right (hit end of middle) -> Jump to start of middle
				scrollContainerRef.current.scrollLeft = scrollLeft - singleSetWidth;
			}
		}
	}, [isTogetherMode, singleSetWidth]);

	// Initialize horizontal scroll to middle set (Set 2)
	useEffect(() => {
		if (scrollContainerRef.current && singleSetWidth > 0 && isTogetherMode) {
			// Start at the beginning of the middle set
			scrollContainerRef.current.scrollLeft = singleSetWidth;
		}
	}, [singleSetWidth, isTogetherMode]);

	// Track container dimensions
	useEffect(() => {
		const updateDimensions = () => {
			if (scrollContainerRef.current) {
				setContainerHeight(scrollContainerRef.current.clientHeight);
			}
		};

		updateDimensions();

		const resizeObserver = new ResizeObserver(updateDimensions);
		if (scrollContainerRef.current) {
			resizeObserver.observe(scrollContainerRef.current);
		}
		return () => resizeObserver.disconnect();
	}, []);

	// Calculate visible rows (virtualized vertical scroll)
	const startIndex = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - OVERSCAN);
	const visibleCount = Math.ceil(containerHeight / ROW_HEIGHT) + OVERSCAN * 2;
	const endIndex = Math.min(countries.length, startIndex + visibleCount);
	const visibleCountries = countries.slice(startIndex, endIndex);
	const totalHeight = countries.length * ROW_HEIGHT;
	const offsetY = startIndex * ROW_HEIGHT;

	// Handle sort click
	const handleSortClick = (key: string) => {
		if (sort.key === key) {
			onSort({ key: key as SortConfig["key"], direction: sort.direction === "asc" ? "desc" : "asc" });
		} else {
			onSort({ key: key as SortConfig["key"], direction: "asc" });
		}
	};

	// Get row background classes based on config
	const getRowBgClass = (rowIndex: number, isSelected: boolean) => {
		if (isSelected) return "bg-primary/10";
		if (rowAlternateColors) {
			return rowIndex % 2 === 0 ? "bg-base-100" : "bg-base-200/30";
		}
		return "bg-base-100";
	};

	const borderClass = showGridLines ? "border-r border-base-content/5" : "";

	// Render a single row (header or data)
	const renderRow = (country: Country | null, rowIndex: number, isHeader: boolean = false) => {
		const isSelected = country ? selectedCountries?.has(country.$id) : false;
		const bgClass = isHeader ? "bg-base-200/50" : getRowBgClass(rowIndex, !!isSelected);
		const height = isHeader ? HEADER_HEIGHT : ROW_HEIGHT;

		// Calculate cumulative left positions for sticky columns
		const getStickyLeft = (colIndex: number) => {
			let left = comparisonMode ? 36 : 0;
			for (let i = 0; i < colIndex; i++) {
				const col = stickyColumns[i];
				left += columnRenderers[col.key]?.width || 100;
			}
			return left;
		};

		// For infinite mode, we render 3 sets of scrollable columns
		const scrollableSets = isTogetherMode ? [0, 1, 2] : [0];

		return (
			<div
				className={`flex ${bgClass} ${!isHeader && highlightOnHover ? "hover:!bg-base-content/5" : ""} ${!isHeader ? "cursor-pointer" : ""}`}
				style={{ height, width: stickyWidth + (isTogetherMode ? singleSetWidth * 3 : singleSetWidth) + (comparisonMode ? 36 : 0) }}
				onClick={!isHeader && country ? () => {
					if (comparisonMode && onToggleSelect) {
						onToggleSelect(country.$id);
					} else {
						onCountryClick?.(country);
					}
				} : undefined}
			>
				{/* Comparison checkbox */}
				{comparisonMode && (
					<div
						className={`sticky left-0 z-20 bg-base-100 ${borderClass}`}
						style={{ width: 36, height }}
						onClick={!isHeader && country ? (e) => {
							e.stopPropagation();
							onToggleSelect?.(country.$id);
						} : undefined}
					>
						<div className={`flex items-center justify-center px-2 w-full h-full ${bgClass}`}>
							{isHeader ? (
								<span className="text-[10px] text-base-content/40">SEL</span>
							) : country && (
								<input
									type="checkbox"
									className="checkbox checkbox-xs checkbox-primary"
									checked={!!isSelected}
									onChange={() => { }}
								/>
							)}
						</div>
					</div>
				)}

				{/* Sticky columns */}
				{stickyColumns.map((col, colIndex) => {
					const renderer = columnRenderers[col.key];
					const isSorted = sort.key === col.key;
					const leftPos = getStickyLeft(colIndex);

					if (isHeader) {
						return (
							<div
								key={col.key}
								className={`
									sticky z-20 bg-base-100 ${borderClass}
									${renderer?.sortable ? "cursor-pointer" : ""}
								`}
								style={{ width: renderer?.width || 100, minWidth: renderer?.width || 100, height, left: leftPos }}
								onClick={renderer?.sortable ? () => handleSortClick(col.key) : undefined}
							>
								<div className={`
									flex items-center px-2 text-xs font-semibold select-none uppercase tracking-wide
									text-base-content/50 w-full h-full ${bgClass}
									${renderer?.sortable ? "hover:text-base-content hover:bg-base-content/5" : ""}
								`}>
									<span className="truncate">{col.label}</span>
									{renderer?.sortable && isSorted && (
										<span className="ml-1 text-primary">{sort.direction === "asc" ? "↑" : "↓"}</span>
									)}
								</div>
							</div>
						);
					}

					return (
						<div
							key={col.key}
							className={`sticky z-20 bg-base-100 ${borderClass}`}
							style={{ width: renderer?.width || 100, minWidth: renderer?.width || 100, height, left: leftPos }}
						>
							<div className={`flex items-center px-2 w-full h-full ${bgClass}`}>
								{country && renderer?.render(country)}
							</div>
						</div>
					);
				})}

				{/* Scrollable columns - Loop for infinite scroll */}
				{scrollableSets.map((setIndex) => (
					scrollableColumns.map((col) => {
						const key = isTogetherMode ? `${col.key}-${setIndex}` : col.key;
						const renderer = columnRenderers[col.key];
						const isSorted = sort.key === col.key;

						if (isHeader) {
							return (
								<div
									key={key}
									className={`
										flex items-center px-2 text-xs font-semibold select-none uppercase tracking-wide
										text-base-content/50 ${borderClass}
										${renderer?.sortable ? "cursor-pointer hover:text-base-content hover:bg-base-content/5" : ""}
									`}
									style={{ width: renderer?.width || 100, minWidth: renderer?.width || 100, height }}
									onClick={renderer?.sortable ? () => handleSortClick(col.key) : undefined}
								>
									<span className="truncate">{col.label}</span>
									{renderer?.sortable && isSorted && (
										<span className="ml-1 text-primary">{sort.direction === "asc" ? "↑" : "↓"}</span>
									)}
								</div>
							);
						}

						return (
							<div
								key={key}
								className={`flex items-center px-2 ${borderClass}`}
								style={{ width: renderer?.width || 100, minWidth: renderer?.width || 100, height }}
							>
								{country && renderer?.render(country)}
							</div>
						);
					})
				))}
			</div>
		);
		// Together mode render logic
		if (isTogetherMode) {
			const totalWidth = stickyWidth + (singleSetWidth * 3) + (comparisonMode ? 36 : 0);

			return (
				<div className="h-full w-full bg-base-100 overflow-hidden relative">
					<div
						ref={scrollContainerRef}
						className="h-full w-full overflow-auto overscroll-x-none"
						onScroll={handleScroll}
					>
						{/* Content wrapper */}
						<div style={{ width: totalWidth, height: totalHeight + HEADER_HEIGHT, position: "relative" }}>
							{/* Header - sticky at top */}
							<div className={`sticky top-0 z-30 ${showGridLines ? "border-b border-base-content/10" : ""}`}>
								{renderRow(null, -1, true)}
							</div>

							{/* Virtualized body rows */}
							<div style={{ position: "absolute", top: HEADER_HEIGHT + offsetY, left: 0, width: "100%" }}>
								{visibleCountries.map((country, i) => (
									<div key={country.$id}>
										{renderRow(country, startIndex + i)}
									</div>
								))}
							</div>
						</div>
					</div>

					{loading && (
						<div className="absolute inset-0 bg-base-100/80 flex items-center justify-center z-50">
							<span className="loading loading-spinner loading-lg"></span>
						</div>
					)}
				</div>
			);
		}

		// Individual mode: each row scrolls independently
		return (
			<div className="h-full w-full bg-base-100 overflow-hidden relative flex flex-col">
				{/* Header */}
				<div className={`flex flex-shrink-0 ${showGridLines ? "border-b border-base-content/10" : ""}`}>
					{/* Sticky header columns */}
					<div className="flex bg-base-200/50">
						{comparisonMode && (
							<div className={`flex items-center justify-center px-2 ${borderClass}`} style={{ width: 36, height: HEADER_HEIGHT }}>
								<span className="text-[10px] text-base-content/40">SEL</span>
							</div>
						)}
						{stickyColumns.map((col) => {
							const renderer = columnRenderers[col.key];
							const isSorted = sort.key === col.key;
							return (
								<div
									key={col.key}
									className={`flex items-center px-2 text-xs font-semibold select-none uppercase tracking-wide text-base-content/50 ${borderClass} ${renderer?.sortable ? "cursor-pointer hover:text-base-content hover:bg-base-content/5" : ""}`}
									style={{ width: renderer?.width || 100, height: HEADER_HEIGHT }}
									onClick={renderer?.sortable ? () => handleSortClick(col.key) : undefined}
								>
									<span className="truncate">{col.label}</span>
									{renderer?.sortable && isSorted && <span className="ml-1 text-primary">{sort.direction === "asc" ? "↑" : "↓"}</span>}
								</div>
							);
						})}
					</div>
					{/* Scrollable header */}
					<div className="flex-1 overflow-x-auto scrollbar-hide bg-base-200/50">
						<div className="flex" style={{ width: singleSetWidth }}>
							{scrollableColumns.map((col) => {
								const renderer = columnRenderers[col.key];
								const isSorted = sort.key === col.key;
								return (
									<div
										key={col.key}
										className={`flex items-center px-2 text-xs font-semibold select-none uppercase tracking-wide text-base-content/50 ${borderClass} ${renderer?.sortable ? "cursor-pointer hover:text-base-content hover:bg-base-content/5" : ""}`}
										style={{ width: renderer?.width || 100, height: HEADER_HEIGHT }}
										onClick={renderer?.sortable ? () => handleSortClick(col.key) : undefined}
									>
										<span className="truncate">{col.label}</span>
										{renderer?.sortable && isSorted && <span className="ml-1 text-primary">{sort.direction === "asc" ? "↑" : "↓"}</span>}
									</div>
								);
							})}
						</div>
					</div>
				</div>

				{/* Body */}
				<div ref={scrollContainerRef} className="flex-1 overflow-y-auto" onScroll={handleScroll}>
					<div style={{ height: totalHeight, position: "relative" }}>
						<div style={{ position: "absolute", top: offsetY, left: 0, right: 0 }}>
							{visibleCountries.map((country, i) => {
								const rowIndex = startIndex + i;
								const isSelected = selectedCountries?.has(country.$id);
								const bgClass = getRowBgClass(rowIndex, !!isSelected);

								return (
									<div
										key={country.$id}
										className={`flex ${highlightOnHover ? "hover:!bg-base-content/5" : ""} cursor-pointer`}
										style={{ height: ROW_HEIGHT }}
										onClick={() => {
											if (comparisonMode && onToggleSelect) onToggleSelect(country.$id);
											else onCountryClick?.(country);
										}}
									>
										{/* Sticky columns */}
										<div className={`flex sticky left-0 z-10 ${bgClass}`}>
											{comparisonMode && (
												<div
													className={`flex items-center justify-center px-2 ${borderClass}`}
													style={{ width: 36, height: ROW_HEIGHT }}
													onClick={(e) => { e.stopPropagation(); onToggleSelect?.(country.$id); }}
												>
													<input type="checkbox" className="checkbox checkbox-xs checkbox-primary" checked={!!isSelected} onChange={() => { }} />
												</div>
											)}
											{stickyColumns.map((col) => {
												const renderer = columnRenderers[col.key];
												return (
													<div key={col.key} className={`flex items-center px-2 ${borderClass}`} style={{ width: renderer?.width || 100, height: ROW_HEIGHT }}>
														{renderer?.render(country)}
													</div>
												);
											})}
										</div>
										{/* Scrollable columns */}
										<div className={`flex-1 overflow-x-auto scrollbar-hide ${bgClass}`}>
											<div className="flex" style={{ width: singleSetWidth }}>
												{scrollableColumns.map((col) => {
													const renderer = columnRenderers[col.key];
													return (
														<div key={col.key} className={`flex items-center px-2 ${borderClass}`} style={{ width: renderer?.width || 100, height: ROW_HEIGHT }}>
															{renderer?.render(country)}
														</div>
													);
												})}
											</div>
										</div>
									</div>
								);
							})}
						</div>
					</div>
				</div>

				{loading && (
					<div className="absolute inset-0 bg-base-100/80 flex items-center justify-center z-50">
						<span className="loading loading-spinner loading-lg"></span>
					</div>
				)}
			</div>
		);
	}

	// Individual mode...
	return (
		<div className="h-full w-full bg-base-100 overflow-hidden relative flex flex-col">
			{/* ...existing individual mode code... */}
			{/* Header */}
			<div className={`flex flex-shrink-0 ${showGridLines ? "border-b border-base-content/10" : ""}`}>
				{/* ...header content... */}
				{/* Sticky header columns */}
				<div className="flex bg-base-200/50">
					{comparisonMode && (
						<div className={`flex items-center justify-center px-2 ${borderClass}`} style={{ width: 36, height: HEADER_HEIGHT }}>
							<span className="text-[10px] text-base-content/40">SEL</span>
						</div>
					)}
					{stickyColumns.map((col) => {
						const renderer = columnRenderers[col.key];
						const isSorted = sort.key === col.key;
						return (
							<div
								key={col.key}
								className={`flex items-center px-2 text-xs font-semibold select-none uppercase tracking-wide text-base-content/50 ${borderClass} ${renderer?.sortable ? "cursor-pointer hover:text-base-content hover:bg-base-content/5" : ""}`}
								style={{ width: renderer?.width || 100, height: HEADER_HEIGHT }}
								onClick={renderer?.sortable ? () => handleSortClick(col.key) : undefined}
							>
								<span className="truncate">{col.label}</span>
								{renderer?.sortable && isSorted && <span className="ml-1 text-primary">{sort.direction === "asc" ? "↑" : "↓"}</span>}
							</div>
						);
					})}
				</div>
				{/* Scrollable header */}
				<div className="flex-1 overflow-x-auto scrollbar-hide bg-base-200/50">
					<div className="flex" style={{ width: singleSetWidth }}>
						{scrollableColumns.map((col) => {
							const renderer = columnRenderers[col.key];
							const isSorted = sort.key === col.key;
							return (
								<div
									key={col.key}
									className={`flex items-center px-2 text-xs font-semibold select-none uppercase tracking-wide text-base-content/50 ${borderClass} ${renderer?.sortable ? "cursor-pointer hover:text-base-content hover:bg-base-content/5" : ""}`}
									style={{ width: renderer?.width || 100, height: HEADER_HEIGHT }}
									onClick={renderer?.sortable ? () => handleSortClick(col.key) : undefined}
								>
									<span className="truncate">{col.label}</span>
									{renderer?.sortable && isSorted && <span className="ml-1 text-primary">{sort.direction === "asc" ? "↑" : "↓"}</span>}
								</div>
							);
						})}
					</div>
				</div>
			</div>

			{/* Body */}
			<div ref={scrollContainerRef} className="flex-1 overflow-y-auto" onScroll={handleScroll}>
				<div style={{ height: totalHeight, position: "relative" }}>
					<div style={{ position: "absolute", top: offsetY, left: 0, right: 0 }}>
						{visibleCountries.map((country, i) => {
							const rowIndex = startIndex + i;
							const isSelected = selectedCountries?.has(country.$id);
							const bgClass = getRowBgClass(rowIndex, !!isSelected);

							return (
								<div
									key={country.$id}
									className={`flex ${highlightOnHover ? "hover:!bg-base-content/5" : ""} cursor-pointer`}
									style={{ height: ROW_HEIGHT }}
									onClick={() => {
										if (comparisonMode && onToggleSelect) onToggleSelect(country.$id);
										else onCountryClick?.(country);
									}}
								>
									{/* Sticky columns */}
									<div className={`flex sticky left-0 z-10 ${bgClass}`}>
										{comparisonMode && (
											<div
												className={`flex items-center justify-center px-2 ${borderClass}`}
												style={{ width: 36, height: ROW_HEIGHT }}
												onClick={(e) => { e.stopPropagation(); onToggleSelect?.(country.$id); }}
											>
												<input type="checkbox" className="checkbox checkbox-xs checkbox-primary" checked={!!isSelected} onChange={() => { }} />
											</div>
										)}
										{stickyColumns.map((col) => {
											const renderer = columnRenderers[col.key];
											return (
												<div key={col.key} className={`flex items-center px-2 ${borderClass}`} style={{ width: renderer?.width || 100, height: ROW_HEIGHT }}>
													{renderer?.render(country)}
												</div>
											);
										})}
									</div>
									{/* Scrollable columns */}
									<div className={`flex-1 overflow-x-auto scrollbar-hide ${bgClass}`}>
										<div className="flex" style={{ width: singleSetWidth }}>
											{scrollableColumns.map((col) => {
												const renderer = columnRenderers[col.key];
												return (
													<div key={col.key} className={`flex items-center px-2 ${borderClass}`} style={{ width: renderer?.width || 100, height: ROW_HEIGHT }}>
														{renderer?.render(country)}
													</div>
												);
											})}
										</div>
									</div>
								</div>
							);
						})}
					</div>
				</div>
			</div>

			{loading && (
				<div className="absolute inset-0 bg-base-100/80 flex items-center justify-center z-50">
					<span className="loading loading-spinner loading-lg"></span>
				</div>
			)}
		</div>
	);
}
