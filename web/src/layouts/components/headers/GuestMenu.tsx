import { Link } from "../../../components/ui";
import { ThemeMenu } from "./ThemeMenu";

export function GuestMenu() {
    return (
        <div className="flex items-center gap-3">
            <ThemeMenu />
            <Link to="/login" variant="ghost" size="sm">
                Log in
            </Link>
            <Link to="/register" variant="primary" size="sm">
                Get started
            </Link>
        </div>
    );
}