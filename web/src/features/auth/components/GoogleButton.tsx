import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useState } from "react";
import { FormError } from "../../../components/forms/FormError";
import { GoogleIcon } from "../../../components/icons";
import { errorMessage } from "../../../lib/api/errors";
import { authApi } from "../api";

export type GoogleButtonProps = {
    label: string;
};

/**
 * Starts Google sign-in and sends the browser to Google's authorization page.
 * Google returns to the frontend callback route, which completes sign-in
 * through the existing API.
 */
export function GoogleButton({ label }: GoogleButtonProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function handleClick() {
        setLoading(true);
        setError(null);

        try {
            const { authUrl } = await authApi.googleAuthUrl();
            window.location.assign(authUrl);
        } catch (cause) {
            setError(errorMessage(cause));
            setLoading(false);
        }
    }

    return (
        <div>
            <Button
                variant="outline"
                disabled={loading}
                className="w-full gap-2"
                onClick={handleClick}
            >
                {loading ? (
                    <Spinner data-icon="inline-start" />
                ) : (
                    <GoogleIcon data-icon="inline-start" size={16} />
                )}
                {label}
            </Button>
            {error ? <FormError>{error}</FormError> : null}
        </div>
    );
}
