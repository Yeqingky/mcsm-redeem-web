import "cap-widget";
import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import type { CaptchaConfig } from "../../lib/client";

export type CaptchaHandle = { reset: () => void };
type WidgetProps = {
  config: CaptchaConfig;
  onSolve: (token: string) => void;
};

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement,
        options: { sitekey: string; callback: (token: string) => void },
      ) => string;
      reset: (widgetId?: string) => void;
      remove: (widgetId: string) => void;
    };
    hcaptcha?: {
      render: (
        container: HTMLElement,
        options: { sitekey: string; callback: (token: string) => void },
      ) => number;
      reset: (widgetId?: number) => void;
      remove: (widgetId: number) => void;
    };
  }
}

function loadScript(src: string): Promise<void> {
  return new Promise((resolve) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.onload = () => resolve();
    document.head.appendChild(script);
  });
}

// 官方脚本的 onload 可能早于全局对象就绪，轮询等待最多 10 秒。
function waitFor(check: () => boolean, timeout = 10_000): Promise<void> {
  return new Promise((resolve) => {
    const start = Date.now();
    const tick = () => {
      if (check()) return resolve();
      if (Date.now() - start >= timeout) return resolve();
      setTimeout(tick, 50);
    };
    tick();
  });
}

const CapWidget = forwardRef<CaptchaHandle, WidgetProps>(
  ({ config, onSolve }, ref) => {
    const el = useRef<HTMLElement>(null);
    useImperativeHandle(ref, () => ({
      reset: () => {
        (el.current as HTMLElement & { reset?: () => void })?.reset?.();
      },
    }));
    useEffect(() => {
      const node = el.current;
      const solve = (e: Event) =>
        onSolve((e as CustomEvent).detail.token as string);
      node?.addEventListener("solve", solve);
      return () => node?.removeEventListener("solve", solve);
    }, [onSolve]);
    const endpoint = `${config.url.replace(/\/$/, "")}/${config.siteKey}/`;
    return (
      <div className="flex w-full justify-end overflow-x-auto py-1">
        <cap-widget ref={el} data-cap-api-endpoint={endpoint} />
      </div>
    );
  },
);
CapWidget.displayName = "CapWidget";

const TurnstileWidget = forwardRef<CaptchaHandle, WidgetProps>(
  ({ config, onSolve }, ref) => {
    const container = useRef<HTMLDivElement>(null);
    const widgetId = useRef("");
    const onSolveRef = useRef(onSolve);
    onSolveRef.current = onSolve;

    useImperativeHandle(ref, () => ({
      reset: () => window.turnstile?.reset(widgetId.current || undefined),
    }));

    useEffect(() => {
      const el = container.current;
      if (!el) return;
      let cancelled = false;
      const render = () => {
        if (cancelled || !window.turnstile) return;
        el.replaceChildren();
        widgetId.current = window.turnstile.render(el, {
          sitekey: config.siteKey,
          callback: (token) => onSolveRef.current(token),
        });
      };
      if (window.turnstile) {
        render();
      } else {
        void loadScript("https://challenges.cloudflare.com/turnstile/v0/api.js")
          .then(() => waitFor(() => !!window.turnstile))
          .then(render);
      }
      return () => {
        cancelled = true;
        if (widgetId.current) window.turnstile?.remove(widgetId.current);
      };
    }, [config.siteKey]);

    return (
      <div className="flex w-full justify-end overflow-x-auto py-1">
        <div ref={container} />
      </div>
    );
  },
);
TurnstileWidget.displayName = "TurnstileWidget";

const HCaptchaWidget = forwardRef<CaptchaHandle, WidgetProps>(
  ({ config, onSolve }, ref) => {
    const container = useRef<HTMLDivElement>(null);
    const widgetId = useRef<number | undefined>(undefined);
    const onSolveRef = useRef(onSolve);
    onSolveRef.current = onSolve;

    useImperativeHandle(ref, () => ({
      reset: () => window.hcaptcha?.reset(widgetId.current),
    }));

    useEffect(() => {
      const el = container.current;
      if (!el) return;
      let cancelled = false;
      const render = () => {
        if (cancelled || !window.hcaptcha) return;
        el.replaceChildren();
        widgetId.current = window.hcaptcha.render(el, {
          sitekey: config.siteKey,
          callback: (token) => onSolveRef.current(token),
        });
      };
      if (window.hcaptcha) {
        render();
      } else {
        void loadScript("https://hcaptcha.com/1/api.js")
          .then(() => waitFor(() => !!window.hcaptcha))
          .then(render);
      }
      return () => {
        cancelled = true;
        if (widgetId.current !== undefined) {
          window.hcaptcha?.remove(widgetId.current);
        }
      };
    }, [config.siteKey]);

    return (
      <div className="flex w-full justify-end overflow-x-auto py-1">
        <div ref={container} />
      </div>
    );
  },
);
HCaptchaWidget.displayName = "HCaptchaWidget";

export const CaptchaWidget = forwardRef<CaptchaHandle, WidgetProps>(
  ({ config, onSolve }, ref) => {
    const provider = String(config.provider || "").toLowerCase();
    if (!provider) return null;
    if (provider === "cap") {
      return <CapWidget ref={ref} config={config} onSolve={onSolve} />;
    }
    if (provider === "turnstile") {
      if (!config.siteKey)
        return <p className="text-xs text-destructive">人机验证配置缺失</p>;
      return <TurnstileWidget ref={ref} config={config} onSolve={onSolve} />;
    }
    if (provider === "hcaptcha") {
      if (!config.siteKey)
        return <p className="text-xs text-destructive">人机验证配置缺失</p>;
      return <HCaptchaWidget ref={ref} config={config} onSolve={onSolve} />;
    }
    return <p className="text-xs text-destructive">未知的人机验证提供商</p>;
  },
);
CaptchaWidget.displayName = "CaptchaWidget";
