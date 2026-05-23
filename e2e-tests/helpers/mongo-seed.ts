import { execSync } from "node:child_process";

export interface ForecastDataPoint {
	date: string;
	value: number;
}

function execMongo(script: string): void {
	execSync("docker exec -i mongodb mongosh --quiet", {
		input: script,
		stdio: ["pipe", "pipe", "pipe"],
	});
}

export function seedForecastData(
	utilityType: string,
	dataPoints: ForecastDataPoint[],
): void {
	const pointsJson = JSON.stringify(dataPoints);
	const now = Date.now();
	const script = `
use forecast;
db.forecasts.replaceOne(
  { _id: "${utilityType}" },
  {
    _id: "${utilityType}",
    dataPoints: ${pointsJson},
    computedAt: NumberLong("${now}")
  },
  { upsert: true }
);
`;
	execMongo(script);
}

export function clearForecastData(utilityType: string): void {
	const script = `
use forecast;
db.forecasts.deleteOne({ _id: "${utilityType}" });
`;
	execMongo(script);
}

export function clearAllForecastData(): void {
	const script = `
use forecast;
db.forecasts.deleteMany({});
`;
	execMongo(script);
}

export function generateDailyDataPoints(
	days: number,
	baseValue = 100,
	variance = 50,
): ForecastDataPoint[] {
	const today = new Date();
	const points: ForecastDataPoint[] = [];
	for (let i = 0; i < days; i++) {
		const d = new Date(today);
		d.setDate(d.getDate() + i);
		const dateStr = d.toISOString().split("T")[0];
		const value =
			Math.round((baseValue + (Math.random() - 0.5) * variance) * 100) / 100 +
			0.01;
		points.push({ date: dateStr, value });
	}
	return points;
}
