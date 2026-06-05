import { expect, test } from "@/fixtures/base-fixtures";
import {
	clearAllMapHookups,
	clearAllMapZones,
	deleteHookup,
	deleteMapZone,
	ensureFloorPlan,
	listHookups,
	listMapZones,
} from "@/helpers/api";
import { uniqueZoneName, validHookup, zoneTriangleVertices } from "@/helpers/test-data";
import { MapEditorPage } from "@/pages/MapEditorPage";

test.describe("Feature: Hookup Management", () => {
	let createdHookupIds: string[];
	let createdZoneIds: string[];

	test.beforeAll(async () => {
		await clearAllMapHookups();
		await clearAllMapZones();
		await ensureFloorPlan();
	});

	test.beforeEach(() => {
		createdHookupIds = [];
		createdZoneIds = [];
	});

	test.afterEach(async () => {
		for (const id of createdHookupIds) {
			try {
				await deleteHookup(id);
			} catch {
				// Ignore cleanup failures
			}
		}
		for (const id of createdZoneIds) {
			try {
				await deleteMapZone(id);
			} catch {
				// Ignore cleanup failures
			}
		}
	});

	test("Scenario: admin navigates to the map editor page", async ({
		adminPage,
	}) => {
		await test.step("Given the admin is logged in", async () => {
			// adminPage fixture provides an authenticated admin context
		});

		await test.step("When they navigate to the map editor page", async () => {
			const mapEditor = new MapEditorPage(adminPage);
			await mapEditor.goto();
		});

		await test.step("Then the map editor should load with key actions", async () => {
			const mapEditor = new MapEditorPage(adminPage);
			await mapEditor.assertOnPage();
			await expect(mapEditor.mapCanvas()).toBeVisible();
			await expect(mapEditor.createHookupButton()).toBeVisible();
		});
	});

	async function createZoneAndHookup(page: import("@playwright/test").Page): Promise<string> {
		const mapEditor = new MapEditorPage(page);
		const zoneName = uniqueZoneName();
		await mapEditor.createZoneViaUI(zoneName, zoneTriangleVertices());
		await mapEditor.assertZoneDialogClosed();
		await mapEditor.cancelZoneDrawingButton().click();

		const zones = (await listMapZones()) as { id: string; name: string }[];
		const zone = zones.find((z) => z.name === zoneName);
		if (zone) createdZoneIds.push(zone.id);

		const hookupName = await mapEditor.createHookupWithSyncViaUI(
			"http://localhost:8000/api/devices/refrigerator",
			325,
			240,
		);
		await mapEditor.assertHookupDialogClosed();
		return hookupName;
	}

	test("Scenario: admin creates a new hookup via the map editor", async ({
		adminPage,
	}) => {
		test.setTimeout(60_000);
		let hookupName: string;

		await test.step("Given the admin is on the map editor page", async () => {
			const mapEditor = new MapEditorPage(adminPage);
			await mapEditor.goto();
			await mapEditor.assertOnPage();
		});

		await test.step("When they create a new hookup with valid details", async () => {
			hookupName = await createZoneAndHookup(adminPage);
		});

		await test.step("And the hookup should exist in the backend", async () => {
			const hookups = await listHookups();
			const created = hookups.find(
				(h: { name: string }) => h.name === hookupName,
			);
			expect(created).toBeDefined();
			if (created) {
				createdHookupIds.push(created.id);
			}
		});

		await test.step("And the hookup should appear in the tree sidebar", async () => {
			const mapEditor = new MapEditorPage(adminPage);
			await mapEditor.assertHookupInTree(hookupName);
		});
	});

	test("Scenario: admin edits a hookup name via the tree sidebar", async ({
		adminPage,
	}) => {
		test.setTimeout(60_000);
		let originalName: string;
		let editedName: string;

		await test.step("Given a hookup exists", async () => {
			const mapEditor = new MapEditorPage(adminPage);
			await mapEditor.goto();
			await mapEditor.assertOnPage();
			originalName = await createZoneAndHookup(adminPage);

			const hookups = await listHookups();
			const created = hookups.find(
				(h: { name: string }) => h.name === originalName,
			);
			expect(created).toBeDefined();
			if (created) createdHookupIds.push(created.id);
		});

		await test.step("When the admin edits its name via the tree sidebar", async () => {
			editedName = validHookup().name;
			const mapEditor = new MapEditorPage(adminPage);
			await mapEditor.goto();
			await mapEditor.assertOnPage();
			await mapEditor.assertHookupInTree(originalName);
			await mapEditor.editHookupName(originalName, editedName);
		});

		await test.step("Then the dialog should close", async () => {
			const mapEditor = new MapEditorPage(adminPage);
			await mapEditor.assertHookupDialogClosed();
		});

		await test.step("And the new name should appear in the tree sidebar", async () => {
			const mapEditor = new MapEditorPage(adminPage);
			await mapEditor.assertHookupInTree(editedName);
		});

		await test.step("And the old name should no longer appear", async () => {
			const mapEditor = new MapEditorPage(adminPage);
			await mapEditor.assertHookupNotInTree(originalName);
		});

		await test.step("And the backend should reflect the updated name", async () => {
			const hookups = await listHookups();
			const edited = hookups.find(
				(h: { name: string }) => h.name === editedName,
			);
			expect(edited).toBeDefined();
			expect(edited.name).toBe(editedName);
		});
	});

	test("Scenario: admin deletes a hookup via the tree sidebar", async ({
		adminPage,
	}) => {
		test.setTimeout(60_000);
		let hookupName: string;

		await test.step("Given a hookup exists", async () => {
			const mapEditor = new MapEditorPage(adminPage);
			await mapEditor.goto();
			await mapEditor.assertOnPage();
			hookupName = await createZoneAndHookup(adminPage);

			const hookups = await listHookups();
			const created = hookups.find(
				(h: { name: string }) => h.name === hookupName,
			);
			expect(created).toBeDefined();
			if (created) createdHookupIds.push(created.id);
		});

		await test.step("When the admin deletes it via the tree sidebar", async () => {
			const mapEditor = new MapEditorPage(adminPage);
			await mapEditor.goto();
			await mapEditor.assertOnPage();
			await mapEditor.assertHookupInTree(hookupName);
			await mapEditor.deleteHookupViaUI(hookupName);
		});

		await test.step("Then it should be removed from the tree sidebar", async () => {
			const mapEditor = new MapEditorPage(adminPage);
			await mapEditor.assertHookupNotInTree(hookupName);
		});

		await test.step("And it should not exist in the backend", async () => {
			const remaining = await listHookups();
			expect(
				remaining.find((h: { name: string }) => h.name === hookupName),
			).toBeUndefined();
		});
	});
});

test.describe("Feature: Hookup Authorization", () => {
	test("Scenario: household user cannot access the map editor page", async ({
		userPage,
	}) => {
		await test.step("Given a household user is logged in", async () => {
			// userPage fixture provides an authenticated household user context
		});

		await test.step("When they attempt to access the map editor page", async () => {
			await userPage.goto("/mapeditor");
		});

		await test.step("Then they should be redirected away", async () => {
			await expect(userPage).toHaveURL(/\/access-denied|\/dashboard/);
		});
	});
});
