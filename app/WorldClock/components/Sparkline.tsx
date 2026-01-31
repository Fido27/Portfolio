"use client";

type SparklineProps = {
	data: Record<string, number> | undefined;
	width?: number;
	height?: number;
	color?: string;
	showValue?: boolean;
	invertColors?: boolean; // For peace index where lower is better
};

export default function Sparkline({
	data,
	width = 60,
	height = 24,
	color = "#3b82f6",
	showValue = true,
	invertColors = false,
}: SparklineProps) {
	if (!data || Object.keys(data).length === 0) {
		return <span className="text-base-content/40 text-xs">—</span>;
	}

	const years = Object.keys(data).sort();
	const values = years.map((y) => data[y]);
	const latestValue = values[values.length - 1];
	const firstValue = values[0];
	const trend = latestValue - firstValue;

	const min = Math.min(...values);
	const max = Math.max(...values);
	const range = max - min || 1;

	// Normalize values to 0-1
	const normalized = values.map((v) => (v - min) / range);

	// Create SVG path
	const padding = 2;
	const chartWidth = width - padding * 2;
	const chartHeight = height - padding * 2;

	const points = normalized.map((v, i) => {
		const x = padding + (i / (normalized.length - 1)) * chartWidth;
		const y = padding + (1 - v) * chartHeight;
		return `${x},${y}`;
	});

	const pathD = `M ${points.join(" L ")}`;

	// Determine trend color
	let trendColor = "text-base-content/40";
	if (trend !== 0) {
		if (invertColors) {
			// For peace index: lower is better, so negative trend is good
			trendColor = trend < 0 ? "text-success" : "text-error";
		} else {
			// For happiness: higher is better
			trendColor = trend > 0 ? "text-success" : "text-error";
		}
	}

	return (
		<div className="flex items-center gap-1.5">
			<svg width={width} height={height} className="flex-shrink-0">
				{/* Area fill */}
				<path
					d={`${pathD} L ${width - padding},${height - padding} L ${padding},${height - padding} Z`}
					fill={color}
					fillOpacity={0.15}
				/>
				{/* Line */}
				<path d={pathD} stroke={color} strokeWidth={1.5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
				{/* Latest point dot */}
				<circle
					cx={width - padding}
					cy={padding + (1 - normalized[normalized.length - 1]) * chartHeight}
					r={2}
					fill={color}
				/>
			</svg>
			{showValue && (
				<div className="flex flex-col items-end min-w-[32px]">
					<span className="text-xs font-medium">{latestValue.toFixed(1)}</span>
					<span className={`text-[10px] ${trendColor}`}>
						{trend > 0 ? "+" : ""}
						{trend.toFixed(1)}
					</span>
				</div>
			)}
		</div>
	);
}
