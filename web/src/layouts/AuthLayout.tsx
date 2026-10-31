import type { ReactNode } from "react";
import { useAuth } from "../app/providers/useAuth";
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
 * centered card, and the shared site footer - identical on login, register,
 * forgot/reset password, verify-email, and the settings pages.
 */
export function AuthLayout({ children, headerAction }: AuthLayoutProps) {
    const { status } = useAuth();
    const isAuthenticated = status === "authenticated";

    return (
        <div className={cn("flex flex-col min-h-screen")}>
            {isAuthenticated ? <Header /> : <Header mode="auth" authAction={headerAction} />}
            <main className={cn("[view-transition-name:page-content] flex-1 w-full")}>
                <div className="w-full mx-auto px-3 min-[576px]:max-w-135 min-[768px]:max-w-180 min-[992px]:max-w-240 min-[1200px]:max-w-285 min-[1400px]:max-w-330 flex flex-col gap-6 my-40">
                    <div className="w-full max-w-md mx-auto p-8 bg-surface border border-border rounded-[10px] shadow-sm [&_input:not([type=checkbox]):not([type=radio])]:rounded-[10px] [&_button:not(.absolute)]:rounded-[10px]">
                        {children}
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
}
