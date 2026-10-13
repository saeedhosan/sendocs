import { Link } from "react-router-dom";
import { buttonVariants } from "@/components/ui/button";
import { ThemeMenu } from "./ThemeMenu";

export type AuthMenuProps = {
    authAction?: { label: string; to: string };
};

export function AuthMenu({ authAction }: AuthMenuProps) {
    if (!authAction) {
        return <ThemeMenu />;
    }

    return (
        <div className="flex items-center gap-3">
            <ThemeMenu />
            <Link
                to={authAction.to}
                className={buttonVariants({ variant: "ghost", size: "sm" })}
            >
                {authAction.label}
            </Link>
        </div>
    );
}