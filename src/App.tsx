import {
  FormEvent,
  type KeyboardEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import { CheckCircle2, Clock3, LoaderCircle, LogOut } from "lucide-react";
import { toast } from "sonner";
import { Button } from "./components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./components/ui/card";
import { Input } from "./components/ui/input";
import { Label } from "./components/ui/label";
import { Textarea } from "./components/ui/textarea";
import { Toaster } from "./components/ui/sonner";
import { CapWidget, type CapHandle } from "./components/CapWidget";
const api = String(import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");
const siteName = import.meta.env.VITE_SITE_NAME || "夜轻面板兑换页";
const panelUrl = "https://mcsm.yeqing.net/";
const maxRedeemDays = 106751;
type CodeCount = { days: number; count: number };
type CodeStatus = {
  code: string;
  days: number;
  used: boolean;
  usedAt: number | null;
  username: string;
  password: string;
  ipAddress: string;
};
type ImportResult = {
  added: number;
  duplicates: number;
  failed: number;
  duplicateCodes: string[];
  failedCodes: string[];
};
type NoticeOptions = { description?: string; id?: string };
document.title = siteName;
function notify(
  level: "success" | "error",
  title: string,
  options: NoticeOptions = {},
) {
  const detail = options.description || "";
  if (level === "error") {
    console.error(`[通知] ${title}`, detail);
    toast.error(title, { ...options, duration: 5000 });
  } else {
    console.info(`[通知] ${title}`, detail);
    toast.success(title, { ...options, duration: 5000 });
  }
}
async function json(path: string, opt: RequestInit = {}) {
  const r = await fetch(api + path, opt);
  const x = r.status === 204 ? {} : await r.json();
  if (!r.ok) throw Error(x.error);
  return x;
}
function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-2">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
function Redeem() {
  const [action, setAction] = useState<"provision" | "renew">("provision"),
    [submittedAction, setSubmittedAction] = useState<"provision" | "renew">(
      "provision",
    ),
    [code, setCode] = useState(""),
    [instanceId, setInstanceId] = useState(""),
    [capToken, setCapToken] = useState(""),
    [task, setTask] = useState<any>(),
    [busy, setBusy] = useState(false);
  const cap = useRef<CapHandle>(null);
  useEffect(() => {
    if (!task?.id || !["queued", "processing"].includes(task.status)) return;
    const id = setInterval(
      () =>
        json(`/api/tasks/${task.id}`)
          .then(setTask)
          .catch((e) =>
            notify("error", "查询任务失败", {
              id: "task-poll-error",
              description: e.message,
            }),
          ),
      1500,
    );
    return () => clearInterval(id);
  }, [task?.id, task?.status]);
  useEffect(() => {
    if (task?.status === "success") {
      notify(
        "success",
        submittedAction === "provision" ? "开通成功" : "续费成功",
      );
    } else if (task?.status === "failed") {
      notify("error", "兑换失败", { description: task.error });
    }
  }, [task?.status]);
  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setSubmittedAction(action);
    try {
      setTask(
        await json("/api/tasks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action,
            code,
            instanceId: action === "renew" ? instanceId : "",
            capToken,
          }),
        }),
      );
    } catch (e) {
      const message = (e as Error).message;
      notify("error", "提交失败", { description: message });
    } finally {
      setBusy(false);
      setCapToken("");
      cap.current?.reset();
    }
  }
  async function copy(value: string) {
    try {
      await navigator.clipboard.writeText(value);
      notify("success", "复制成功");
    } catch {
      notify("error", "复制失败，请手动复制");
    }
  }
  function copyOnKeyDown(event: KeyboardEvent<HTMLElement>, value: string) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      copy(value);
    }
  }
  function changeAction(nextAction: "provision" | "renew") {
    if (nextAction !== action && task?.status === "success") {
      setTask(undefined);
    }
    setAction(nextAction);
  }
  return (
    <Card>
      <CardHeader>
        <CardTitle>卡密兑换</CardTitle>
        <CardDescription>开通新实例，或为已有实例延长使用时间</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-6 grid grid-cols-2 rounded-lg bg-muted p-1">
          <Button
            type="button"
            variant={action === "provision" ? "default" : "ghost"}
            onClick={() => changeAction("provision")}
          >
            开通实例
          </Button>
          <Button
            type="button"
            variant={action === "renew" ? "default" : "ghost"}
            onClick={() => changeAction("renew")}
          >
            续费实例
          </Button>
        </div>
        {(!task || task.status === "failed") && (
          <form className="grid gap-5" onSubmit={submit}>
            <div
              className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out motion-reduce:transition-none ${
                action === "renew"
                  ? "grid-rows-[1fr] opacity-100"
                  : "grid-rows-[0fr] opacity-0"
              }`}
              aria-hidden={action !== "renew"}
            >
              <div className="min-h-0 overflow-hidden">
                <Field label="实例 ID">
                  <Input
                    value={instanceId}
                    onChange={(e) => setInstanceId(e.target.value)}
                    autoComplete="off"
                    disabled={action !== "renew"}
                    required={action === "renew"}
                  />
                </Field>
              </div>
            </div>
            <Field label="卡密">
              <Input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                autoComplete="off"
                required
              />
            </Field>
            <CapWidget ref={cap} onSolve={setCapToken} />
            <Button disabled={busy || !capToken}>
              {busy && <LoaderCircle className="size-4 animate-spin" />}提交兑换
            </Button>
          </form>
        )}
        {task && ["queued", "processing"].includes(task.status) && (
          <div className="grid justify-items-center gap-3 py-10 text-center">
            <LoaderCircle className="size-9 animate-spin text-primary" />
            <h3 className="text-xl font-semibold">
              {task.status === "queued" ? "排队中" : "正在处理"}
            </h3>
            {task.status === "queued" && <p>当前排队位置：{task.position}</p>}
            <p className="text-muted-foreground">
              等待中的任务：{task.waiting}
            </p>
          </div>
        )}
        {task?.status === "success" && (
          <div className="grid gap-4 py-4">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="size-10 shrink-0 text-emerald-600" />
              <h3 className="text-2xl font-semibold">
                {submittedAction === "provision" ? "开通成功" : "续费成功"}
              </h3>
            </div>
            <p className="result">
              实例 ID
              <code
                role="button"
                tabIndex={0}
                title="点击复制实例 ID"
                onClick={() => copy(task.result.instanceId)}
                onKeyDown={(event) =>
                  copyOnKeyDown(event, task.result.instanceId)
                }
              >
                {task.result.instanceId}
              </code>
            </p>
            {submittedAction === "provision" && (
              <>
                <p className="result">
                  使用地址
                  <a
                    className="ml-auto text-primary underline-offset-4 hover:underline"
                    href={panelUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {panelUrl}
                  </a>
                </p>
                <p className="result">
                  用户名
                  <code
                    role="button"
                    tabIndex={0}
                    title="点击复制用户名"
                    onClick={() => copy(task.result.username)}
                    onKeyDown={(event) =>
                      copyOnKeyDown(event, task.result.username)
                    }
                  >
                    {task.result.username}
                  </code>
                </p>
                <p className="result">
                  密码
                  <code
                    role="button"
                    tabIndex={0}
                    title="点击复制密码"
                    onClick={() => copy(task.result.password)}
                    onKeyDown={(event) =>
                      copyOnKeyDown(event, task.result.password)
                    }
                  >
                    {task.result.password}
                  </code>
                </p>
                <p className="rounded-md bg-amber-50 p-3 text-sm text-amber-900">
                  请立即保存账号密码，也可在卡密管理页凭卡密查询。
                </p>
              </>
            )}
            <p>
              <Clock3 className="mr-2 inline size-4" />
              到期时间：{new Date(task.result.endTime).toLocaleString()}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
function Admin() {
  const [logged, setLogged] = useState(false),
    [password, setPassword] = useState(""),
    [capToken, setCapToken] = useState(""),
    [days, setDays] = useState(30),
    [codes, setCodes] = useState(""),
    [counts, setCounts] = useState<CodeCount[]>([]),
    [queryCode, setQueryCode] = useState(""),
    [codeStatus, setCodeStatus] = useState<CodeStatus>();
  const cap = useRef<CapHandle>(null),
    initialLoadStarted = useRef(false);
  const req = (p: string, o: RequestInit = {}) => {
    const headers = new Headers(o.headers);
    if (o.body !== undefined && !headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }
    return json(p, { ...o, credentials: "include", headers });
  };
  const load = () =>
    req("/api/admin/codes/counts")
      .then((x) => {
        setCounts(x);
        setLogged(true);
      })
      .catch(() => setLogged(false));
  useEffect(() => {
    if (initialLoadStarted.current) return;
    initialLoadStarted.current = true;
    load();
  }, []);
  async function login(e: FormEvent) {
    e.preventDefault();
    try {
      await req("/api/admin/login", {
        method: "POST",
        body: JSON.stringify({ password, capToken }),
      });
      setPassword("");
      await load();
      notify("success", "登录成功");
    } catch (e) {
      const message = (e as Error).message;
      notify("error", "登录失败", { description: message });
    } finally {
      setCapToken("");
      cap.current?.reset();
    }
  }
  async function imports(e: FormEvent) {
    e.preventDefault();
    try {
      const x = (await req("/api/admin/codes/import", {
        method: "POST",
        body: JSON.stringify({ days, codes }),
      })) as ImportResult;
      console.info("[卡密导入] 接口返回", x);
      if (x.duplicateCodes.length > 0) {
        console.warn("[卡密导入] 重复卡密", x.duplicateCodes);
      }
      if (x.failedCodes.length > 0) {
        console.error("[卡密导入] 失败卡密", x.failedCodes);
      }
      const result = `新增 ${x.added} 张，重复 ${x.duplicates} 张，失败 ${x.failed} 张`;
      setCodes("");
      await load();
      notify("success", "批量导入完成", { description: result });
    } catch (e) {
      const message = (e as Error).message;
      notify("error", "批量导入失败", { description: message });
    }
  }
  async function lookup(e: FormEvent) {
    e.preventDefault();
    try {
      const status = await req("/api/admin/codes/status", {
        method: "POST",
        body: JSON.stringify({ code: queryCode }),
      });
      setCodeStatus(status);
    } catch (e) {
      setCodeStatus(undefined);
      const message = (e as Error).message;
      notify("error", "查询失败", { description: message });
    }
  }
  async function logout() {
    try {
      await req("/api/admin/logout", { method: "POST" });
      setLogged(false);
      setCodeStatus(undefined);
      notify("success", "已退出登录");
    } catch (e) {
      const message = (e as Error).message;
      notify("error", "退出失败", { description: message });
    }
  }
  return (
    <Card>
      <CardHeader>
        <CardTitle>卡密管理</CardTitle>
        <CardDescription>查询卡密状态，或批量导入指定有效天数的卡密</CardDescription>
      </CardHeader>
      <CardContent>
        {!logged ? (
          <form className="grid gap-5" onSubmit={login}>
            <Field label="管理员密码">
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </Field>
            <CapWidget ref={cap} onSolve={setCapToken} />
            <Button disabled={!capToken}>登录</Button>
          </form>
        ) : (
          <>
            {counts.length > 0 ? (
              <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {counts.map((item) => (
                  <div className="stat" key={item.days}>
                    {item.days} 天卡密<strong>{item.count}</strong>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mb-6 text-sm text-muted-foreground">
                暂无未使用卡密
              </p>
            )}
            <form
              className="mb-6 grid gap-3 rounded-lg border p-4"
              onSubmit={lookup}
            >
              <Field label="查询卡密状态">
                <div className="flex gap-3">
                  <Input
                    value={queryCode}
                    onChange={(e) => setQueryCode(e.target.value)}
                    autoComplete="off"
                    required
                  />
                  <Button type="submit" variant="outline" className="shrink-0">
                    查询
                  </Button>
                </div>
              </Field>
            </form>
            {codeStatus && (
              <div className="mb-6 grid gap-2 rounded-lg border p-4 text-sm">
                <div className="flex items-start justify-between gap-4">
                  <code className="break-all">{codeStatus.code}</code>
                  <strong className="shrink-0">
                    {codeStatus.used ? "已使用" : "未使用"}
                  </strong>
                </div>
                <p>有效天数：{codeStatus.days} 天</p>
                {codeStatus.used && (
                  <>
                    <p>
                      使用时间：
                      {codeStatus.usedAt
                        ? new Date(codeStatus.usedAt).toLocaleString()
                        : "—"}
                    </p>
                    <p>IP 地址：{codeStatus.ipAddress || "—"}</p>
                    <p>用户名：{codeStatus.username || "—"}</p>
                    <p>
                      密码：<code>{codeStatus.password || "—"}</code>
                    </p>
                  </>
                )}
              </div>
            )}
            <form className="grid gap-5" onSubmit={imports}>
              <Field label="有效天数">
                <Input
                  type="number"
                  min={1}
                  max={maxRedeemDays}
                  step={1}
                  value={days}
                  onChange={(e) => setDays(Number(e.target.value))}
                  required
                />
              </Field>
              <Field label="每行一张卡密">
                <Textarea
                  rows={12}
                  value={codes}
                  onChange={(e) => setCodes(e.target.value)}
                  required
                />
              </Field>
              <Button>批量导入</Button>
              <Button type="button" variant="outline" onClick={logout}>
                <LogOut className="size-4" />
                退出登录
              </Button>
            </form>
          </>
        )}
      </CardContent>
    </Card>
  );
}
export default function App() {
  const requestedPath = window.location.pathname;
  const page = requestedPath === "/admin" ? <Admin /> : <Redeem />;
  if (requestedPath !== "/" && requestedPath !== "/admin") {
    window.history.replaceState(null, "", "/");
  }
  return (
    <>
      <header>
        <a className="font-semibold" href="/">
          {siteName}
        </a>
        <a className="text-sm text-muted-foreground" href="/admin">
          卡密管理
        </a>
      </header>
      <main>{page}</main>
      <Toaster />
    </>
  );
}
