import { createThreshold, triggerForecastEvaluation } from "./api";
import { waitForNotificationBySourceId } from "./kafka-helper";
import {
	forecastEvaluationPayload,
	forecastThresholdPayload,
} from "./test-data";

export async function seedNotification(): Promise<{
	thresholdId: string;
	notification: { id: string; sourceId: string; message: string };
}> {
	const thresholdPayload = forecastThresholdPayload();
	thresholdPayload.value = 1;
	const threshold = await createThreshold(thresholdPayload);

	const evalPayload = forecastEvaluationPayload("ELECTRICITY", [
		100, 120, 150,
	]);
	await triggerForecastEvaluation(evalPayload);

	const notification = await waitForNotificationBySourceId(
		threshold.id,
		30_000,
	);
	if (!notification) {
		throw new Error("Notification not created within timeout");
	}
	return { thresholdId: threshold.id, notification };
}
