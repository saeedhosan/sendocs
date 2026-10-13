import { PasswordInput } from "@/components/PasswordInput";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import type { ChangeEvent, FormEvent } from "react";
import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../../app/providers/useAuth";
import { FormField } from "../../../components/forms/FormField";
import { ArrowForwardIcon } from "../../../components/icons";
import { AuthLayout } from "../../../layouts/AuthLayout";
import { errorMessage, validationErrors } from "../../../lib/api/errors";
import { AuthDivider } from "../components/AuthDivider";
import { GoogleButton } from "../components/GoogleButton";
import { fieldErrors, loginSchema } from "../schemas";

type LoginValues = {
    email: string;
    password: string;
    remember?: boolean;
};

type LocationState = {
    from?: { pathname?: string };
};

export function LoginPage() {
    const { login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const [values, setValues] = useState<LoginValues>({ email: "", password: "", remember: false });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [formError, setFormError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    const state = location.state as LocationState | null;
    const redirectTo = state?.from?.pathname ?? "/dashboard";

    function update(field: keyof LoginValues) {
        return (event: ChangeEvent<HTMLInputElement>) => {
            setValues((current) => ({ ...current, [field]: event.target.value }));
            setErrors((current) => {
                if (!(field in current)) {
                    return current;
                }

                const next = { ...current };
                delete next[field];
                return next;
            });
        };
    }

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setFormError(null);

        const parsed = loginSchema.safeParse(values);

        if (!parsed.success) {
            setErrors(fieldErrors(parsed.error));
            return;
        }

        setErrors({});
        setSubmitting(true);

        try {
            await login(parsed.data);
            navigate(redirectTo, { replace: true });
        } catch (error) {
            const fields = validationErrors(error);

            if (Object.keys(fields).length > 0) {
                setErrors(fields);
            } else {
                setFormError(errorMessage(error));
            }
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <AuthLayout>
            <div className="mb-6 text-center">
                <h1 className="mb-2 text-2xl leading-8 font-semibold tracking-[-0.025em] text-foreground">Sign in</h1>
                <p className="text-sm leading-5 text-muted-foreground">Sign in to your account to continue.</p>
            </div>

            <div className="mb-6">
                <GoogleButton label="Continue with Google" />
            </div>

            <AuthDivider label="or continue with email" uppercase />

            {formError ? (
                <Alert variant="destructive" className="mb-4">
                    {formError}
                </Alert>
            ) : null}

            <form className="flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
                <FormField label="Email address" error={errors.email}>
                    <Input
                        type="email"
                        name="email"
                        autoComplete="email"
                        placeholder="alex@example.com"
                        value={values.email}
                        onChange={update("email")}
                    />
                </FormField>

                <FormField
                    label="Password"
                    error={errors.password}
                    labelAction={
                        <Link to="/forgot-password" className="text-primary hover:text-primary/80 transition-colors">
                            Forgot password?
                        </Link>
                    }
                >
                    <PasswordInput
                        name="password"
                        autoComplete="current-password"
                        placeholder="••••••••••••"
                        value={values.password}
                        onChange={update("password")}
                    />
                </FormField>

                <div className="flex items-center gap-2 pt-1">
                    <Checkbox
                        id="remember"
                        name="remember"
                        checked={values.remember ?? false}
                        onCheckedChange={(checked) => {
                            setValues((current) => ({ ...current, remember: checked === true }));
                        }}
                    />
                    <Label htmlFor="remember" className="text-sm text-muted-foreground">
                        Remember this device for 30 days
                    </Label>
                </div>

                <div className="mt-0">
                    <Button type="submit" disabled={submitting} className="w-full">
                        {submitting ? <Spinner data-icon="inline-start" /> : null}
                        Sign in
                        <ArrowForwardIcon data-icon="inline-end" size={16} />
                    </Button>
                </div>
            </form>

            <p className="mt-6 text-center text-sm text-muted-foreground">
                Don&apos;t have an account?{" "}
                <Link
                    to="/register"
                    className="text-primary hover:text-primary/80 transition-colors"
                >
                    Create account
                </Link>
            </p>
        </AuthLayout>
    );
}
