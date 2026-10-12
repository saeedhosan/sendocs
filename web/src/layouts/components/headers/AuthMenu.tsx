import { Link } from "../../../components/ui";
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
            <Link to={authAction.to} variant="ghost" size="sm">
                {authAction.label}
            </Link>
        </div>
    );
}