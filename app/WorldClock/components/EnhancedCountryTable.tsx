"use client";

import { useCallback, useRef, useEffect, useState, useMemo } from "react";
import type { Country, SortConfig } from "../hooks/useCountries";
import type { EnhancedColumnConfig } from "../lib/columnConfig";
import Sparkline from "./Sparkline";

type EnhancedCountryTableProps = {
	countries: Country[];
	loading: boolean;
	hasMore: boolean;
	onLoadMore: () => void;
	sort: SortConfig;
	onSort: (sort: SortConfig) => void;
	onCountryClick?: (country: Country) => void;
	columns: EnhancedColumnConfig[];
	selectedCountries?: Set<string>;
	onToggleSelect?: (countryId: string) => void;
	comparisonMode?: boolean;
};

const ROW_HEIGHT = 48;
const OVERSCAN = 5;
// Column width constraints (for reference)
// const MIN_COLUMN_WIDTH = 80;
// const MAX_COLUMN_WIDTH = 300;

// Enhanced formatters for different data types
function formatValue(value: unknown, dataType: string): string {
	if (value == null || value === "") return "—";
	
	switch (dataType) {
		case "currency": {
			const num = typeof value === "string" ? parseFloat(value) : typeof value === "number" ? value : NaN;
			if (isNaN(num)) return "—";
			return new Intl.NumberFormat("en-US", {
				style: "currency",
				currency: "USD",
				minimumFractionDigits: 0,
				maximumFractionDigits: 0,
			}).format(num);
		}
			
		case "number": {
			const numVal = typeof value === "string" ? parseFloat(value) : typeof value === "number" ? value : NaN;
			if (isNaN(numVal)) return "—";
			return numVal.toLocaleString();
		}
			
		case "rank": {
			const rankVal = typeof value === "string" ? parseInt(value) : typeof value === "number" ? value : NaN;
			if (isNaN(rankVal)) return "—";
			return `#${rankVal}`;
		}
			
		default:
			return String(value);
	}
}

