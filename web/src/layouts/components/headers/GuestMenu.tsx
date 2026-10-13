import { buttonVariants } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ThemeMenu } from "./ThemeMenu";

export function GuestMenu() {
    return (
        <div className="flex items-center gap-3">
            <ThemeMenu />
            <Link to="/login" className={buttonVariants({ variant: "ghost", size: "sm" })}>
                Log in
            </Link>
            <Link to="/register" className={buttonVariants({ size: "sm" })}>
                Get started
            </Link>
        </div>
    );
}
