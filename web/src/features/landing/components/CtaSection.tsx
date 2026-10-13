import { buttonVariants } from "@/components/ui/button";
import { Link } from "react-router-dom";

export function CtaSection() {
    return (
        <section className="flex flex-col items-start justify-between gap-6 p-6 bg-surface-subtle border border-border-subtle rounded-[10px] shadow-[0_1px_2px_rgba(0,0,0,0.02)] sm:flex-row sm:items-center sm:p-8">
            <div className="flex flex-col gap-1 max-w-[32rem]">
                <h2 className="text-xl leading-[1.5] font-semibold tracking-tight text-ink sm:text-[1.375rem]">
                    Ready to simplify document collection?
                </h2>
                <p className="text-[14px] leading-[1.5] text-marketing-text-secondary">
                    Create a request, share one link, and keep track of the documents you receive.
                </p>
            </div>
            <div className="shrink-0">
                <Link to="/register" className={buttonVariants({ size: "lg" })}>
                    Get started
                </Link>
            </div>
        </section>
    );
}
