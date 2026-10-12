import type { ReactNode } from "react";
import { useAuth } from "../app/providers/useAuth";
import { Container } from "../components/ui";
import { cn } from "../lib/cn";
import { Footer } from "./components/Footer";
import { Header } from "./components/Header";

export type AuthLayoutProps = {
    children: ReactNode;
    /** A single muted link at the top right, e.g. "Help" or "Back to account". */
    headerAction?: { label: string; to: string };
};

/**
 * The one container every auth page renders inside: the shared header (the
 * dashboard header once signed in, otherwise the minimal auth header), a
 * centered card, and the shared site footer — identical on login, register,
 * forgot/reset password, verify-email, and the settings pages.
 */
export function AuthLayout({ children, headerAction }: AuthLayoutProps) {
    const { status } = useAuth();
    const isAuthenticated = status === "authenticated";

    return (
        <div className={cn("flex flex-col min-h-screen")}>
            {isAuthenticated ? <Header /> : <Header mode="auth" authAction={headerAction} />}
            <main className={cn("[view-transition-name:page-content] flex-1 w-full")}>
                <Container className={"flex flex-col gap-6  my-40"}>
                    <div className="w-full max-w-md mx-auto p-8 bg-surface border border-border rounded-[10px] shadow-sm [&_input:not([type=checkbox]):not([type=radio])]:rounded-[10px] [&_button:not(.absolute)]:rounded-[10px]">
                        {children}
                    </div>
                </Container>
            </main>
            <Footer />
        </div>
    );
}
