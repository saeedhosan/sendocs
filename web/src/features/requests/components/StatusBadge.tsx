import { Badge } from "@/components/ui/badge";
import { statusLabel, statusTone } from "../progress";
import type { RequestSummary } from "../types";

export type StatusBadgeProps = {
    request: Pick<RequestSummary, "status">;
};

/** Upload-progress chip: Waiting or Complete, never colour alone. */
export function StatusBadge({ request }: StatusBadgeProps) {
    const tone = statusTone(request);

    if (tone === "complete") {
        return (
            <Badge className="bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300">
                {statusLabel(request)}
            </Badge>
        );
    }

    return (
        <Badge className="bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300">
            {statusLabel(request)}
        </Badge>
    );
}
