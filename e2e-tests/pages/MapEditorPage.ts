import { expect, type Locator } from "@playwright/test";
import { BasePage } from "./BasePage";

export class MapEditorPage extends BasePage {
	async goto() {
		await super.goto("/mapeditor");
	}

	mapCanvas(): Locator {
		return this.page.getByRole("img", {
			name: "Interactive floor plan map",
		});
	}

	async clickMapToPosition(x: number, y: number) {
		const box = await this.mapCanvas().boundingBox();
		if (!box) throw new Error("Map canvas not visible");
		await this.page.mouse.click(box.x + x, box.y + y);
	}

	async assertOnPage() {
		await expect(this.page).toHaveURL(/\/mapeditor/);
	}

	// ── Zone toolbar ──────────────────────────────────

	createZoneButton(): Locator {
		return this.page.getByRole("button", {
			name: "Create a new zone on the map",
		});
	}

	continueToZoneSetupButton(): Locator {
		return this.page.getByRole("button", {
			name: "Continue to zone setup dialog",
		});
	}

	cancelZoneDrawingButton(): Locator {
		return this.page.getByRole("button", {
			name: "Cancel drawing and return to view mode",
		});
	}

	// ── Hookup toolbar ────────────────────────────────

	createHookupButton(): Locator {
		return this.page.getByRole("button", {
			name: "Create a new smart furniture hookup",
		});
	}

	continueToHookupSetupButton(): Locator {
		return this.page.getByRole("button", {
			name: "Continue to hookup setup dialog",
		});
	}

	cancelHookupDrawingButton(): Locator {
		return this.page.getByRole("button", {
			name: "Cancel drawing and return to view mode",
		});
	}

	// ── Zone dialog ───────────────────────────────────

	zoneDialog(): Locator {
		return this.page.locator(".p-dialog").filter({ hasText: /zone|Zone/i }).first();
	}

	zoneNameInput(): Locator {
		return this.zoneDialog().getByLabel("Name");
	}

	zoneSaveButton(): Locator {
		return this.zoneDialog().getByRole("button", { name: /save/i });
	}

	zoneDialogError(): Locator {
		return this.zoneDialog().getByRole("alert").first();
	}

	async assertZoneDialogOpen() {
		await expect(this.zoneDialog()).toBeVisible({ timeout: 5_000 });
	}

	async assertZoneDialogClosed() {
		await expect(this.zoneDialog()).not.toBeVisible({ timeout: 5_000 });
	}

	// ── Hookup dialog ─────────────────────────────────

	hookupDialog(): Locator {
		return this.page.locator(".p-dialog").filter({ hasText: /hookup/i }).first();
	}

	endpointInput(): Locator {
		return this.hookupDialog().getByRole("textbox", { name: "Endpoint" });
	}

	syncButton(): Locator {
		return this.hookupDialog().getByRole("button", {
			name: "Sync utility information from endpoint",
		});
	}

	hookupNameInput(): Locator {
		return this.hookupDialog().getByRole("textbox", { name: "Name" });
	}

	hookupSaveButton(): Locator {
		return this.hookupDialog().getByRole("button", { name: /save/i });
	}

	hookupCancelButton(): Locator {
		return this.hookupDialog().getByRole("button", { name: /cancel/i });
	}

	hookupDialogError(): Locator {
		return this.hookupDialog().getByRole("alert").first();
	}

	async assertHookupDialogOpen() {
		await expect(this.hookupDialog()).toBeVisible({ timeout: 5_000 });
	}

	async assertHookupDialogClosed() {
		await expect(this.hookupDialog()).not.toBeVisible({ timeout: 5_000 });
	}

	// ── Zone tree sidebar ─────────────────────────────

	zoneTreeItem(name: string): Locator {
		return this.page.getByRole("button", { name: `Edit zone ${name}` });
	}

	deleteZoneButton(name: string): Locator {
		return this.page.getByRole("button", { name: `Delete zone ${name}` });
	}

	async assertZoneInTree(name: string) {
		await expect(this.zoneTreeItem(name)).toBeVisible({ timeout: 20_000 });
	}

	async assertZoneNotInTree(name: string) {
		await expect(this.zoneTreeItem(name)).toHaveCount(0, { timeout: 5_000 });
	}

	// ── Hookup tree sidebar ───────────────────────────

	hookupTreeItem(name: string): Locator {
		return this.page.getByRole("button", { name: `Edit hookup ${name}` });
	}

