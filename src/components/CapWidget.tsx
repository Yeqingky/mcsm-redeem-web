import "cap-widget";
import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
export type CapHandle = { reset: () => void };
export const CapWidget = forwardRef<
  CapHandle,
  { onSolve: (token: string) => void }
>(({ onSolve }, ref) => {
  const el = useRef<HTMLElement>(null);
  useImperativeHandle(ref, () => ({
    reset: () => {
      (el.current as HTMLElement & { reset?: () => void })?.reset?.();
    },
  }));
  useEffect(() => {
    const node = el.current;
    const solve = (e: Event) => onSolve((e as CustomEvent).detail.token);
    node?.addEventListener("solve", solve);
    return () => node?.removeEventListener("solve", solve);
  }, [onSolve]);
  const endpoint = `${String(import.meta.env.VITE_CAP_URL).replace(/\/$/, "")}/${import.meta.env.VITE_CAP_SITE_KEY}/`;
  return (
    <div className="flex w-full justify-end overflow-x-auto py-1">
      <cap-widget ref={el} data-cap-api-endpoint={endpoint} />
    </div>
  );
});
CapWidget.displayName = "CapWidget";
