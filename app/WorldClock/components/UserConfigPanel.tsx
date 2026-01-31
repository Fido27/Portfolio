"use client";

import { useState, useRef, useEffect } from "react";
import type { UserConfig } from "../hooks/useUserConfig";

type UserConfigPanelProps = {
	config: UserConfig;
	onChange: (updates: Partial<UserConfig>) => void;
	onReset: () => void;
};

type ConfigSection = {
	title: string;
	options: ConfigOption[];
};

type ConfigOption = {
	key: keyof UserConfig;
	label: string;
	description: string;
	type: "toggle" | "select";
	disabled?: boolean;
	comingSoon?: boolean;
	selectOptions?: { value: string; label: string }[];
};

const CONFIG_SECTIONS: ConfigSection[] = [
	{
		title: "Scroll Behavior",
		options: [
			{
				key: "scrollMode",
				label: "Horizontal Scroll Mode",
				description: "All columns move together (default) or each row scrolls on its own",
				type: "select",
				selectOptions: [
					{ value: "together", label: "Infinite Scroll (Optimized)" },
					{ value: "individual", label: "Each row independent" },
				],
			},
		],
	},
	{
		title: "Display",
		options: [
			{
				key: "rowAlternateColors",
				label: "Alternate Row Colors",
				description: "Zebra striping for easier reading",
				type: "toggle",
			},
			{
				key: "showGridLines",
				label: "Show Grid Lines",
				description: "Subtle borders between cells",
				type: "toggle",
			},
			{
				key: "highlightOnHover",
				label: "Highlight on Hover",
				description: "Highlight rows when hovering",
				type: "toggle",
			},
			{
				key: "compactMode",
				label: "Compact Mode",
				description: "Reduce row height for more data",
				type: "toggle",
				comingSoon: true,
			},
		],
	},
	{
		title: "Layout",
		options: [
			{
				key: "flipTable",
				label: "Flip Table",
				description: "Swap rows and columns",
				type: "toggle",
				comingSoon: true,
			},
		],
	},
];

export default function UserConfigPanel({ config, onChange, onReset }: UserConfigPanelProps) {
	const [isOpen, setIsOpen] = useState(false);
	const panelRef = useRef<HTMLDivElement>(null);

	// Close on click outside
	useEffect(() => {
		function handleClickOutside(event: MouseEvent) {
			if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
				setIsOpen(false);
			}
		}
		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, []);

	const handleToggle = (key: keyof UserConfig) => {
		onChange({ [key]: !config[key] });
	};

	const handleSelect = (key: keyof UserConfig, value: string) => {
		onChange({ [key]: value });
	};

	return (
		<div className="relative" ref={panelRef}>
			<button
				className={`btn btn-sm btn-ghost ${isOpen ? "btn-active" : ""}`}
				onClick={() => setIsOpen(!isOpen)}
				title="Settings"
			>
				<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						strokeLinecap="round"
						strokeLinejoin="round"
						strokeWidth={2}
						d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
					/>
					<path
						strokeLinecap="round"
						strokeLinejoin="round"
						strokeWidth={2}
						d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
					/>
				</svg>
			</button>

			{isOpen && (
				<div className="absolute right-0 top-full mt-2 bg-base-100 border border-base-300 rounded-lg shadow-xl z-50 w-[320px]">
					{/* Header */}
					<div className="flex items-center justify-between px-4 py-3 border-b border-base-200">
						<h3 className="font-semibold text-sm">Settings</h3>
						<button
							className="text-xs text-base-content/50 hover:text-base-content"
							onClick={onReset}
						>
							Reset to defaults
						</button>
					</div>

					{/* Sections */}
					<div className="max-h-[400px] overflow-y-auto">
						{CONFIG_SECTIONS.map((section) => (
							<div key={section.title} className="border-b border-base-200 last:border-b-0">
								<div className="px-4 py-2 bg-base-200/50">
									<span className="text-xs font-semibold uppercase tracking-wide text-base-content/50">
										{section.title}
									</span>
								</div>
								<div className="px-4 py-2 space-y-3">
									{section.options.map((option) => (
										<div
											key={option.key}
											className={`${option.comingSoon ? "opacity-50" : ""}`}
										>
											<div className="flex items-center justify-between">
												<div className="flex-1 min-w-0 pr-3">
													<div className="flex items-center gap-2">
														<span className="text-sm font-medium">{option.label}</span>
														{option.comingSoon && (
															<span className="text-[10px] px-1.5 py-0.5 bg-base-300 rounded text-base-content/50">
																Soon
															</span>
														)}
													</div>
													<p className="text-xs text-base-content/50 mt-0.5">
														{option.description}
													</p>
												</div>

												{option.type === "toggle" && (
													<input
														type="checkbox"
														className="toggle toggle-sm toggle-primary"
														checked={config[option.key] as boolean}
														onChange={() => handleToggle(option.key)}
														disabled={option.comingSoon}
													/>
												)}

												{option.type === "select" && (
													<select
														className="select select-sm select-bordered w-[140px]"
														value={config[option.key] as string}
														onChange={(e) => handleSelect(option.key, e.target.value)}
														disabled={option.comingSoon}
													>
														{option.selectOptions?.map((opt) => (
															<option key={opt.value} value={opt.value}>
																{opt.label}
															</option>
														))}
													</select>
												)}
											</div>
										</div>
									))}
								</div>
							</div>
						))}
					</div>

					{/* Footer */}
					<div className="px-4 py-2 bg-base-200/30 border-t border-base-200">
						<p className="text-[10px] text-base-content/40">
							Settings are saved locally in your browser
						</p>
					</div>
				</div>
			)}
		</div>
	);
}
