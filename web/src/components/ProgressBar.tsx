import { cn } from "../../lib/cn";

export type ProgressTone = "waiting" | "complete" | "danger";

const TONES: Record<ProgressTone, string> = {
    waiting: "bg-primary",
    complete: "bg-success",
    danger: "bg-danger",
};

export type ProgressBarProps = {
    /** Completion from 0 to 100. */
    value: number;
    tone?: ProgressTone;
    /** Accessible name; the visible fraction is rendered by the caller. */
    label: string;
    className?: string;
};

export function ProgressBar({ value, tone = "waiting", label, className }: ProgressBarProps) {
    const clamped = Math.min(100, Math.max(0, value));

    return (
        <div
            className={cn("w-full h-1.5 overflow-hidden rounded-full bg-surface", className)}
            role="progressbar"
            aria-label={label}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={clamped}
        >
            <span
                className={cn("h-full rounded-full [transition:width_150ms_ease]", TONES[tone])}
                style={{ width: `${clamped}%` }}
            />
        </div>
    );
}
