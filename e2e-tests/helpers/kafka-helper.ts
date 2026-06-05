import { expect } from "@playwright/test";
import { getNotifications } from "./api";

export async function waitForNotification(
	sourceId: string,
	timeoutMs = 30_000,
): Promise<boolean> {
	try {
		await expect
			.poll(
				async () => {
					const notifications = await getNotifications();
					return notifications.some(
						(n: { sourceId: string }) => n.sourceId === sourceId,
					);
				},
				{ timeout: timeoutMs },
			)
			.toBe(true);
		return true;
	} catch {
		return false;
	}
}

export async function waitForNotificationCount(
	minCount: number,
	timeoutMs = 30_000,
): Promise<number> {
	let count = 0;
	await expect
		.poll(
			async () => {
				const notifications = await getNotifications();
				count = notifications.length;
				return count;
			},
			{ timeout: timeoutMs },
		)
		.toBeGreaterThanOrEqual(minCount);
	return count;
}

export async function waitForNotificationMatching(
	predicate: (n: {
		sourceId: string;
		message?: string;
		isRead?: boolean;
	}) => boolean,
	timeoutMs = 30_000,
): Promise<Record<string, unknown> | null> {
	let match: Record<string, unknown> | undefined;
	try {
		await expect
			.poll(
				async () => {
					const notifications = await getNotifications();
					match = notifications.find(predicate);
					return match;
				},
				{ timeout: timeoutMs },
			)
			.toBeDefined();
	} catch {
		return null;
	}
	return match ?? null;
}

export async function waitForNotificationBySourceId(
	sourceId: string,
	timeoutMs = 30_000,
): Promise<{ id: string; sourceId: string; message: string } | null> {
	return waitForNotificationMatching(
		(n) => n.sourceId === sourceId,
		timeoutMs,
	) as Promise<{ id: string; sourceId: string; message: string } | null>;
}