	deleteHookupButton(name: string): Locator {
		return this.page.getByRole("button", { name: `Delete hookup ${name}` });
	}

	async assertHookupInTree(name: string) {
		await expect(this.hookupTreeItem(name)).toBeVisible({ timeout: 20_000 });
	}

	async assertHookupNotInTree(name: string) {
		await expect(this.hookupTreeItem(name)).toHaveCount(0, { timeout: 5_000 });
	}

	// ── Confirm dialog ────────────────────────────────

	confirmDialog(): Locator {
		return this.page.locator(".p-confirmdialog, .p-confirm-dialog").first();
	}

	confirmDeleteButton(): Locator {
		return this.confirmDialog().getByRole("button", { name: /delete/i });
	}

	// ── Zone actions ──────────────────────────────────

	async drawZonePolygon(vertices: { x: number; y: number }[]) {
		await this.createZoneButton().click();
		await expect(this.cancelZoneDrawingButton()).toBeVisible({
			timeout: 5_000,
		});
		for (const vertex of vertices) {
			await this.clickMapToPosition(vertex.x, vertex.y);
		}
		const nearFirst = vertices[0];
		await this.clickMapToPosition(nearFirst.x + 3, nearFirst.y + 3);
		await expect(this.continueToZoneSetupButton()).toBeVisible({
			timeout: 5_000,
		});
		await this.continueToZoneSetupButton().click();
		await this.assertZoneDialogOpen();
	}

	async createZoneViaUI(name: string, vertices: { x: number; y: number }[]) {
		await this.drawZonePolygon(vertices);
		await this.zoneNameInput().fill(name);
		await this.zoneSaveButton().click();
	}

	async editZoneViaUI(currentName: string, newName: string) {
		await this.zoneTreeItem(currentName).click();
		await this.assertZoneDialogOpen();
		await this.zoneNameInput().fill(newName);
		await this.zoneSaveButton().click();
	}

	async deleteZoneViaUI(name: string) {
		await this.deleteZoneButton(name).click();
		await expect(this.confirmDialog()).toBeVisible({ timeout: 3_000 });
		await this.confirmDeleteButton().click();
	}

	// ── Hookup actions ────────────────────────────────

	async createHookupViaUI(endpoint: string): Promise<string> {
		await this.createHookupButton().click();
		await expect(this.cancelHookupDrawingButton()).toBeVisible({
			timeout: 5_000,
		});
		await this.clickMapToPosition(200, 200);
		await expect(this.continueToHookupSetupButton()).toBeVisible({
			timeout: 5_000,
		});
		await this.continueToHookupSetupButton().click();
		await this.assertHookupDialogOpen();

		await this.endpointInput().fill(endpoint);
		await this.syncButton().click();
		await expect(this.hookupNameInput()).not.toHaveValue("", {
			timeout: 10_000,
		});
		const name = await this.hookupNameInput().inputValue();
		await expect(this.hookupSaveButton()).toBeEnabled({ timeout: 15_000 });
		await this.hookupSaveButton().click();
		return name;
	}

	async editHookupName(currentName: string, newName: string) {
		await this.hookupTreeItem(currentName).click();
		await this.assertHookupDialogOpen();
		await this.hookupNameInput().fill(newName);
		await this.hookupSaveButton().click();
	}

	async deleteHookupViaUI(name: string) {
		await this.deleteHookupButton(name).click();
		await expect(this.confirmDialog()).toBeVisible({ timeout: 3_000 });
		await this.confirmDeleteButton().click();
	}

	async createHookupWithSyncViaUI(
		endpoint: string,
		x = 200,
		y = 200,
	): Promise<string> {
		await this.createHookupButton().click();
		await expect(this.cancelHookupDrawingButton()).toBeVisible({
			timeout: 5_000,
		});
		await this.clickMapToPosition(x, y);
		await expect(this.continueToHookupSetupButton()).toBeVisible({
			timeout: 5_000,
		});
		await this.continueToHookupSetupButton().click();
		await this.assertHookupDialogOpen();
		await this.endpointInput().fill(endpoint);
		await this.syncButton().click();
		await expect(this.hookupNameInput()).not.toHaveValue("", {
			timeout: 10_000,
		});
		const name = await this.hookupNameInput().inputValue();
		await expect(this.hookupSaveButton()).toBeEnabled({ timeout: 15_000 });
		await this.hookupSaveButton().click();
		return name;
	}
}
