import type { ChangeEvent } from "react";
import { useRef } from "react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { cn } from "../../../lib/cn";
import { progressIndicatorClass } from "../../../lib/progressStyles";
import { ACCEPT_ATTRIBUTE } from "../precheck";
import type { PortalItem } from "../types";
import type { ItemFailure } from "../useUploadQueue";

export type PortalItemRowProps = {
    item: PortalItem;
    /** Present only while a transfer for this item is in flight. */
    percent?: number;
    /** Present only while this item waits for a transfer slot. */
    queued?: boolean;
    failure?: ItemFailure;
    onPick: (itemId: string, file: File) => void;
    /** Lets the page focus the first failed item's action. */
    actionRef?: (node: HTMLButtonElement | null) => void;
};

export function PortalItemRow({
    item,
    percent,
    queued = false,
    failure,
    onPick,
    actionRef,
}: PortalItemRowProps) {
    const inputRef = useRef<HTMLInputElement>(null);
    const uploaded = item.state === "uploaded" && item.file !== null;
    const uploading = percent !== undefined;

    function openPicker() {
        inputRef.current?.click();
    }

    function handleChange(event: ChangeEvent<HTMLInputElement>) {
        const file = event.target.files?.[0];
        event.target.value = "";

        if (file) {
            onPick(item.id, file);
        }
    }

    return (
        <li className="flex flex-col gap-2 p-[0.875rem] border-b border-border-subtle last:border-b-0 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:p-4 md:p-5">
            <div className="min-w-0">
                {uploaded && item.file ? (
                    <>
                        <p className="text-sm font-medium leading-[1.4] text-ink [overflow-wrap:anywhere] sm:text-base sm:leading-6">
                            {item.label}
                        </p>
                        <p className="flex flex-wrap items-center gap-2 mt-0.5 font-mono text-xs text-ink-muted sm:text-sm">
                            <span>Uploaded</span>
                            <span aria-hidden="true">·</span>
                            <span className="overflow-hidden max-w-full text-ink-secondary text-ellipsis whitespace-nowrap">
                                {item.file.originalName}
                            </span>
                        </p>
                    </>
                ) : uploading ? (
                    <>
                        <div className="flex flex-wrap items-center justify-between gap-2">
                            <p className="text-sm font-medium leading-[1.4] text-ink [overflow-wrap:anywhere] sm:text-base sm:leading-6">
                                {item.label}
                            </p>
                            <span className="flex-shrink-0 font-mono text-xs text-ink-muted sm:text-sm">
                                Uploading · {percent}%
                            </span>
                        </div>
                        <div className="mt-2">
                            <Progress
                                value={percent ?? 0}
                                aria-label={`Uploading ${item.label}`}
                                className={progressIndicatorClass("waiting")}
                            />
                        </div>
                    </>
                ) : failure ? (
                    <>
                        <p className="text-sm font-medium leading-[1.4] text-ink [overflow-wrap:anywhere] sm:text-base sm:leading-6">
                            {item.label}
                        </p>
                        <p className="mt-1.5 text-xs text-[#e11d48] sm:text-sm" role="alert">
                            Upload failed · {failure.message}
                        </p>
                    </>
                ) : queued ? (
                    <>
                        <p className="text-sm font-medium leading-[1.4] text-ink [overflow-wrap:anywhere] sm:text-base sm:leading-6">
                            {item.label}
                        </p>
                        <p className="mt-1 text-xs text-ink-muted sm:text-sm">
                            Waiting for a free slot…
                        </p>
                    </>
                ) : (
                    <>
                        <p className="text-sm font-medium leading-[1.4] text-ink [overflow-wrap:anywhere] sm:text-base sm:leading-6">
                            {item.label}
                        </p>
                        <p className="mt-1 text-xs text-ink-muted sm:text-sm">
                            Waiting for upload · Max 25 MB
                        </p>
                    </>
                )}
            </div>

            <div className="flex items-center w-full empty:hidden sm:flex-shrink-0 sm:w-auto">
                {uploaded ? (
                    <span className="text-[0.8125rem] font-medium text-success-text">Uploaded</span>
                ) : uploading ? null : (
                    <>
                        <input
                            ref={inputRef}
                            className="sr-only"
                            type="file"
                            accept={ACCEPT_ATTRIBUTE}
                            onChange={handleChange}
                            aria-label={`Choose a file for ${item.label}`}
                        />
                        <Button
                            ref={actionRef}
                            className={cn(
                                "w-full min-h-8 px-4 rounded-md text-[0.75rem]! sm:w-auto sm:min-h-9.5 sm:text-[0.875rem]!",
                                failure && "border-border! enabled:hover:bg-surface-muted",
                            )}
                            variant={failure ? "secondary" : "default"}
                            size="sm"
                            onClick={openPicker}
                            disabled={queued}
                            aria-label={`${failure ? "Try again" : "Upload"}: ${item.label}`}
                        >
                            {queued ? "Queued" : failure ? "Try again" : "Upload"}
                        </Button>
                    </>
                )}
            </div>
        </li>
    );
}
