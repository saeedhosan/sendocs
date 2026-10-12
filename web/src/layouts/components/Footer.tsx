import { Menu } from "../../components/navigation/Menu";
import { FOOTER_ITEMS } from "../../components/navigation/menu-items";
import { app } from "../../config/app";

/** Single footer used across the entire app. */
export function Footer() {
    return (
        <footer className="w-full mt-auto border-t border-border bg-surface">
            <div className="w-full mx-auto px-3 min-[576px]:max-w-135 min-[768px]:max-w-180 min-[992px]:max-w-240 min-[1200px]:max-w-285 min-[1400px]:max-w-330 flex flex-wrap items-center justify-center gap-2 h-16 text-[0.8125rem] leading-5 text-ink-muted text-center">
                <span>© 2026 {app.name}</span>
                <Menu
                    as="span"
                    className="inline-flex items-center gap-2"
                    items={FOOTER_ITEMS}
                    separator="·"
                    leadingSeparator
                    itemClassName={"transition-colors duration-150 hover:text-ink"}
                />
            </div>
        </footer>
    );
}
