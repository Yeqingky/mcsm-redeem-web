import { FormEvent, useEffect, useRef, useState } from "react";
import { LoaderCircle, RefreshCw, Save, Trash2 } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { ScrollArea, ScrollBar } from "../ui/scroll-area";
import { Switch } from "../ui/switch";
import type {
  AdminRequest,
  Notify,
  RateLimitConfig,
  RateLimitEntry,
} from "./types";

function formatTime(value: number) {
  return value ? new Date(value).toLocaleString() : "—";
}

export function RateLimitManagement({
  request,
  notify,
}: {
  request: AdminRequest;
  notify: Notify;
}) {
  const [config, setConfig] = useState<RateLimitConfig>();
  const [enabled, setEnabled] = useState(false);
  const [loginWindowSeconds, setLoginWindowSeconds] = useState(300);
  const [loginMax, setLoginMax] = useState(5);
  const [redeemWindowSeconds, setRedeemWindowSeconds] = useState(300);
  const [redeemMax, setRedeemMax] = useState(10);
  const [banSeconds, setBanSeconds] = useState(600);
  const [saving, setSaving] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [loading, setLoading] = useState(true);
  const [revision, setRevision] = useState(0);
  const [removing, setRemoving] = useState<string>();
  const requestRevision = useRef(0);

  useEffect(() => {
    const rev = ++requestRevision.current;
    setLoading(true);
    void (async () => {
      try {
        const result = await request<RateLimitConfig>("/api/admin/rate-limits");
        if (rev !== requestRevision.current) return;
        setConfig(result);
        setEnabled(result.enabled);
        setLoginWindowSeconds(result.loginWindowSeconds);
        setLoginMax(result.loginMax);
        setRedeemWindowSeconds(result.redeemWindowSeconds);
        setRedeemMax(result.redeemMax);
        setBanSeconds(result.banSeconds);
      } catch (error) {
        if (rev === requestRevision.current) {
          notify("error", "读取限流配置失败", {
            description: (error as Error).message,
          });
        }
      } finally {
        if (rev === requestRevision.current) setLoading(false);
      }
    })();
  }, [notify, request, revision]);

  async function toggle() {
    if (enabled && !window.confirm("确认关闭限流吗？已封禁的 IP 会全部解除。"))
      return;
    setToggling(true);
    try {
      await request(
        enabled
          ? "/api/admin/rate-limits/disable"
          : "/api/admin/rate-limits/enable",
        {
          method: "POST",
        },
      );
      notify("success", enabled ? "限流已关闭" : "限流已开启");
      setRevision((value) => value + 1);
    } catch (error) {
      notify("error", `${enabled ? "关闭" : "开启"}限流失败`, {
        description: (error as Error).message,
      });
    } finally {
      setToggling(false);
    }
  }

  async function saveConfig(event: FormEvent) {
    event.preventDefault();
    if (
      !Number.isInteger(loginWindowSeconds) ||
      loginWindowSeconds < 60 ||
      loginWindowSeconds > 86400 ||
      !Number.isInteger(redeemWindowSeconds) ||
      redeemWindowSeconds < 60 ||
      redeemWindowSeconds > 86400 ||
      !Number.isInteger(banSeconds) ||
      banSeconds < 60 ||
      banSeconds > 86400 ||
      !Number.isInteger(loginMax) ||
      loginMax < 1 ||
      loginMax > 100 ||
      !Number.isInteger(redeemMax) ||
      redeemMax < 1 ||
      redeemMax > 1000
    ) {
      notify("error", "限流参数无效", {
        description:
          "统计窗口与封禁时长 60 到 86400 秒，登录上限 1 到 100，兑换上限 1 到 1000",
      });
      return;
    }
    setSaving(true);
    try {
      const saved = await request<RateLimitConfig>("/api/admin/rate-limits", {
        method: "PUT",
        body: JSON.stringify({
          loginWindowSeconds,
          loginMax,
          redeemWindowSeconds,
          redeemMax,
          banSeconds,
        }),
      });
      setConfig(saved);
      notify("success", "限流配置已保存");
    } catch (error) {
      notify("error", "保存限流配置失败", {
        description: (error as Error).message,
      });
    } finally {
      setSaving(false);
    }
  }

  async function removeIP(kind: "login" | "redeem", ip: string) {
    if (!window.confirm(`确认解除 ${ip} 的限流吗？`)) return;
    setRemoving(ip);
    try {
      await request("/api/admin/rate-limits/ips/remove", {
        method: "POST",
        body: JSON.stringify({ kind, ip }),
      });
      notify("success", `已解除 ${ip} 的限流`);
      setRevision((value) => value + 1);
    } catch (error) {
      notify("error", "解除限流失败", {
        description: (error as Error).message,
      });
    } finally {
      setRemoving(undefined);
    }
  }

  const entries: (RateLimitEntry & { kind: "登录" | "兑换" })[] = [
    ...(config?.loginBlocked || []).map((entry) => ({
      ...entry,
      kind: "登录" as const,
    })),
    ...(config?.redeemBlocked || []).map((entry) => ({
      ...entry,
      kind: "兑换" as const,
    })),
  ];

  return (
    <div className="flex h-full min-h-0 flex-col gap-5">
      <div
        className={`grid gap-5 rounded-lg border bg-card p-4 sm:max-w-xl ${
          enabled ? "" : "opacity-60"
        }`}
      >
        <div className="flex items-center justify-between">
          <Label>限流开关</Label>
          <div className="flex items-center gap-2">
            {toggling && <LoaderCircle className="size-4 animate-spin" />}
            <Switch
              checked={enabled}
              disabled={toggling || !config}
              label="限流开关"
              onChange={() => void toggle()}
            />
          </div>
        </div>
        <form
          className="grid gap-5"
          onSubmit={saveConfig}
          aria-disabled={!enabled}
        >
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="rate-login-window">登录失败统计窗口（秒）</Label>
              <Input
                id="rate-login-window"
                type="number"
                min={60}
                max={86400}
                step={1}
                value={loginWindowSeconds}
                disabled={!enabled}
                onChange={(event) =>
                  setLoginWindowSeconds(Number(event.target.value))
                }
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="rate-login">登录失败上限（次）</Label>
              <Input
                id="rate-login"
                type="number"
                min={1}
                max={100}
                step={1}
                value={loginMax}
                disabled={!enabled}
                onChange={(event) => setLoginMax(Number(event.target.value))}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="rate-redeem-window">兑换失败统计窗口（秒）</Label>
              <Input
                id="rate-redeem-window"
                type="number"
                min={60}
                max={86400}
                step={1}
                value={redeemWindowSeconds}
                disabled={!enabled}
                onChange={(event) =>
                  setRedeemWindowSeconds(Number(event.target.value))
                }
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="rate-redeem">兑换失败上限（次）</Label>
              <Input
                id="rate-redeem"
                type="number"
                min={1}
                max={1000}
                step={1}
                value={redeemMax}
                disabled={!enabled}
                onChange={(event) => setRedeemMax(Number(event.target.value))}
                required
              />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="rate-ban">封禁时长（秒）</Label>
            <Input
              id="rate-ban"
              type="number"
              min={60}
              max={86400}
              step={1}
              value={banSeconds}
              disabled={!enabled}
              onChange={(event) => setBanSeconds(Number(event.target.value))}
              required
            />
          </div>
          <div className="flex justify-end">
            <Button type="submit" disabled={saving || !config || !enabled}>
              {saving && <LoaderCircle className="size-4 animate-spin" />}
              <Save className="size-4" />
              保存配置
            </Button>
          </div>
        </form>
      </div>

      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted-foreground">
          被封禁的 IP
        </h3>
        <Button
          type="button"
          variant="ghost"
          className="refresh-button"
          title="刷新封禁列表"
          aria-label="刷新封禁列表"
          onClick={() => setRevision((value) => value + 1)}
        >
          <RefreshCw className={`size-4 ${loading ? "refresh-spin" : ""}`} />
        </Button>
      </div>
      <ScrollArea className="min-h-40 flex-1 rounded-lg border">
        <table className="w-full min-w-[640px] border-collapse text-left text-sm">
          <thead className="sticky top-0 z-10 bg-muted">
            <tr>
              <th className="px-4 py-3 font-medium">IP</th>
              <th className="px-4 py-3 font-medium">类型</th>
              <th className="px-4 py-3 font-medium">失败次数</th>
              <th className="px-4 py-3 font-medium">最后失败时间</th>
              <th className="px-4 py-3 font-medium">封禁截止</th>
              <th className="w-24 px-4 py-3 text-right font-medium">操作</th>
            </tr>
          </thead>
          <tbody>
            {!config ? (
              <tr>
                <td className="h-40 text-center" colSpan={6}>
                  {loading ? (
                    <>
                      <LoaderCircle className="mr-2 inline size-4 animate-spin" />
                      正在读取限流状态
                    </>
                  ) : (
                    "读取限流状态失败"
                  )}
                </td>
              </tr>
            ) : entries.length === 0 ? (
              <tr>
                <td
                  className="h-40 text-center text-muted-foreground"
                  colSpan={6}
                >
                  {enabled ? "当前没有封禁中的 IP" : "限流已关闭"}
                </td>
              </tr>
            ) : (
              entries.map((entry) => (
                <tr
                  className="border-t hover:bg-muted/30"
                  key={`${entry.kind}-${entry.ip}`}
                >
                  <td className="px-4 py-3 font-mono text-xs">{entry.ip}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-800">
                      {entry.kind}
                    </span>
                  </td>
                  <td className="px-4 py-3">{entry.failures}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                    {formatTime(entry.lastFailureAt)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                    {formatTime(entry.banUntil)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button
                      type="button"
                      size="sm"
                      variant="destructive"
                      className="px-2.5"
                      aria-label={`解除 ${entry.ip} 的封禁`}
                      title="解除封禁"
                      disabled={removing !== undefined}
                      onClick={() =>
                        void removeIP(
                          entry.kind === "登录" ? "login" : "redeem",
                          entry.ip,
                        )
                      }
                    >
                      {removing === entry.ip ? (
                        <LoaderCircle className="size-4 animate-spin" />
                      ) : (
                        <Trash2 className="size-4" />
                      )}
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
}
