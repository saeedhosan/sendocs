import { Button } from "../../../components/ui";

import { formatBytes } from "../../../lib/format";
import type { RequestItem } from "../types";

export type ItemRowProps = {
    item: RequestItem;
    onDelete: (item: RequestItem) => void;
    onDownload: (item: RequestItem) => void;
};

export function ItemRow({ item, onDelete, onDownload }: ItemRowProps) {
    const file = item.document;

    return (
        <li className="flex flex-col gap-3 px-4 py-3.5 border-b border-border-subtle last:border-b-0 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
            <div className="min-w-0">
                <p className="text-sm font-medium leading-[1.35] text-ink">{item.label}</p>
                {file ? (
                    <p className="flex flex-wrap items-center gap-1.5 mt-1 font-mono text-xs text-ink-muted sm:gap-2">
                        <span className="overflow-hidden max-w-[12.5rem] text-ink-secondary truncate sm:max-w-none">
                            {file.originalName}
                        </span>
                        <span aria-hidden="true">•</span>
                        <span>{formatBytes(file.sizeBytes)}</span>
                    </p>
                ) : null}
            </div>
            {file ? (
                <div className="flex items-center gap-2 w-full pt-1 border-t border-border-subtle sm:w-auto sm:pt-0 sm:border-t-0 sm:shrink-0">
                    {file.downloadUrl ? (
                        <a
                            className="inline-flex flex-1 items-center justify-center gap-1.5 min-h-9 px-3 rounded-md bg-surface-muted text-[0.8125rem] font-medium text-primary hover:bg-surface-muted sm:flex-none sm:bg-transparent"
                            href={file.downloadUrl}
                            download={file.originalName}
                            onClick={() => onDownload(item)}
                        >
                            <span>Download</span>
                        </a>
                    ) : null}
                    <span className="hidden text-border sm:inline" aria-hidden="true">
                        |
                    </span>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="flex-1 min-h-8 px-3 rounded-md !bg-danger-surface !text-danger-text enabled:hover:!bg-danger-surface enabled:hover:!text-danger-text sm:flex-none sm:min-h-0 sm:!h-auto sm:!px-0 sm:!bg-transparent"
                        onClick={() => onDelete(item)}
                    >
                        Delete
                    </Button>
                </div>
            ) : (
                <p className="self-end text-xs font-medium text-ink-muted">Waiting</p>
            )}
        </li>
    );
}
