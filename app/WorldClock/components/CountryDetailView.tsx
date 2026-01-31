"use client";

import { useState, useCallback } from "react";
import type { Country } from "../hooks/useCountries";

type CountryDetailViewProps = {
	country: Country;
	onBack: () => void;
	onTimelineView: () => void;
};

export default function CountryDetailView({ country, onBack, onTimelineView }: CountryDetailViewProps) {
	const [activeTab, setActiveTab] = useState<'overview' | 'economy' | 'culture' | 'politics' | 'geography'>('overview');

	const renderOverview = () => (
		<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
			<div className="space-y-4">
				<div className="flex items-center gap-4">
					<span className="text-6xl">{country.flag_emoji || "🏳️"}</span>
					<div>
						<h2 className="text-2xl font-bold">{country.name}</h2>
						<p className="text-base-content/70">{country.official_name || country.name}</p>
						<p className="text-sm text-base-content/50">{country.iso3}</p>
					</div>
				</div>

				<div className="space-y-2">
					<div className="flex justify-between">
						<span className="font-medium">Capital:</span>
						<span>{country.capital || "—"}</span>
					</div>
					<div className="flex justify-between">
						<span className="font-medium">Population:</span>
						<span>{country.population ? parseInt(country.population).toLocaleString() : "—"}</span>
					</div>
					<div className="flex justify-between">
						<span className="font-medium">Area:</span>
						<span>{country.area_km2 ? `${parseInt(country.area_km2).toLocaleString()} km²` : "—"}</span>
					</div>
					<div className="flex justify-between">
						<span className="font-medium">Currency:</span>
						<span>{country.currency || "—"} ({country.currency_name || "—"})</span>
					</div>
				</div>
			</div>

			<div className="space-y-4">
				<div>
					<h3 className="font-semibold mb-2">Quick Info</h3>
					<div className="space-y-1 text-sm">
						{country.region && (
							<p><span className="font-medium">Region:</span> {country.region}</p>
						)}
						{country.subregion && (
							<p><span className="font-medium">Subregion:</span> {country.subregion}</p>
						)}
						{country.timezone && (
							<p><span className="font-medium">Timezone:</span> {country.timezone}</p>
						)}
					</div>
				</div>

				{country.famous_for && (
					<div>
						<h3 className="font-semibold mb-2">Famous For</h3>
						<p className="text-sm text-base-content/80">{country.famous_for}</p>
					</div>
				)}

				{country.national_sport && (
					<div>
						<h3 className="font-semibold mb-2">National Sport</h3>
						<p className="text-sm text-base-content/80">{country.national_sport}</p>
					</div>
				)}
			</div>
		</div>
	);

	const renderEconomy = () => (
		<div className="space-y-6">
			<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
				<div className="stat bg-base-200 rounded-lg p-4">
					<div className="stat-title">GDP (Nominal)</div>
					<div className="stat-value text-lg">$2.5T</div>
					<div className="stat-desc">Estimated</div>
				</div>
				<div className="stat bg-base-200 rounded-lg p-4">
					<div className="stat-title">GDP per Capita</div>
					<div className="stat-value text-lg">$12,500</div>
					<div className="stat-desc">Estimated</div>
				</div>
				<div className="stat bg-base-200 rounded-lg p-4">
					<div className="stat-title">Unemployment</div>
					<div className="stat-value text-lg">5.2%</div>
					<div className="stat-desc">Estimated</div>
				</div>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
				<div className="card bg-base-200 p-4">
					<h3 className="font-semibold mb-2">Economic Indicators</h3>
					<div className="space-y-2 text-sm">
						<div className="flex justify-between">
							<span>Inflation Rate:</span>
							<span>3.2%</span>
						</div>
						<div className="flex justify-between">
							<span>Exports:</span>
							<span>$450B</span>
						</div>
						<div className="flex justify-between">
							<span>Imports:</span>
							<span>$380B</span>
						</div>
						<div className="flex justify-between">
							<span>Gini Index:</span>
							<span>0.35</span>
						</div>
					</div>
				</div>

				<div className="card bg-base-200 p-4">
					<h3 className="font-semibold mb-2">Major Industries</h3>
					<div className="flex flex-wrap gap-2">
						{["Technology", "Manufacturing", "Tourism", "Agriculture", "Mining"].map((industry) => (
							<span key={industry} className="badge badge-primary">{industry}</span>
						))}
					</div>
				</div>
			</div>
		</div>
	);

	const renderCulture = () => (
		<div className="space-y-6">
			<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
				<div>
					<h3 className="font-semibold mb-3">Languages</h3>
					<div className="flex flex-wrap gap-2">
						{country.languages?.map((lang) => (
							<span key={lang} className="badge badge-outline">{lang}</span>
						)) || <span className="text-base-content/50">No language data</span>}
					</div>
				</div>

				<div>
					<h3 className="font-semibold mb-3">Religions</h3>
					<div className="flex flex-wrap gap-2">
						{country.religion_tags?.map((religion) => (
							<span key={religion} className="badge badge-outline">{religion.replace(/_/g, " ")}</span>
						)) || <span className="text-base-content/50">No religion data</span>}
					</div>
				</div>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
				<div>
					<h3 className="font-semibold mb-2">Famous Food</h3>
					<p className="text-sm text-base-content/80">{country.famous_food || "No data available"}</p>
				</div>

				<div>
					<h3 className="font-semibold mb-2">Famous People</h3>
					<p className="text-sm text-base-content/80">{country.famous_people || "No data available"}</p>
				</div>
			</div>

			{country.national_anthem && (
				<div>
					<h3 className="font-semibold mb-2">National Anthem</h3>
					<p className="text-sm text-base-content/80 italic">"{country.national_anthem}"</p>
				</div>
			)}
		</div>
	);

	const renderPolitics = () => (
		<div className="space-y-6">
			<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
				<div className="stat bg-base-200 rounded-lg p-4">
					<div className="stat-title">Peace Index</div>
					<div className="stat-value text-lg">
						{country.indices?.peace?.["2023"] ? `#${country.indices.peace["2023"]}` : "—"}
					</div>
					<div className="stat-desc">2023 Ranking</div>
				</div>
				<div className="stat bg-base-200 rounded-lg p-4">
					<div className="stat-title">Democracy Index</div>
					<div className="stat-value text-lg">7.8</div>
					<div className="stat-desc">Estimated</div>
				</div>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
				<div className="card bg-base-200 p-4">
					<h3 className="font-semibold mb-2">Government</h3>
					<div className="space-y-2 text-sm">
						<div className="flex justify-between">
							<span>Type:</span>
							<span>Federal Republic</span>
						</div>
						<div className="flex justify-between">
							<span>Leader:</span>
							<span>John Doe</span>
						</div>
						<div className="flex justify-between">
							<span>Since:</span>
							<span>2020</span>
						</div>
					</div>
				</div>

				<div className="card bg-base-200 p-4">
					<h3 className="font-semibold mb-2">International Relations</h3>
					<div className="flex flex-wrap gap-2">
						<span className="badge badge-success">UN Member</span>
						<span className="badge badge-success">WTO Member</span>
						<span className="badge badge-warning">EU Candidate</span>
					</div>
				</div>
			</div>
		</div>
	);

	const renderGeography = () => (
		<div className="space-y-6">
			<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
				<div className="stat bg-base-200 rounded-lg p-4">
					<div className="stat-title">Total Area</div>
					<div className="stat-value text-lg">
						{country.area_km2 ? `${parseInt(country.area_km2).toLocaleString()} km²` : "—"}
					</div>
					<div className="stat-desc">Land + Water</div>
				</div>
				<div className="stat bg-base-200 rounded-lg p-4">
					<div className="stat-title">Population</div>
					<div className="stat-value text-lg">
						{country.population ? parseInt(country.population).toLocaleString() : "—"}
					</div>
					<div className="stat-desc">Total inhabitants</div>
				</div>
				<div className="stat bg-base-200 rounded-lg p-4">
					<div className="stat-title">Density</div>
					<div className="stat-value text-lg">75/km²</div>
					<div className="stat-desc">People per km²</div>
				</div>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
				<div className="card bg-base-200 p-4">
					<h3 className="font-semibold mb-2">Climate</h3>
					<div className="flex flex-wrap gap-2">
						{country.climate_tags?.map((climate) => (
							<span key={climate} className="badge badge-outline">{climate}</span>
						)) || <span className="text-base-content/50">No climate data</span>}
					</div>
				</div>

				<div className="card bg-base-200 p-4">
					<h3 className="font-semibold mb-2">Geographic Features</h3>
					<div className="flex flex-wrap gap-2">
						{country.feature_tags?.map((feature) => (
							<span key={feature} className="badge badge-outline">{feature.replace(/_/g, " ")}</span>
						)) || <span className="text-base-content/50">No feature data</span>}
					</div>
				</div>
			</div>

			{country.border_countries && country.border_countries.length > 0 && (
				<div>
					<h3 className="font-semibold mb-2">Bordering Countries</h3>
					<div className="flex flex-wrap gap-2">
						{country.border_countries.map((border) => (
							<span key={border} className="badge badge-primary">{border}</span>
						))}
					</div>
				</div>
			)}
		</div>
	);

	const renderContent = () => {
		switch (activeTab) {
			case 'overview': return renderOverview();
			case 'economy': return renderEconomy();
			case 'culture': return renderCulture();
			case 'politics': return renderPolitics();
			case 'geography': return renderGeography();
			default: return renderOverview();
		}
	};

	return (
		<div className="h-screen w-screen bg-base-100 flex flex-col">
			{/* Header */}
			<header className="flex items-center justify-between px-6 py-4 bg-base-200/50 border-b border-base-content/10">
				<div className="flex items-center gap-4">
					<h1 className="text-xl font-bold">{country.name}</h1>
				</div>

				<button className="btn btn-primary btn-sm" onClick={onTimelineView}>
					<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
					</svg>
					View Timeline
				</button>
			</header>

			{/* Tabs */}
			<div className="flex bg-base-200/30 border-b border-base-content/10">
				{[
					{ key: 'overview', label: 'Overview' },
					{ key: 'economy', label: 'Economy' },
					{ key: 'culture', label: 'Culture' },
					{ key: 'politics', label: 'Politics' },
					{ key: 'geography', label: 'Geography' },
				].map((tab) => (
					<button
						key={tab.key}
						className={`px-6 py-3 text-sm font-medium transition-colors ${activeTab === tab.key
								? 'bg-base-100 border-b-2 border-primary text-primary'
								: 'hover:bg-base-100/50'
							}`}
						onClick={() => setActiveTab(tab.key as any)}
					>
						{tab.label}
					</button>
				))}
			</div>

			{/* Content */}
			<div className="flex-1 overflow-auto p-6">
				<div className="max-w-6xl mx-auto">
					{renderContent()}
				</div>
			</div>
		</div>
	);
}