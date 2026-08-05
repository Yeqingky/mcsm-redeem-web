import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import {
  BarChart3,
  KeyRound,
  LogOut,
  Package,
  TicketCheck,
} from "lucide-react";
import { CapWidget, type CapHandle } from "../CapWidget";
import { Button } from "../ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { CardManagement } from "./CardManagement";
import { SkuManagement } from "./SkuManagement";
import { StatsOverview } from "./StatsOverview";
import type { AdminRequest, Notify, SKU } from "./types";

const sidebarNavClass =
  "justify-start transition-transform duration-100 active:translate-y-0 active:scale-[0.98] active:brightness-100 active:shadow-none";

export function AdminPanel({
  baseRequest,
  notify,
  sidebarOpen,
  onCloseSidebar,
}: {
  baseRequest: AdminRequest;
  notify: Notify;
  sidebarOpen: boolean;
  onCloseSidebar: () => void;
}) {
  const [logged, setLogged] = useState(false);
  const [checking, setChecking] = useState(true);
  const [password, setPassword] = useState("");
  const [capToken, setCapToken] = useState("");
  const [section, setSection] = useState<"stats" | "codes" | "skus">("stats");
  const [skus, setSkus] = useState<SKU[]>([]);
  const cap = useRef<CapHandle>(null);

  const request: AdminRequest = useCallback(
    (path, options = {}) => {
      const headers = new Headers(options.headers);
      if (options.body !== undefined && !headers.has("Content-Type")) {
        headers.set("Content-Type", "application/json");
      }
      return baseRequest(path, {
        ...options,
        credentials: "include",
        headers,
      });
    },
    [baseRequest],
  );

  const loadSKUs = useCallback(async () => {
    const result = await request<SKU[]>("/api/admin/skus");
    setSkus(result);
    setLogged(true);
  }, [request]);

  useEffect(() => {
    loadSKUs()
      .catch(() => setLogged(false))
      .finally(() => setChecking(false));
  }, [loadSKUs]);

  async function login(event: FormEvent) {
    event.preventDefault();
    try {
      await request("/api/admin/login", {
        method: "POST",
        body: JSON.stringify({ password, capToken }),
      });
      setPassword("");
      await loadSKUs();
      notify("success", "登录成功");
    } catch (error) {
      notify("error", "登录失败", {
        description: (error as Error).message,
      });
    } finally {
      setCapToken("");
      cap.current?.reset();
    }
  }

  async function logout() {
    try {
      await request("/api/admin/logout", { method: "POST" });
      setLogged(false);
      setSkus([]);
      notify("success", "已退出登录");
    } catch (error) {
      notify("error", "退出失败", {
        description: (error as Error).message,
      });
    }
  }

  function chooseSection(next: "stats" | "codes" | "skus") {
    setSection(next);
    onCloseSidebar();
  }

  if (checking) {
    return (
      <div className="admin-login">
        <Card className="mx-auto w-full max-w-xl">
          <CardContent className="py-14 text-center text-muted-foreground">
            正在检查管理会话…
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!logged) {
    return (
      <div className="admin-login">
        <Card className="mx-auto w-full max-w-xl">
          <CardHeader>
            <CardTitle>管理面板</CardTitle>
            <CardDescription>登录后管理卡密和实例套餐</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="grid gap-5" onSubmit={login}>
              <div className="grid gap-2">
                <Label htmlFor="admin-password">管理员密码</Label>
                <Input
                  id="admin-password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                />
              </div>
              <CapWidget ref={cap} onSolve={setCapToken} />
              <Button disabled={!capToken}>
                <KeyRound className="size-4" />
                登录
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="admin-shell overflow-hidden rounded-xl border bg-card shadow-sm">
      {sidebarOpen && (
        <div
          className="fixed inset-0 top-16 z-40 bg-black/55 md:hidden"
          aria-hidden="true"
          onClick={onCloseSidebar}
        />
      )}
      <aside
        className={`fixed bottom-0 left-0 top-16 z-50 flex w-64 shrink-0 -translate-x-full flex-col gap-2 bg-card p-3 transition-transform duration-200 md:static md:w-52 md:translate-x-0 md:flex-col md:border-r md:border-b-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="hidden px-3 pb-3 pt-2 md:block">
          <p className="font-semibold">管理面板</p>
          <p className="mt-1 text-xs text-muted-foreground">MCSM Redeem</p>
        </div>
        <Button
          type="button"
          className={sidebarNavClass}
          variant={section === "stats" ? "default" : "ghost"}
          onClick={() => chooseSection("stats")}
        >
          <BarChart3 className="size-4" />
          数据概况
        </Button>
        <Button
          type="button"
          className={sidebarNavClass}
          variant={section === "codes" ? "default" : "ghost"}
          onClick={() => chooseSection("codes")}
        >
          <TicketCheck className="size-4" />
          卡密管理
        </Button>
        <Button
          type="button"
          className={sidebarNavClass}
          variant={section === "skus" ? "default" : "ghost"}
          onClick={() => chooseSection("skus")}
        >
          <Package className="size-4" />
          套餐管理
        </Button>
        <Button
          type="button"
          className="mt-auto justify-start"
          variant="ghost"
          onClick={() => void logout()}
        >
          <LogOut className="size-4" />
          <span className="hidden sm:inline">退出登录</span>
        </Button>
      </aside>
      <section className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden p-4 sm:p-6">
        {section === "stats" ? (
          <StatsOverview request={request} notify={notify} />
        ) : section === "codes" ? (
          <CardManagement request={request} notify={notify} skus={skus} />
        ) : (
          <SkuManagement
            request={request}
            notify={notify}
            skus={skus}
            reload={loadSKUs}
          />
        )}
      </section>
    </div>
  );
}
