"use client";

export type ViewMode = "table" | "cards";

type ViewToggleProps = {
	view: ViewMode;
	onChange: (view: ViewMode) => void;
};

export default function ViewToggle({ view, onChange }: ViewToggleProps) {
	return (
		<div className="join">
			<button
				className={`join-item btn btn-sm ${view === "table" ? "btn-active" : ""}`}
				onClick={() => onChange("table")}
				title="Table view"
			>
				<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						strokeLinecap="round"
						strokeLinejoin="round"
						strokeWidth={2}
						d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
					/>
				</svg>
			</button>
			<button
				className={`join-item btn btn-sm ${view === "cards" ? "btn-active" : ""}`}
				onClick={() => onChange("cards")}
				title="Cards view"
			>
				<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						strokeLinecap="round"
						strokeLinejoin="round"
						strokeWidth={2}
						d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z"
					/>
				</svg>
			</button>
		</div>
	);
}
