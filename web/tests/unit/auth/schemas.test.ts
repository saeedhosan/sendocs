import { describe, expect, it } from "vitest";
import {
    changePasswordSchema,
    deleteAccountSchema,
    fieldErrors,
    loginSchema,
    registerSchema,
    resetPasswordSchema,
} from "../../../src/features/auth/schemas";

const validPassword = "correcthorsebattery";

describe("loginSchema", () => {
    it("accepts a valid email and non-empty password", () => {
        expect(loginSchema.safeParse({ email: "alex@example.com", password: "x" }).success).toBe(
            true,
        );
    });

    it("rejects a malformed email", () => {
        expect(loginSchema.safeParse({ email: "nope", password: "x" }).success).toBe(false);
    });
});

describe("registerSchema", () => {
    it("accepts a matching 12+ character password", () => {
        expect(
            registerSchema.safeParse({
                name: "Alex",
                email: "alex@example.com",
                password: validPassword,
                confirmPassword: validPassword,
            }).success,
        ).toBe(true);
    });

    it("rejects a password under 12 characters", () => {
        const result = registerSchema.safeParse({
            name: "Alex",
            email: "alex@example.com",
            password: "short",
            confirmPassword: "short",
        });

        expect(result.success).toBe(false);
        if (!result.success) {
            expect(fieldErrors(result.error).password).toMatch(/at least 12/);
        }
    });

    it("rejects mismatched passwords on the confirm field", () => {
        const result = registerSchema.safeParse({
            name: "Alex",
            email: "alex@example.com",
            password: validPassword,
            confirmPassword: `${validPassword}!`,
        });

        expect(result.success).toBe(false);
        if (!result.success) {
            expect(fieldErrors(result.error).confirmPassword).toMatch(/do not match/);
        }
    });
});

describe("resetPasswordSchema", () => {
    it("requires a 12+ character password", () => {
        expect(
            resetPasswordSchema.safeParse({
                password: "short",
                confirmPassword: "short",
            }).success,
        ).toBe(false);
    });
});

describe("changePasswordSchema", () => {
    it("rejects reusing the current password", () => {
        const result = changePasswordSchema.safeParse({
            currentPassword: validPassword,
            password: validPassword,
            confirmPassword: validPassword,
        });

        expect(result.success).toBe(false);
        if (!result.success) {
            expect(fieldErrors(result.error).password).toMatch(/different/);
        }
    });

    it("accepts a new, distinct password", () => {
        expect(
            changePasswordSchema.safeParse({
                currentPassword: validPassword,
                password: "anotherlongpassword",
                confirmPassword: "anotherlongpassword",
            }).success,
        ).toBe(true);
    });
});

describe("deleteAccountSchema", () => {
    const schema = deleteAccountSchema("alex@example.com");

    it("accepts the account email typed as confirmation", () => {
        expect(
            schema.safeParse({ password: validPassword, confirm: "alex@example.com" })
                .success,
        ).toBe(true);
    });

    it("rejects a different email on the confirm field", () => {
        const result = schema.safeParse({
            password: validPassword,
            confirm: "someone@example.com",
        });

        expect(result.success).toBe(false);
        if (!result.success) {
            expect(fieldErrors(result.error).confirm).toMatch(/exactly/);
        }
    });

    it("requires a password", () => {
        const result = schema.safeParse({ password: "", confirm: "alex@example.com" });

        expect(result.success).toBe(false);
        if (!result.success) {
            expect(fieldErrors(result.error).password).toMatch(/Enter your password/);
        }
    });
});

describe("fieldErrors", () => {
    it("keeps only the first message per top-level field", () => {
        const result = loginSchema.safeParse({ email: "", password: "" });

        expect(result.success).toBe(false);
        if (!result.success) {
            const errors = fieldErrors(result.error);
            expect(Object.keys(errors)).toEqual(["email", "password"]);
        }
    });
});
