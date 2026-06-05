import { expect, test } from "@/fixtures/base-fixtures";
import {
	checkWavesLabHealth,
	clearAllMapHookups,
	clearAllMapZones,
	createMapZone,
	deleteHookup,
	deleteMapHookup,
	deleteMapZone,
	ensureFloorPlan,
	listHookups,
	listMapHookups,
	listMapZones,
} from "@/helpers/api";
import { uniqueZoneName, validZone, zoneTriangleVertices } from "@/helpers/test-data";
import { MapEditorPage } from "@/pages/MapEditorPage";

const VERTICES = zoneTriangleVertices();

test.describe("Feature: Map Service", () => {
	test.beforeAll(async () => {
		await clearAllMapHookups();
		await clearAllMapZones();
		await ensureFloorPlan();
	});

	test.describe("Zone Management", () => {
		test.describe.configure({ retries: 1 });
		let createdZoneIds: string[];

		test.beforeEach(() => {
			createdZoneIds = [];
		});

		test.afterEach(async () => {
			for (const id of createdZoneIds) {
				try {
					await deleteMapZone(id);
				} catch {
					// Ignore cleanup failures
				}
			}
		});

		test("Scenario: admin creates a zone on the map", async ({
			adminPage,
		}) => {
			let zoneName: string;

			await test.step("Given the admin is on the map editor page", async () => {
				const mapEditor = new MapEditorPage(adminPage);
				await mapEditor.goto();
				await mapEditor.assertOnPage();
			});

			await test.step("When they draw a zone polygon and save it with a name", async () => {
				const mapEditor = new MapEditorPage(adminPage);
				zoneName = uniqueZoneName();
				await mapEditor.createZoneViaUI(zoneName, VERTICES);
			});

			await test.step("Then the dialog should close", async () => {
				const mapEditor = new MapEditorPage(adminPage);
				await mapEditor.assertZoneDialogClosed();
			});

			await test.step("And the zone should appear in the sidebar tree", async () => {
				const mapEditor = new MapEditorPage(adminPage);
				await mapEditor.assertZoneInTree(zoneName);
			});

			await test.step("And the zone should exist in the backend", async () => {
				const zones = (await listMapZones()) as {
					id: string;
					name: string;
				}[];
				const created = zones.find((z) => z.name === zoneName);
				expect(created).toBeDefined();
				if (created) createdZoneIds.push(created.id);
			});
		});

		test("Scenario: admin edits a zone name via the sidebar tree", async ({
			adminPage,
		}) => {
			let originalName: string;
			let editedName: string;

			await test.step("Given a zone exists", async () => {
				const zone = validZone();
				originalName = zone.name;
				const created = await createMapZone(zone);
				createdZoneIds.push(created.id);
			});

			await test.step("When the admin edits its name via the sidebar tree", async () => {
				const mapEditor = new MapEditorPage(adminPage);
				await mapEditor.goto();
				await mapEditor.assertOnPage();
				await mapEditor.assertZoneInTree(originalName);
				editedName = uniqueZoneName();
				await mapEditor.editZoneViaUI(originalName, editedName);
			});

			await test.step("Then the dialog should close", async () => {
				const mapEditor = new MapEditorPage(adminPage);
				await mapEditor.assertZoneDialogClosed();
			});

			await test.step("And the new name should appear in the tree", async () => {
				const mapEditor = new MapEditorPage(adminPage);
				await mapEditor.assertZoneInTree(editedName);
			});

			await test.step("And the old name should no longer appear", async () => {
				const mapEditor = new MapEditorPage(adminPage);
				await mapEditor.assertZoneNotInTree(originalName);
			});

			await test.step("And the backend should reflect the updated name", async () => {
				const zones = (await listMapZones()) as {
					id: string;
					name: string;
				}[];
				const edited = zones.find((z) => z.name === editedName);
				expect(edited).toBeDefined();
				expect(edited?.name).toBe(editedName);
			});
		});

		test("Scenario: admin deletes a zone via the sidebar tree", async ({
			adminPage,
		}) => {
			let zoneName: string;

			await test.step("Given a zone exists", async () => {
				const zone = validZone();
				zoneName = zone.name;
				const created = await createMapZone(zone);
				createdZoneIds.push(created.id);
			});

			await test.step("When the admin deletes it via the sidebar tree", async () => {
				const mapEditor = new MapEditorPage(adminPage);
				await mapEditor.goto();
				await mapEditor.assertOnPage();
				await mapEditor.assertZoneInTree(zoneName);
				await mapEditor.deleteZoneViaUI(zoneName);
			});

			await test.step("Then it should be removed from the tree", async () => {
				const mapEditor = new MapEditorPage(adminPage);
				await mapEditor.assertZoneNotInTree(zoneName);
			});

			await test.step("And it should not exist in the backend", async () => {
				const zones = (await listMapZones()) as { name: string }[];
				const found = zones.find((z) => z.name === zoneName);
				expect(found).toBeUndefined();
			});
		});

		test("Scenario: duplicate zone name shows validation error", async ({
			adminPage,
		}) => {
			let existingName: string;

			await test.step("Given a zone already exists with a specific name", async () => {
				const zone = validZone();
				existingName = zone.name;
				const created = await createMapZone(zone);
				createdZoneIds.push(created.id);
			});

			await test.step("When the admin attempts to create another zone with the same name", async () => {
				const mapEditor = new MapEditorPage(adminPage);
				await mapEditor.goto();
				await mapEditor.assertOnPage();
				await mapEditor.drawZonePolygon(VERTICES);
				await mapEditor.zoneNameInput().fill(existingName);
				await mapEditor.zoneSaveButton().click();
			});

			await test.step("Then a validation error should appear in the dialog", async () => {
				const mapEditor = new MapEditorPage(adminPage);
				await expect(mapEditor.zoneDialogError()).toBeVisible({
					timeout: 5_000,
				});
				await expect(mapEditor.zoneDialogError()).toContainText(
					/already exists|duplicate/i,
				);
			});

			await test.step("And the dialog should remain open", async () => {
				const mapEditor = new MapEditorPage(adminPage);
				await mapEditor.assertZoneDialogOpen();
			});
		});
	});

	test.describe("Hookup Zone Assignment", () => {
		test.slow();
		let createdZoneIds: string[];
		let createdHookupIds: string[];
		let createdMapHookupIds: string[];

		test.beforeEach(() => {
			createdZoneIds = [];
			createdHookupIds = [];
			createdMapHookupIds = [];
		});

		test.afterEach(async () => {
			for (const id of createdMapHookupIds) {
				try {
					await deleteMapHookup(id);
				} catch {
					// Ignore cleanup failures
				}
			}
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

		test("Scenario: hookup placed inside a zone is auto-assigned to that zone", async ({
			adminPage,
		}) => {
			test.setTimeout(60_000);

			await test.step("Given waves-lab is running", async () => {
				const healthy = await checkWavesLabHealth();
				test.skip(!healthy, "Waves-lab is not running on port 8000");
			});

			let zoneId: string;

			await test.step("And a zone exists on the map", async () => {
				const mapEditor = new MapEditorPage(adminPage);
				await mapEditor.goto();
				await mapEditor.assertOnPage();
				const zoneName = uniqueZoneName();
				await mapEditor.createZoneViaUI(zoneName, VERTICES);
				await mapEditor.assertZoneDialogClosed();
				await mapEditor.cancelZoneDrawingButton().click();

				const zones = (await listMapZones()) as {
					id: string;
					name: string;
				}[];
				const created = zones.find((z) => z.name === zoneName);
				expect(created).toBeDefined();
				if (created) {
					zoneId = created.id;
					createdZoneIds.push(zoneId);
				}
			});

			let hookupName: string;

			await test.step("When the admin creates a hookup at a position inside the zone using external endpoint sync", async () => {
				const mapEditor = new MapEditorPage(adminPage);
				hookupName = await mapEditor.createHookupWithSyncViaUI(
					"http://localhost:8000/api/devices/refrigerator",
					325,
					240,
				);
			});

			await test.step("Then the dialog should close", async () => {
				const mapEditor = new MapEditorPage(adminPage);
				await mapEditor.assertHookupDialogClosed();
			});

			await test.step("And the hookup should be visible in the sidebar tree", async () => {
				const mapEditor = new MapEditorPage(adminPage);
				await mapEditor.assertHookupInTree(hookupName);
			});

			await test.step("And the hookup should exist in the hookup service", async () => {
				const hookups = (await listHookups()) as {
					id: string;
					name: string;
				}[];
				const created = hookups.find((h) => h.name === hookupName);
				expect(created).toBeDefined();
				if (created) {
					createdHookupIds.push(created.id);
				}
			});

			await test.step("And the map service should register the hookup position within the zone", async () => {
				const hookups = (await listHookups()) as {
					id: string;
					name: string;
				}[];
				const hookup = hookups.find((h) => h.name === hookupName);
				expect(hookup).toBeDefined();
				if (!hookup) return;

				let mapMatch:
					| { id: string; zoneId: string | null }
					| undefined;
				await expect
					.poll(
						async () => {
							const mapHookups =
								(await listMapHookups()) as {
									id: string;
									zoneId: string | null;
								}[];
							mapMatch = mapHookups.find(
								(h) => h.id === hookup.id,
							);
							return mapMatch;
						},
						{ timeout: 10_000 },
					)
					.toBeDefined();
				if (mapMatch) {
					createdMapHookupIds.push(mapMatch.id);
					expect(mapMatch.zoneId).toBe(zoneId);
				}
			});
		});
	});
});
