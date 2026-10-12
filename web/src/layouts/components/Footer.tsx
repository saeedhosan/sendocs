import { Menu } from "../../components/navigation/Menu";
import { FOOTER_ITEMS } from "../../components/navigation/menu-items";
import { Container } from "../../components/ui";
import { app } from "../../config/app";

/** Single footer used across the entire app. */
export function Footer() {
    return (
        <footer className="w-full mt-auto border-t border-border bg-surface">
            <Container className="flex flex-wrap items-center justify-center gap-2 h-16 text-[0.8125rem] leading-5 text-ink-muted text-center">
                <span>© 2026 {app.name}</span>
                <Menu
                    as="span"
                    className="inline-flex items-center gap-2"
                    items={FOOTER_ITEMS}
                    separator="·"
                    leadingSeparator
                    itemClassName={"transition-colors duration-150 hover:text-ink"}
                />
            </Container>
        </footer>
    );
}
