"use client";

import { useState, useEffect, useCallback } from "react";

export type ScrollMode = "together" | "individual";

export type UserConfig = {
	// Scroll behavior
	scrollMode: ScrollMode;

	// Future options (placeholders)
	flipTable: boolean;
	compactMode: boolean;
	showGridLines: boolean;
	highlightOnHover: boolean;

	// Theme
	rowAlternateColors: boolean;
};

const DEFAULT_CONFIG: UserConfig = {
	scrollMode: "together",
	flipTable: false,
	compactMode: false,
	showGridLines: true,
	highlightOnHover: true,
	rowAlternateColors: true,
};

const CONFIG_STORAGE_KEY = "worldclock-user-config-v2";

export function useUserConfig() {
	const [config, setConfigState] = useState<UserConfig>(DEFAULT_CONFIG);
	const [isLoaded, setIsLoaded] = useState(false);

	// Load config from localStorage on mount
	useEffect(() => {
		try {
			const saved = localStorage.getItem(CONFIG_STORAGE_KEY);
			if (saved) {
				const parsed = JSON.parse(saved);
				// Merge with defaults to handle new options
				setConfigState({ ...DEFAULT_CONFIG, ...parsed });
			}
		} catch {
			// Ignore parse errors, use defaults
		}
		setIsLoaded(true);
	}, []);

	// Save config to localStorage
	const setConfig = useCallback((updates: Partial<UserConfig>) => {
		setConfigState((prev) => {
			const newConfig = { ...prev, ...updates };
			try {
				localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(newConfig));
			} catch {
				// Ignore storage errors
			}
			return newConfig;
		});
	}, []);

	// Reset to defaults
	const resetConfig = useCallback(() => {
		setConfigState(DEFAULT_CONFIG);
		try {
			localStorage.removeItem(CONFIG_STORAGE_KEY);
		} catch {
			// Ignore storage errors
		}
	}, []);

	return {
		config,
		setConfig,
		resetConfig,
		isLoaded,
	};
}
