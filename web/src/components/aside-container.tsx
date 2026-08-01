import { Button } from "@nala/ui/components/button";
import { Separator } from "@nala/ui/components/separator";
import { cn } from "@nala/ui/lib/utils";
import { RiSidebarFoldLine, RiSidebarUnfoldLine } from "@remixicon/react";
import { useCallback, useEffect, useRef, useState } from "react";

/** Width bounds in pixels. */
export const ASIDE_MIN_WIDTH = 240;
export const ASIDE_MAX_WIDTH = 480;
export const ASIDE_DEFAULT_WIDTH = 320;

type AsideContainerProps = {
  side: "left" | "right";
  title: string;
  children: React.ReactNode;
  isOpen?: boolean;
  closable?: boolean;
  defaultIsOpen?: boolean;
  onIsOpenChange?: (isOpen: boolean) => void;
  minWidth?: number;
  maxWidth?: number;
  defaultWidth?: number;
  className?: string;
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

export function AsideContainer({
  side,
  title,
  children,
  closable = true,
  minWidth = ASIDE_MIN_WIDTH,
  maxWidth = ASIDE_MAX_WIDTH,
  defaultWidth = ASIDE_DEFAULT_WIDTH,
  className,
  defaultIsOpen = true,
  isOpen,
  onIsOpenChange,
}: AsideContainerProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultIsOpen);
  const [width, setWidth] = useState(() =>
    clamp(defaultWidth, minWidth, maxWidth),
  );

  // Controlled when `isOpen` is supplied, uncontrolled otherwise; a
  // non-closable aside is pinned open either way.
  const open = closable ? (isOpen ?? uncontrolledOpen) : true;

  const setOpen = useCallback(
    (next: boolean) => {
      if (isOpen === undefined) setUncontrolledOpen(next);
      onIsOpenChange?.(next);
    },
    [isOpen, onIsOpenChange],
  );

  const [resizing, setResizing] = useState(false);
  const asideRef = useRef<HTMLElement>(null);

  const CollapseIcon =
    side === "left" ? RiSidebarFoldLine : RiSidebarUnfoldLine;
  const ExpandIcon = side === "left" ? RiSidebarUnfoldLine : RiSidebarFoldLine;

  const onPointerDown = useCallback((event: React.PointerEvent) => {
    event.preventDefault();
    setResizing(true);
  }, []);

  useEffect(() => {
    if (!resizing) return;

    const onPointerMove = (event: PointerEvent) => {
      const rect = asideRef.current?.getBoundingClientRect();
      if (!rect) return;

      const next =
        side === "left"
          ? event.clientX - rect.left
          : rect.right - event.clientX;

      setWidth(clamp(next, minWidth, maxWidth));
    };

    const stop = () => setResizing(false);

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", stop);

    // Keep the cursor consistent while dragging over the rest of the page.
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";

    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", stop);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [resizing, side, minWidth, maxWidth]);

  if (closable && !open) {
    return (
      <aside
        className={cn(
          "flex shrink-0 flex-col items-center gap-2 border-border py-3",
          side === "left" ? "border-r" : "border-l",
        )}
      >
        <Button
          size="icon"
          variant="ghost"
          aria-label={`Show ${title}`}
          title={`Show ${title}`}
          onClick={() => setOpen(true)}
        >
          <ExpandIcon className="size-4" />
        </Button>
      </aside>
    );
  }

  return (
    <aside
      ref={asideRef}
      style={{ width, minWidth, maxWidth }}
      className={cn(
        "relative flex shrink-0 flex-col border-border bg-sidebar",
        side === "left" ? "border-r" : "border-l",
        className,
      )}
    >
      <header className="flex h-12 items-center justify-between gap-2 px-3">
        <span className="truncate text-sm font-medium">{title}</span>
        {closable && (
          <Button
            size="icon"
            variant="ghost"
            aria-label={`Hide ${title}`}
            title={`Hide ${title}`}
            onClick={() => setOpen(false)}
          >
            <CollapseIcon className="size-4" />
          </Button>
        )}
      </header>

      <Separator />

      <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>

      {/* biome-ignore lint/a11y/noStaticElementInteractions: resize handle, keyboard users collapse instead */}
      <div
        onPointerDown={onPointerDown}
        onDoubleClick={() => setWidth(clamp(defaultWidth, minWidth, maxWidth))}
        className={cn(
          "absolute inset-y-0 z-10 w-1 cursor-col-resize transition-colors hover:bg-border",
          side === "left" ? "-right-0.5" : "-left-0.5",
          resizing && "bg-primary/40",
        )}
      />
    </aside>
  );
}
