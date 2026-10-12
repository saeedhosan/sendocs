import type { CSSProperties } from "react";
import { cn } from "../../lib/cn";

export type SkeletonProps = {
    width?: string;
    height?: string;
    radius?: string;
    className?: string;
};

/** A neutral placeholder that keeps layout stable while data loads. */
export function Skeleton({
    width = "100%",
    height = "1rem",
    radius = "var(--radius-sm)",
    className,
}: SkeletonProps) {
    const style: CSSProperties = { width, height, borderRadius: radius };

    return (
        <span
            className={cn(
                "block bg-surface-sunken rounded-sm animate-skeleton motion-reduce:animate-none",
                className,
            )}
            style={style}
            aria-hidden="true"
        />
    );
}
