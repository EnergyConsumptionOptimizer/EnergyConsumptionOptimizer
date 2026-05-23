export function uniqueUsername(prefix = "e2e-user") {
	return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function validUser(username?: string) {
	return {
		username: username || uniqueUsername(),
		password: "pass123",
	};
}

export function validThreshold(
	overrides?: Partial<{
		name: string;
		utilityType: string;
		thresholdType: string;
		value: number;
		periodType: string;
	}>,
) {
	return {
		name: overrides?.name || `${uniqueThreshold()}`,
		utilityType: overrides?.utilityType || "ELECTRICITY",
		thresholdType: overrides?.thresholdType || "FORECAST",
		value: overrides?.value ?? 100,
		periodType: overrides?.periodType || "ONE_DAY",
	};
}

function uniqueThreshold() {
	return `e2e-threshold-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function forecastEvaluationPayload(
	utilityType = "ELECTRICITY",
	values: number[],
) {
	const today = new Date();
	const dataPoints = values.map((value, i) => {
		const date = new Date(today);
		date.setDate(date.getDate() + i);
		return {
			date: date.toISOString().split("T")[0],
			value,
		};
	});

	return { utilityType, dataPoints };
}

export function forecastThresholdPayload(overrides?: {
	name?: string;
	utilityType?: string;
	value?: number;
}) {
	return {
		name: overrides?.name ?? uniqueThreshold(),
		utilityType: overrides?.utilityType ?? "ELECTRICITY",
		thresholdType: "FORECAST",
		value: overrides?.value ?? 50,
		periodType: "ONE_DAY",
	};
}
