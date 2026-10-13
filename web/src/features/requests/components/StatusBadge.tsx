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
        return <Badge className="bg-success/10">{statusLabel(request)}</Badge>;
    }

    return <Badge className="bg-warning-surface">{statusLabel(request)}</Badge>;
}
