import { useAuth } from "../../app/providers/useAuth";
import { Logo } from "../../components/navigation/Logo";
import { Container } from "../../components/ui";
import { cn } from "../../lib/cn";
import { AuthMenu } from "./headers/AuthMenu";
import { GuestMenu } from "./headers/GuestMenu";
import { UserMenu } from "./headers/UserMenu";

export type HeaderMode = "auto" | "auth";

export type HeaderProps = {
    mode?: HeaderMode;
    authAction?: { label: string; to: string };
};

/**
 * Single header used across the entire app. For auth pages, pass mode="auth" and
 * optionally authAction; for authenticated users show the user menu on all pages.
 */
export function Header({ mode = "auto", authAction }: HeaderProps) {
    const { status } = useAuth();
    const isAuthenticated = status === "authenticated";
    const isAuth = mode === "auth";

    return (
        <header
            className={cn(
                "top-0 z-50 w-full border-b border-border fixed backdrop-blur-md bg-surface",
            )}
        >
            <Container className={cn("flex items-center justify-between gap-4 h-14")}>
                <Logo variant="brand" />

                {isAuth ? (
                    <AuthMenu authAction={authAction} />
                ) : isAuthenticated ? (
                    <UserMenu />
                ) : (
                    <GuestMenu />
                )}
            </Container>
        </header>
    );
}
