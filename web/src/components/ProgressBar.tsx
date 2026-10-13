import { cn } from "../lib/cn";
import { Progress } from "./ui/progress";

/** Sendocs progress tones mapped onto the shadcn indicator. */
export type ProgressTone =
  | "default"
  | "waiting"
  | "complete"
  | "danger"
  | "success"
  | "info"
  | "warning";

const INDICATOR: Record<ProgressTone, string> = {
  default: "[&_[data-slot=progress-indicator]]:bg-primary",
  waiting: "[&_[data-slot=progress-indicator]]:bg-primary",
  complete: "[&_[data-slot=progress-indicator]]:bg-success",
  success: "[&_[data-slot=progress-indicator]]:bg-success",
  danger: "[&_[data-slot=progress-indicator]]:bg-destructive",
  info: "[&_[data-slot=progress-indicator]]:bg-info-text",
  warning: "[&_[data-slot=progress-indicator]]:bg-warning-text",
};

export type ProgressBarProps = {
  /** Completion from 0 to 100. */
  value: number;
  tone?: ProgressTone;
  /** Accessible name; the visible fraction is rendered by the caller. */
  label: string;
  className?: string;
};

/**
 * Sendocs progress bar built on shadcn's `Progress`. The `tone` prop is an app
 * extension; see `web/docs/ui-notes.md`.
 */
export function ProgressBar({
  value,
  tone = "default",
  label,
  className,
}: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, value));

  return (
    <Progress
      value={clamped}
      aria-label={label}
      className={cn(
        "[&_[data-slot=progress-track]]:h-1.5 [&_[data-slot=progress-track]]:bg-surface",
        INDICATOR[tone],
        className,
      )}
    />
  );
}
