"use client";

import { useState } from "react";
import type { EnhancedColumnConfig, ColumnCategory } from "../hooks/useCountries";
import { DEFAULT_COLUMNS, COLUMN_CATEGORIES, getColumnsByCategory } from "../lib/columnConfig";

type EnhancedColumnSelectorProps = {
	columns: EnhancedColumnConfig[];
	onColumnsChange: (columns: EnhancedColumnConfig[]) => void;
};

export default function EnhancedColumnSelector({ columns, onColumnsChange }: EnhancedColumnSelectorProps) {
	const [activeTab, setActiveTab] = useState<ColumnCategory>("basic");
	const [searchTerm, setSearchTerm] = useState("");

	// Group columns by category
	const columnsByCategory = Object.keys(COLUMN_CATEGORIES).reduce((acc, category) => {
		acc[category as ColumnCategory] = columns.filter(col => col.category === category);
		return acc;
	}, {} as Record<ColumnCategory, EnhancedColumnConfig[]>);

	// Filter columns by search term
	const filteredColumns = searchTerm
		? columns.filter(col => 
				col.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
				col.description?.toLowerCase().includes(searchTerm.toLowerCase())
		  )
		: columnsByCategory[activeTab];

	// Toggle column visibility
	const toggleColumn = (key: string) => {
		const updatedColumns = columns.map(col =>
			col.key === key ? { ...col, visible: !col.visible } : col
		);
		onColumnsChange(updatedColumns);
	};

	// Toggle all columns in a category
	const toggleCategory = (category: ColumnCategory) => {
		const categoryColumns = columnsByCategory[category];
		const allVisible = categoryColumns.every(col => col.visible);
		
		const updatedColumns = columns.map(col => {
			if (col.category === category) {
				return { ...col, visible: !allVisible };
			}
			return col;
		});
		
		onColumnsChange(updatedColumns);
	};

	// Reset to default columns
	const resetToDefault = () => {
		onColumnsChange(DEFAULT_COLUMNS);
	};

	// Show all columns
	const showAllColumns = () => {
		const updatedColumns = columns.map(col => ({ ...col, visible: true }));
		onColumnsChange(updatedColumns);
	};

	// Hide all columns except fixed ones
	const hideAllColumns = () => {
		const updatedColumns = columns.map(col => ({ 
			...col, 
			visible: col.fixed || false 
		}));
		onColumnsChange(updatedColumns);
	};

	const visibleCount = columns.filter(col => col.visible).length;
	const totalCount = columns.length;

	return (
		<div className="dropdown dropdown-end">
			<div tabIndex={0} role="button" className="btn btn-ghost btn-sm">
				<svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
				</svg>
				Columns ({visibleCount}/{totalCount})
				<svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
				</svg>
			</div>
			
			<div tabIndex={0} className="dropdown-content bg-base-100 rounded-box shadow-xl border border-base-300 w-96 p-4">
				{/* Header */}
				<div className="flex items-center justify-between mb-4">
					<h3 className="font-semibold">Customize Columns</h3>
					<div className="flex gap-1">
						<button className="btn btn-ghost btn-xs" onClick={resetToDefault}>
							Reset
						</button>
						<button className="btn btn-ghost btn-xs" onClick={showAllColumns}>
							Show All
						</button>
						<button className="btn btn-ghost btn-xs" onClick={hideAllColumns}>
							Hide All
						</button>
					</div>
				</div>

				{/* Search */}
				<div className="form-control mb-3">
					<input
						type="text"
						placeholder="Search columns..."
						className="input input-bordered input-sm"
						value={searchTerm}
						onChange={(e) => setSearchTerm(e.target.value)}
					/>
				</div>

				{/* Category Tabs */}
				{!searchTerm && (
					<div className="tabs tabs-boxed mb-4">
						{Object.entries(COLUMN_CATEGORIES).map(([key, config]) => (
							<button
								key={key}
								className={`tab tab-sm ${activeTab === key ? "tab-active" : ""}`}
								onClick={() => setActiveTab(key as ColumnCategory)}
							>
								<span className="mr-1">{config.icon}</span>
								{config.label}
								<span className="badge badge-ghost badge-xs ml-1">
									{columnsByCategory[key as ColumnCategory].length}
								</span>
							</button>
						))}
					</div>
				)}

				{/* Category Toggle */}
				{!searchTerm && (
					<div className="flex items-center justify-between mb-3 p-2 bg-base-200 rounded">
						<span className="text-sm font-medium">
							{COLUMN_CATEGORIES[activeTab].icon} {COLUMN_CATEGORIES[activeTab].label}
						</span>
						<button
							className="btn btn-ghost btn-xs"
							onClick={() => toggleCategory(activeTab)}
						>
							{columnsByCategory[activeTab].every(col => col.visible) ? "Hide All" : "Show All"}
						</button>
					</div>
				)}

				{/* Columns List */}
				<div className="max-h-64 overflow-y-auto space-y-1">
					{filteredColumns.map((column) => (
						<div
							key={column.key}
							className={`
								flex items-center justify-between p-2 rounded cursor-pointer
								hover:bg-base-200 ${column.fixed ? "opacity-50" : ""}
							`}
							onClick={() => !column.fixed && toggleColumn(column.key)}
						>
							<div className="flex-1 min-w-0">
								<div className="flex items-center gap-2">
									<input
										type="checkbox"
										className="checkbox checkbox-xs checkbox-primary"
										checked={column.visible}
										disabled={column.fixed}
										onChange={() => {}}
									/>
									<span className="text-sm font-medium truncate">{column.label}</span>
									{column.fixed && (
										<span className="badge badge-ghost badge-xs">Fixed</span>
									)}
								</div>
								{column.description && (
									<span className="text-xs text-base-content/50 block mt-1">
										{column.description}
									</span>
								)}
							</div>
							<div className="flex items-center gap-2 ml-2">
								<span className={`badge badge-ghost badge-xs text-${COLUMN_CATEGORIES[column.category].color}-600`}>
									{COLUMN_CATEGORIES[column.category].icon}
								</span>
								<span className="text-xs text-base-content/50 w-8 text-right">
									{column.width}px
								</span>
							</div>
						</div>
					))}
				</div>

				{/* Footer */}
				<div className="mt-4 pt-3 border-t border-base-300">
					<div className="text-xs text-base-content/50 text-center">
						{visibleCount} of {totalCount} columns visible
					</div>
				</div>
			</div>
		</div>
	);
}