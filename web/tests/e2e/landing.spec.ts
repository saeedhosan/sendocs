import type { Page } from "@playwright/test";
import { expect, test } from "@playwright/test";
import { app } from "../../src/config/app.ts";

/*
 * End-to-end coverage for the Phase 4 public pages.
 *
 * These are browser smoke tests for the client-side journeys, so the API is
 * faked at the network boundary: the SPA sees an unauthenticated session and
 * renders the public surface without the compose stack.
 */

const unauthEnvelope = {
    error: { code: "unauthenticated", message: "Not signed in." },
};

const sessionPayload = {
    user: {
        id: "1",
        name: "Alex Morgan",
        email: "alex@example.com",
        emailVerifiedAt: null,
    },
    csrfToken: "csrf-123",
    expiresAt: "2099-01-01T00:00:00Z",
};

function json(
    status: number,
    body: unknown,
): {
    status: number;
    contentType: string;
    body: string;
} {
    return { status, contentType: "application/json", body: JSON.stringify(body) };
}

async function stubUnauthenticated(page: Page) {
    await page.route("**/api/v1/auth/session", (route) => route.fulfill(json(401, unauthEnvelope)));
}

test.describe("public landing", () => {
    test.beforeEach(async ({ page }) => {
        await stubUnauthenticated(page);
    });

    test("a guest sees the landing page and can start sign up", async ({ page }) => {
        await page.goto("/");

        await expect(
            page.getByRole("heading", {
                name: "Collect client documents without the back-and-forth.",
            }),
        ).toBeVisible();

        await page.getByRole("link", { name: "Get started" }).first().click();

        await expect(page).toHaveURL(/\/register$/);
        await expect(page.getByRole("heading", { name: "Create your account" })).toBeVisible();
    });

    test("a guest can read the legal pages from the footer", async ({ page }) => {
        await page.goto("/");

        await page.getByRole("link", { name: "Terms" }).click();
        await expect(page).toHaveURL(/\/terms$/);
        await expect(page.getByRole("heading", { name: "Terms of Service" })).toBeVisible();

        await page.goto("/");

        await page.getByRole("link", { name: "Privacy" }).click();
        await expect(page).toHaveURL(/\/privacy$/);
        await expect(page.getByRole("heading", { name: "Privacy Policy" })).toBeVisible();
    });

    test("a guest can reach the contact page from the legal header", async ({ page }) => {
        await page.goto("/terms");

        await page.getByRole("link", { name: "Contact" }).first().click();

        await expect(page).toHaveURL(/contact$/);
        await expect(page.getByRole("heading", { name: "Contact" })).toBeVisible();
        await expect(page.getByRole("link", { name: app.emails.contact })).toHaveAttribute(
            "href",
            "mailto:" + app.emails.contact,
        );
    });
    test("a signed-in owner can still reach the landing page", async ({ page }) => {
        await page.route("**/api/v1/auth/session", (route) =>
            route.fulfill(json(200, sessionPayload)),
        );

        await page.goto("/");

        await expect(
            page.getByRole("heading", {
                name: "Collect client documents without the back-and-forth.",
            }),
        ).toBeVisible();

        // Open the profile menu to access Dashboard link
        await page.getByRole("button", { name: "Alex Morgan's account menu" }).click({ force: true });
        await page.waitForTimeout(500); // wait for dropdown animation
        await expect(page.getByRole("menuitem", { name: "Dashboard" })).toBeVisible({ timeout: 10000 });
    });
});
