"use client";

import * as React from "react";
import { X } from "lucide-react";

import { cn } from "@/lib/utils";

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

/**
 * Modal built on the native `<dialog>` element, which gives us the top layer,
 * inert background, focus containment and Escape handling for free.
 */
export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  className,
}: ModalProps) {
  const dialogRef = React.useRef<HTMLDialogElement>(null);
  const titleId = React.useId();
  const descriptionId = React.useId();

  React.useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      onClose={onClose}
      onClick={(event) => {
        // Clicks land on the dialog element itself only for the backdrop area.
        if (event.target === dialogRef.current) onClose();
      }}
      className={cn(
        "rounded-modal border-line-subtle bg-surface text-ink shadow-raised m-auto w-[min(32rem,calc(100vw-2rem))] border p-0",
        "backdrop:bg-[rgba(0,0,0,0.32)]",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-4 p-6 pb-4">
        <div className="flex flex-col gap-1">
          <h2
            id={titleId}
            className="text-[1.0625rem] font-semibold tracking-[-0.01em]"
          >
            {title}
          </h2>
          {description ? (
            <p
              id={descriptionId}
              className="text-ink-secondary text-sm leading-relaxed"
            >
              {description}
            </p>
          ) : null}
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="关闭对话框"
          className="text-ink-tertiary hover:bg-surface-sunken hover:text-ink rounded-sm p-1 transition-colors"
        >
          <X className="size-4" aria-hidden />
        </button>
      </div>

      {children ? <div className="px-6 pb-6">{children}</div> : null}
      {footer ? (
        <div className="border-line-subtle flex justify-end gap-2 border-t px-6 py-4">
          {footer}
        </div>
      ) : null}
    </dialog>
  );
}
