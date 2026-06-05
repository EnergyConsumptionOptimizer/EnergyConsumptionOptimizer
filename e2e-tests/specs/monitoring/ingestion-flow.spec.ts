import { expect, test } from "@/fixtures/base-fixtures";
import {
	checkWavesLabHealth,
	clearAllMapHookups,
	clearAllMapZones,
	clearAllServiceHookups,
	createFloorPlan,
	createHookup,
	deleteHookup,
	deleteMapHookup,
	deleteMapZone,
	ingestMeasurement,
	listWavesLabDevices,
	placeHookupOnMap,
} from "@/helpers/api";
import {
	minimalFloorPlanSvg,
	validHookup,
	validMeasurement,
} from "@/helpers/test-data";
import { DashboardPage } from "@/pages/DashboardPage";

const ELECTRICITY = "ELECTRICITY";
const GAS = "GAS";
const WATER = "WATER";

test.describe("Feature: Monitoring Ingestion Flow", () => {
	let createdHookupIds: string[];
	let createdMapHookupIds: string[];
	let createdZoneIds: string[];

	test.beforeAll(async () => {
		await clearAllServiceHookups();
		await clearAllMapHookups();
		await clearAllMapZones();
	});

	test.beforeEach(() => {
		createdHookupIds = [];
		createdMapHookupIds = [];
		createdZoneIds = [];
	});

	test.afterEach(async () => {
		for (const id of createdMapHookupIds) {
			try {
				await deleteMapHookup(id);
			} catch {}
		}
		for (const id of createdHookupIds) {
			try {
				await deleteHookup(id);
			} catch {}
		}
		for (const id of createdZoneIds) {
			try {
				await deleteMapZone(id);
			} catch {}
		}
	});

	test.describe("Ingestion to REST API", () => {
		test("Scenario: ingested measurement appears on the monitoring dashboard", async ({
			adminPage,
		}) => {
			test.setTimeout(60_000);
			let hookup: { id: string; utilityType: string };

			await test.step("Given an electricity hookup exists", async () => {
				const payload = validHookup({ utilityType: ELECTRICITY });
				hookup = await createHookup(payload);
				createdHookupIds.push(hookup.id);
			});

			await test.step("And a measurement has been ingested", async () => {
				const measurement = validMeasurement({
					realTimeConsumption: 2.5,
				});
				const result = await ingestMeasurement(hookup.id, measurement);
				expect(result.status).toBe(201);
			});

			await test.step("Then the dashboard should show the utility statistics", async () => {
				const dashboard = new DashboardPage(adminPage);
				await dashboard.goto();
				await dashboard.assertPageLoaded();
				await dashboard.assertStatsCardVisible("Electricity", 15_000);
			});
		});

		test("Scenario: dashboard shows data for multiple utility types after ingestion", async ({
			adminPage,
		}) => {
			test.setTimeout(40_000);

			await test.step("Given waves-lab is running", async () => {
				const healthy = await checkWavesLabHealth();
				test.skip(!healthy, "Waves-lab service is not running on port 8000");
			});

			const hookups: { id: string; utilityType: string; value: number }[] = [];

			await test.step("And hookups derived from waves-lab devices exist for gas and water", async () => {
				const devices = (await listWavesLabDevices()) as {
					device_type: string;
					real_time_consumption: number;
				}[];
				const gasDevice = devices.find((d) => d.device_type === GAS);
				const waterDevice = devices.find((d) => d.device_type === WATER);

				expect(gasDevice).toBeDefined();
				expect(waterDevice).toBeDefined();
				if (!gasDevice || !waterDevice) return;

				const gas = await createHookup(
					validHookup({
						utilityType: GAS,
					}),
				);
				createdHookupIds.push(gas.id);
				hookups.push({
					id: gas.id,
					utilityType: GAS,
					value: gasDevice.real_time_consumption,
				});

				const water = await createHookup(
					validHookup({
						utilityType: WATER,
					}),
				);
				createdHookupIds.push(water.id);
				hookups.push({
					id: water.id,
					utilityType: WATER,
					value: waterDevice.real_time_consumption,
				});
			});

			await test.step("When measurements are ingested using waves-lab consumption values", async () => {
				for (const h of hookups) {
					const result = await ingestMeasurement(
						h.id,
						validMeasurement({ realTimeConsumption: h.value }),
					);
					expect(result.status).toBe(201);
				}
			});

			await test.step("Then the dashboard should show statistics for each utility type", async () => {
				const dashboard = new DashboardPage(adminPage);
				await dashboard.goto();
				await dashboard.assertPageLoaded();
				await dashboard.assertStatsCardVisible("Gas", 15_000);
				await dashboard.assertStatsCardVisible("Water", 15_000);
			});
		});

		test("Scenario: measurement ingestion reflects on the dashboard", async ({
			adminPage,
		}) => {
			test.setTimeout(30_000);
			let hookup: { id: string };

			await test.step("Given an electricity hookup exists", async () => {
				const payload = validHookup({ utilityType: ELECTRICITY });
				hookup = await createHookup(payload);
				createdHookupIds.push(hookup.id);
			});

			await test.step("When a measurement is ingested", async () => {
				const result = await ingestMeasurement(
					hookup.id,
					validMeasurement({
						realTimeConsumption: 3.0,
					}),
				);
				expect(result.status).toBe(201);
			});

			await test.step("Then the dashboard should render utility statistics", async () => {
				const dashboard = new DashboardPage(adminPage);
				await dashboard.goto();
				await dashboard.assertPageLoaded();
				await dashboard.assertStatsCardVisible("Electricity", 15_000);
			});
		});
	});

	test.describe("Ingestion to Dashboard Map", () => {
		test("Scenario: ingested measurement causes hookup to appear active on dashboard map", async ({
			adminPage,
		}) => {
			test.setTimeout(60_000);
			let hookupName: string;

			await test.step("Given a floor plan exists", async () => {
				await createFloorPlan(minimalFloorPlanSvg());
			});

			await test.step("And a hookup is created and placed on the map", async () => {
				const hookup = validHookup({ utilityType: ELECTRICITY });
				const created = await createHookup(hookup);
				createdHookupIds.push(created.id);
				hookupName = created.name;

				const positioned = await placeHookupOnMap({
					id: created.id,
					position: { x: 300, y: 250 },
				});
				createdMapHookupIds.push(positioned.id);
			});

			await test.step("When a measurement is ingested for the hookup", async () => {
				const hookupId = createdHookupIds[0];
				if (!hookupId) {
					throw new Error("No hookup ID found");
				}

				const result = await ingestMeasurement(
					hookupId,
					validMeasurement({ realTimeConsumption: 2.0 }),
				);
				expect(result.status).toBe(201);
			});

			await test.step("And the hookup should be visible in the dashboard house map", async () => {
				const dashboard = new DashboardPage(adminPage);
				await dashboard.goto();
				await dashboard.assertPageLoaded();
				await dashboard.assertHouseMapVisible();
				await dashboard.assertHookupVisible(hookupName);
			});
		});
	});

	test.describe("Dashboard Chart Population", () => {
		test("Scenario: dashboard charts show real-time and historical data after ingestion", async ({
			adminPage,
		}) => {
			test.setTimeout(60_000);
			let hookup: { id: string };

			await test.step("Given measurements have been ingested", async () => {
				hookup = await createHookup(validHookup({ utilityType: ELECTRICITY }));
				createdHookupIds.push(hookup.id);

				const now = Date.now();
				for (let i = 0; i < 15; i++) {
					const ts = new Date(now - i * 30000).toISOString();
					const result = await ingestMeasurement(hookup.id, {
						realTimeConsumption: 1.0 + i * 0.15,
						timestamp: ts,
					});
					expect(result.status).toBe(201);
				}
			});

			await test.step("When the admin navigates to the dashboard", async () => {
				const dashboard = new DashboardPage(adminPage);
				await dashboard.goto();
				await dashboard.assertPageLoaded();
			});

			await test.step("Then the real-time and historical charts should render with canvas data", async () => {
				const dashboard = new DashboardPage(adminPage);

				await expect(dashboard.realTimeChartCanvas()).toBeVisible({
					timeout: 20_000,
				});

				await expect(dashboard.historicalChartCanvas()).toBeVisible({
					timeout: 20_000,
				});
			});
		});
	});

	test.describe("Waves-lab Integration", () => {
		test("Scenario: waves-lab devices are discoverable and valid", async () => {
			await test.step("Given the waves-lab service is running", async () => {
				const healthy = await checkWavesLabHealth();
				test.skip(!healthy, "Waves-lab service is not running on port 8000");
			});

			await test.step("When listing all devices via the waves-lab API", async () => {
				const devices = await listWavesLabDevices();
				expect(Array.isArray(devices)).toBe(true);
				expect(devices.length).toBe(15);
			});

			await test.step("Then each device should have a type, name, consumption value and status", async () => {
				const devices = (await listWavesLabDevices()) as {
					id: string;
					name: string;
					device_type: string;
					status: string;
					real_time_consumption: number;
					assigned_user: string | null;
				}[];

				for (const device of devices) {
					expect(device.id).toBeTruthy();
					expect(device.name).toBeTruthy();
					expect([ELECTRICITY, GAS, WATER].includes(device.device_type)).toBe(
						true,
					);
					expect(["on", "off"]).toContain(device.status);
					expect(device.real_time_consumption).toBeGreaterThan(0);
				}
			});

			await test.step("And devices should span all three utility types", async () => {
				const devices = (await listWavesLabDevices()) as {
					device_type: string;
				}[];

				const types = new Set(devices.map((d) => d.device_type));
				for (const expectedType of [ELECTRICITY, GAS, WATER]) {
					expect(types.has(expectedType)).toBe(true);
				}
			});
		});

		test("Scenario: measurement ingested with waves-lab payload format appears on dashboard", async ({
			adminPage,
		}) => {
			test.setTimeout(30_000);

			await test.step("Given waves-lab is running", async () => {
				const healthy = await checkWavesLabHealth();
				test.skip(!healthy, "Waves-lab service is not running on port 8000");
			});

			let hookup: { id: string };

			await test.step("And a hookup exists matching a waves-lab device type", async () => {
				const devices = (await listWavesLabDevices()) as {
					device_type: string;
				}[];
				const elecDevice = devices.find((d) => d.device_type === ELECTRICITY);
				expect(elecDevice).toBeDefined();

				hookup = await createHookup(validHookup({ utilityType: ELECTRICITY }));
				createdHookupIds.push(hookup.id);
			});

			await test.step("When a measurement is ingested in waves-lab DeviceRequest format", async () => {
				const measurement = {
					realTimeConsumption: 1.5,
					timestamp: new Date().toISOString(),
				};
				const result = await ingestMeasurement(hookup.id, measurement);
				expect(result.status).toBe(201);
			});

			await test.step("Then the dashboard should render electricity statistics", async () => {
				const dashboard = new DashboardPage(adminPage);
				await dashboard.goto();
				await dashboard.assertPageLoaded();
				await dashboard.assertStatsCardVisible("Electricity", 15_000);
			});
		});
	});
});
