import { useState } from "react";
import { Gauge, ShieldCheck } from "lucide-react";
import { CaptchaSettings } from "./CaptchaSettings";
import { RateLimitManagement } from "./RateLimitManagement";
import type { AdminRequest, Notify } from "./types";

const tabClass =
  "relative flex items-center gap-1.5 py-2.5 text-sm outline-none transition-colors duration-150 motion-reduce:transition-none";
const activeTabClass =
  "font-medium text-blue-600 after:absolute after:inset-x-0 after:-bottom-[2px] after:h-0.5 after:rounded-full after:bg-blue-600 dark:text-blue-400 dark:after:bg-blue-400";
const idleTabClass = "text-muted-foreground hover:text-foreground";

export function SettingsPanel({
  request,
  notify,
}: {
  request: AdminRequest;
  notify: Notify;
}) {
  const [tab, setTab] = useState<"captcha" | "rate">("captcha");
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-5">
      <div className="pl-4">
        <h2 className="text-2xl font-semibold">系统设置</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          配置人机验证与登录、兑换的限流策略
        </p>
      </div>
      <div className="flex items-center gap-6 border-b border-border">
        <button
          type="button"
          role="tab"
          aria-selected={tab === "captcha"}
          className={`${tabClass} ${
            tab === "captcha" ? activeTabClass : idleTabClass
          }`}
          onClick={() => setTab("captcha")}
        >
          <ShieldCheck className="size-4" />
          验证码
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "rate"}
          className={`${tabClass} ${
            tab === "rate" ? activeTabClass : idleTabClass
          }`}
          onClick={() => setTab("rate")}
        >
          <Gauge className="size-4" />
          限流管理
        </button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto pr-1">
        {tab === "captcha" ? (
          <CaptchaSettings request={request} notify={notify} />
        ) : (
          <RateLimitManagement request={request} notify={notify} />
        )}
      </div>
    </div>
  );
}
