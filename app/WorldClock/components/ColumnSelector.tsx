"use client";

import { useState, useRef, useEffect } from "react";

export type ColumnConfig = {
	key: string;
	label: string;
	visible: boolean;
	locked?: boolean; // Can't be hidden (e.g., flag, name)
};

type ColumnSelectorProps = {
	columns: ColumnConfig[];
	onChange: (columns: ColumnConfig[]) => void;
};

export default function ColumnSelector({ columns, onChange }: ColumnSelectorProps) {
	const [isOpen, setIsOpen] = useState(false);
	const dropdownRef = useRef<HTMLDivElement>(null);

	// Close on click outside
	useEffect(() => {
		function handleClickOutside(event: MouseEvent) {
			if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
				setIsOpen(false);
			}
		}
		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, []);

	const toggleColumn = (key: string) => {
		const updated = columns.map((col) =>
			col.key === key && !col.locked ? { ...col, visible: !col.visible } : col
		);
		onChange(updated);
	};

	const showAll = () => {
		onChange(columns.map((col) => ({ ...col, visible: true })));
	};

	const showMinimal = () => {
		const minimalKeys = ["flag", "name", "capital", "region", "population", "peace_2023"];
		onChange(
			columns.map((col) => ({
				...col,
				visible: col.locked || minimalKeys.includes(col.key),
			}))
		);
	};

	const visibleCount = columns.filter((c) => c.visible).length;

	return (
		<div className="relative" ref={dropdownRef}>
			<button
				className="btn btn-sm btn-ghost gap-2"
				onClick={() => setIsOpen(!isOpen)}
			>
				<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						strokeLinecap="round"
						strokeLinejoin="round"
						strokeWidth={2}
						d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2"
					/>
				</svg>
				Columns
				<span className="badge badge-sm badge-primary">{visibleCount}</span>
			</button>

			{isOpen && (
				<div className="absolute right-0 top-full mt-2 bg-base-100 border border-base-300 rounded-lg shadow-xl z-50 min-w-[220px]">
					<div className="p-2 border-b border-base-200">
						<div className="flex gap-2">
							<button className="btn btn-xs btn-ghost flex-1" onClick={showAll}>
								Show All
							</button>
							<button className="btn btn-xs btn-ghost flex-1" onClick={showMinimal}>
								Minimal
							</button>
						</div>
					</div>
					<div className="max-h-[300px] overflow-y-auto p-2">
						{columns.map((col) => (
							<label
								key={col.key}
								className={`flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer hover:bg-base-200 ${
									col.locked ? "opacity-50 cursor-not-allowed" : ""
								}`}
							>
								<input
									type="checkbox"
									className="checkbox checkbox-sm checkbox-primary"
									checked={col.visible}
									onChange={() => toggleColumn(col.key)}
									disabled={col.locked}
								/>
								<span className="text-sm">{col.label}</span>
								{col.locked && (
									<span className="text-xs text-base-content/40 ml-auto">locked</span>
								)}
							</label>
						))}
					</div>
				</div>
			)}
		</div>
	);
}
