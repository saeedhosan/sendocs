import { useEffect, useRef, useState } from "react";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../../app/providers/useAuth";
import {
    ChevronDownIcon,
    LockResetIcon,
    LogoutIcon,
    TrashIcon,
    UserIcon,
} from "../../../components/icons";
import { ThemeMenu } from "./ThemeMenu";

const MENU_GROUP = "py-1";
const ITEM =
    "flex items-center gap-2 w-full px-3 py-2 text-sm text-left cursor-pointer transition-colors duration-150 text-ink-secondary hover:bg-surface-muted hover:text-ink";
const ICON = "size-4 shrink-0";

function initials(name: string): string {
    const parts = name.trim().split(/\s+/).filter(Boolean);

    if (parts.length === 0) {
        return "?";
    }

    const first = parts[0]?.[0] ?? "";
    const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? "") : "";

    return `${first}${last}`.toUpperCase();
}

export function UserMenu() {
    const { user, logout, status } = useAuth();
    const navigate = useNavigate();
    const [open, setOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    const isAuthenticated = status === "authenticated";
    const displayName = user?.name ?? "Account";

    useEffect(() => {
        if (!open) {
            return;
        }

        function handlePointer(event: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setOpen(false);
            }
        }

        function handleKey(event: KeyboardEvent) {
            if (event.key === "Escape") {
                setOpen(false);
            }
        }

        document.addEventListener("mousedown", handlePointer);
        document.addEventListener("keydown", handleKey);

        return () => {
            document.removeEventListener("mousedown", handlePointer);
            document.removeEventListener("keydown", handleKey);
        };
    }, [open]);

    async function handleSignOut() {
        await logout();
        navigate("/login", { replace: true });
    }

    if (!isAuthenticated) {
        return null;
    }

    return (
        <div className="flex items-center gap-3">
            <ThemeMenu />
            <div className="relative" ref={menuRef}>
                <button
                    type="button"
                    className="inline-flex items-center cursor-pointer transition-colors duration-150 hover:text-ink gap-2 min-h-8 px-3 py-1.5 rounded-md bg-transparent text-[0.8125rem] font-medium text-ink-secondary hover:bg-surface-subtle"
                    aria-haspopup="menu"
                    aria-expanded={open}
                    aria-label={`${displayName}'s account menu`}
                    onClick={() => setOpen((value) => !value)}
                >
                    <span
                        className="inline-flex items-center justify-center size-8 rounded-full bg-surface-sunken text-ink-secondary font-medium text-sm"
                        aria-hidden="true"
                    >
                        {initials(displayName)}
                    </span>
                    <ChevronDownIcon size={14} className="text-ink-muted" />
                </button>
                {open ? (
                    <div
                        className="absolute right-0 top-full z-50 mt-1.5 min-w-50 border border-border-subtle rounded-lg bg-surface py-1 shadow-xl dark:shadow-gray-900/50"
                        role="menu"
                        aria-orientation="vertical"
                    >
                        <div className="px-3 py-2 border-b border-border-subtle">
                            <p className="text-sm font-medium text-ink truncate">
                                {displayName}
                            </p>
                            <p className="text-xs text-ink-muted truncate">
                                {user?.email}
                            </p>
                        </div>

                        <div className={MENU_GROUP} role="none">
                            <RouterLink
                                to="/dashboard"
                                role="menuitem"
                                className={ITEM}
                                onClick={() => setOpen(false)}
                            >
                                <UserIcon size={16} className={ICON} aria-hidden="true" />
                                Dashboard
                            </RouterLink>
                            <RouterLink
                                to="/settings/password"
                                role="menuitem"
                                className={ITEM}
                                onClick={() => setOpen(false)}
                            >
                                <LockResetIcon size={16} className={ICON} aria-hidden="true" />
                                Change password
                            </RouterLink>
                            <RouterLink
                                to="/settings/delete"
                                role="menuitem"
                                className={ITEM}
                                onClick={() => setOpen(false)}
                            >
                                <TrashIcon size={16} className={ICON} aria-hidden="true" />
                                Delete account
                            </RouterLink>
                        </div>

                        <div className="h-px bg-border-subtle my-1" role="separator" />

                        <div className={MENU_GROUP} role="none">
                            <button
                                type="button"
                                role="menuitem"
                                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-left cursor-pointer transition-colors duration-150 text-danger-text hover:bg-danger-surface hover:text-danger-text"
                                onClick={handleSignOut}
                            >
                                <LogoutIcon size={16} className={ICON} aria-hidden="true" />
                                Sign out
                            </button>
                        </div>
                    </div>
                ) : null}
            </div>
        </div>
    );
}