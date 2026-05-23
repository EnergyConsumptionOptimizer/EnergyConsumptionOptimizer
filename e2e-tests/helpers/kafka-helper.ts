import { getNotifications } from "./api";

export async function waitForNotification(
	sourceId: string,
	timeoutMs = 30_000,
): Promise<boolean> {
	const start = Date.now();
	const interval = 500;

	while (Date.now() - start < timeoutMs) {
		try {
			const notifications = await getNotifications();
			const found = notifications.some(
				(n: { sourceId: string }) => n.sourceId === sourceId,
			);
			if (found) return true;
		} catch {
			// Retry on network errors
		}
		await new Promise((resolve) => setTimeout(resolve, interval));
	}

	return false;
}

export async function waitForNotificationCount(
	minCount: number,
	timeoutMs = 30_000,
): Promise<number> {
	const start = Date.now();
	const interval = 500;

	while (Date.now() - start < timeoutMs) {
		try {
			const notifications = await getNotifications();
			if (notifications.length >= minCount) return notifications.length;
		} catch {
			// Retry on network errors
		}
		await new Promise((resolve) => setTimeout(resolve, interval));
	}

	throw new Error(
		`Expected at least ${minCount} notifications within ${timeoutMs}ms`,
	);
}

export async function waitForNotificationMatching(
	predicate: (n: {
		sourceId: string;
		message?: string;
		isRead?: boolean;
	}) => boolean,
	timeoutMs = 30_000,
): Promise<Record<string, unknown> | null> {
	const start = Date.now();
	const interval = 500;

	while (Date.now() - start < timeoutMs) {
		try {
			const notifications = await getNotifications();
			const match = notifications.find(predicate);
			if (match) return match;
		} catch {
			// Retry on network errors
		}
		await new Promise((resolve) => setTimeout(resolve, interval));
	}

	return null;
}