// Column renderers for different data types
const createColumnRenderer = (column: EnhancedColumnConfig) => {
	const { key, dataType } = column;
	
	switch (dataType) {
		case "flag":
			return (country: Country) => (
				<span className="text-2xl" title={country.name}>
					{country.flag_emoji || "🏳️"}
				</span>
			);
			
		case "text":
			if (key === "name") {
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
			return (country: Country) => (
				<span className="truncate">{formatValue(country[key as keyof Country], dataType)}</span>
			);
			
		case "number":
		case "currency":
		case "rank":
			return (country: Country) => {
				const value = country[key as keyof Country];
				return (
					<span className="font-mono text-right block w-full">
						{formatValue(value, dataType)}
					</span>
				);
			};
			
		case "badge":
			if (key === "languages") {
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
			if (key === "climate") {
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
			if (key === "features") {
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
			if (key === "currency") {
				return (country: Country) => (
					<span className="badge badge-ghost badge-sm" title={country.currency_name}>
						{country.currency || "—"}
					</span>
				);
			}
			return (country: Country) => <span>{formatValue(country[key as keyof Country], dataType)}</span>;
			
		case "sparkline":
			if (key === "peace_2023") {
				return (country: Country) => (
					<Sparkline
						data={country.indices?.peace}
						color="#22c55e"
						width={60}
						height={24}
						invertColors
					/>
				);
			}
			if (key === "happiness_2023") {
				return (country: Country) => (
					<Sparkline
						data={country.indices?.happiness}
						color="#3b82f6"
						width={60}
						height={24}
					/>
				);
			}
			return () => null;
			
		default:
			return (country: Country) => <span>{formatValue(country[key as keyof Country], dataType)}</span>;
	}
};

export default function EnhancedCountryTable({
	countries,
	loading,
	hasMore,
	onLoadMore,
	sort,
	onSort,
	onCountryClick,
	columns,
	selectedCountries,
	onToggleSelect,
	comparisonMode = false,
}: EnhancedCountryTableProps) {
	const containerRef = useRef<HTMLDivElement>(null);
	const horizontalScrollRef = useRef<HTMLDivElement>(null);
	const [scrollTop, setScrollTop] = useState(0);
	const [scrollLeft, setScrollLeft] = useState(0);
	const [containerHeight, setContainerHeight] = useState(600);
	const [containerWidth, setContainerWidth] = useState(800);

	// Filter to only visible columns
	const visibleColumns = useMemo(() => columns.filter((c) => c.visible), [columns]);
	const fixedColumns = useMemo(() => visibleColumns.filter((c) => c.fixed), [visibleColumns]);
	const scrollableColumns = useMemo(() => visibleColumns.filter((c) => !c.fixed), [visibleColumns]);

	// Calculate total width
	const totalWidth = useMemo(() => {
		return visibleColumns.reduce((sum, col) => sum + col.width, 0) + (comparisonMode ? 40 : 0);
	}, [visibleColumns, comparisonMode]);

	// Calculate visible columns for horizontal virtualization
	const visibleScrollableColumns = useMemo(() => {
		if (scrollableColumns.length === 0) return [];
		
		let accumulatedWidth = (comparisonMode ? 40 : 0) + fixedColumns.reduce((sum, col) => sum + col.width, 0);
		const visible = [];
		
		for (let i = 0; i < scrollableColumns.length; i++) {
			const col = scrollableColumns[i];
			const colEnd = accumulatedWidth + col.width;
			
			// Show column if it's visible or adjacent to viewport (for smoother scrolling)
			if (colEnd >= scrollLeft - 200 && accumulatedWidth <= scrollLeft + containerWidth + 200) {
				visible.push({ ...col, virtualizedLeft: accumulatedWidth });
			}
			
			accumulatedWidth = colEnd;
			if (accumulatedWidth > scrollLeft + containerWidth + 400) break;
		}
		
		return visible;
	}, [scrollableColumns, scrollLeft, containerWidth, fixedColumns, comparisonMode]);

	// Handle scroll
	const handleScroll = useCallback(() => {
		if (!containerRef.current) return;
		const { scrollTop, scrollLeft } = containerRef.current;
		setScrollTop(scrollTop);
		setScrollLeft(scrollLeft);

		// Trigger load more when near bottom
		const { scrollHeight, clientHeight } = containerRef.current;
		if (scrollTop + clientHeight >= scrollHeight - 200 && hasMore && !loading) {
			onLoadMore();
		}
	}, [hasMore, loading, onLoadMore]);

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

	// Calculate visible rows
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

	// Calculate sticky positions for fixed columns
	const getFixedLeft = (colIndex: number) => {
		let left = comparisonMode ? 40 : 0;
		for (let i = 0; i < colIndex; i++) {
			left += fixedColumns[i].width;
		}
		return left;
	};

	return (
		<div className="flex flex-col h-full bg-base-100 rounded-box border border-base-300 overflow-hidden">
			{/* Header */}
			<div className="flex bg-base-200 border-b border-base-300 flex-shrink-0" style={{ minWidth: totalWidth }}>
				{/* Comparison checkbox header */}
				{comparisonMode && (
					<div
						className="flex items-center justify-center px-2 py-3 sticky left-0 z-20 bg-base-200 border-r border-base-300"
						style={{ width: 40, minWidth: 40 }}
					>
						<span className="text-xs text-base-content/50">Select</span>
					</div>
				)}

				{/* Fixed columns */}
				{fixedColumns.map((col, i) => {
					const isSorted = sort.key === col.key;
					const stickyLeft = getFixedLeft(i);

					return (
						<div
							key={col.key}
							className={`
								flex items-center px-3 py-3 text-sm font-semibold select-none
								sticky z-20 bg-base-200
								${col.sortable ? "cursor-pointer hover:bg-base-300" : ""}
								${i > 0 ? "border-l border-base-300" : ""}
							`}
							style={{
								width: col.width,
								minWidth: col.width,
								left: stickyLeft,
							}}
							onClick={col.sortable ? () => handleSortClick(col.key) : undefined}
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

				{/* Scrollable columns */}
				<div
					ref={horizontalScrollRef}
					className="flex"
					style={{ 
						width: scrollableColumns.reduce((sum, col) => sum + col.width, 0),
						marginLeft: fixedColumns.reduce((sum, col) => sum + col.width, 0) + (comparisonMode ? 40 : 0)
					}}
				>
					{visibleScrollableColumns.map((col) => {
						const isSorted = sort.key === col.key;

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
								onClick={col.sortable ? () => handleSortClick(col.key) : undefined}
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
			</div>

			{/* Body - Virtualized */}
			<div
				ref={containerRef}
				className="flex-1 overflow-auto"
				onScroll={handleScroll}
				style={{ minWidth: totalWidth }}
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
						{visibleCountries.map((country, i) => {
							const isSelected = selectedCountries?.has(country.$id);
							return (
								<div
									key={country.$id}
									className={`
										flex items-center hover:bg-base-200 cursor-pointer
										${(startIndex + i) % 2 === 0 ? "bg-base-100" : "bg-base-100/50"}
										${isSelected ? "bg-primary/10" : ""}
										border-b border-base-200
									`}
									style={{ height: ROW_HEIGHT, minWidth: totalWidth }}
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
										<div
											className="flex items-center justify-center px-2 sticky left-0 z-10 bg-inherit border-r border-base-200/50"
											style={{ width: 40, minWidth: 40 }}
											onClick={(e) => {
												e.stopPropagation();
												onToggleSelect?.(country.$id);
											}}
										>
											<input
												type="checkbox"
												className="checkbox checkbox-sm checkbox-primary"
												checked={isSelected}
												onChange={() => {}}
											/>
										</div>
									)}

									{/* Fixed columns */}
									{fixedColumns.map((col, colIndex) => {
										const renderer = createColumnRenderer(col);
										const stickyLeft = getFixedLeft(colIndex);

										return (
											<div
												key={col.key}
												className={`
													flex items-center px-3 sticky z-10 bg-inherit
													${colIndex > 0 ? "border-l border-base-200/50" : ""}
												`}
												style={{
													width: col.width,
													minWidth: col.width,
													left: stickyLeft,
												}}
											>
												{renderer(country)}
											</div>
										);
									})}

									{/* Scrollable columns */}
									<div
										className="flex"
										style={{ 
											width: scrollableColumns.reduce((sum, col) => sum + col.width, 0),
											marginLeft: fixedColumns.reduce((sum, col) => sum + col.width, 0) + (comparisonMode ? 40 : 0)
										}}
									>
										{visibleScrollableColumns.map((col) => {
											const renderer = createColumnRenderer(col);

											return (
												<div
													key={col.key}
													className={`
														flex items-center px-3
														border-l border-base-200/50
													`}
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
								</div>
							);
						})}
					</div>
				</div>

				{/* Loading indicator */}
				{loading && (
					<div className="flex items-center justify-center py-4">
						<span className="loading loading-spinner loading-md"></span>
						<span className="ml-2 text-sm text-base-content/60">Loading more...</span>
					</div>
				)}
			</div>

			{/* Footer */}
			<div className="flex items-center justify-between px-4 py-2 bg-base-200 border-t border-base-300 flex-shrink-0">
				<span className="text-sm text-base-content/60">
					Showing {countries.length} countries
					{comparisonMode && selectedCountries && selectedCountries.size > 0 && (
						<span className="ml-2 badge badge-primary badge-sm">
							{selectedCountries.size} selected
						</span>
					)}
				</span>
				{hasMore && !loading && (
					<button className="btn btn-xs btn-ghost" onClick={onLoadMore}>
						Load more
					</button>
				)}
			</div>
		</div>
	);
}