import { FormEvent, useEffect, useRef, useState } from "react";
import { BrowserRouter, Link, Route, Routes } from "react-router-dom";
import { CheckCircle2, Clock3, Copy, LoaderCircle, LogOut } from "lucide-react";
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
import { CapWidget, type CapHandle } from "./components/CapWidget";
const api = String(import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");
const siteName = import.meta.env.VITE_SITE_NAME || "夜轻面板兑换页";
document.title = siteName;
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
    [code, setCode] = useState(""),
    [username, setUsername] = useState(""),
    [password, setPassword] = useState(""),
    [capToken, setCapToken] = useState(""),
    [task, setTask] = useState<any>(),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const cap = useRef<CapHandle>(null);
  useEffect(() => {
    if (!task?.id || !["queued", "processing"].includes(task.status)) return;
    const id = setInterval(
      () =>
        json(`/api/tasks/${task.id}`)
          .then(setTask)
          .catch((e) => setError(e.message)),
      1500,
    );
    return () => clearInterval(id);
  }, [task?.id, task?.status]);
  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      setTask(
        await json("/api/tasks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action, code, username, password, capToken }),
        }),
      );
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
      setCapToken("");
      cap.current?.reset();
    }
  }
  const copy = (v: string) => navigator.clipboard.writeText(v);
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
            onClick={() => setAction("provision")}
          >
            开通实例
          </Button>
          <Button
            type="button"
            variant={action === "renew" ? "default" : "ghost"}
            onClick={() => setAction("renew")}
          >
            续费实例
          </Button>
        </div>
        {(!task || task.status === "failed") && (
          <form className="grid gap-5" onSubmit={submit}>
            {action === "renew" && (
              <>
                <Field label="用户名">
                  <Input
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    autoComplete="username"
                    required
                  />
                </Field>
                <Field label="密码">
                  <Input
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    type="password"
                    autoComplete="current-password"
                    required
                  />
                </Field>
              </>
            )}
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
            <CheckCircle2 className="size-10 text-emerald-600" />
            <h3 className="text-xl font-semibold">
              {action === "provision" ? "开通成功" : "续费成功"}
            </h3>
            {action === "provision" && (
              <>
                <p className="result">
                  用户名 <code>{task.result.username}</code>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copy(task.result.username)}
                  >
                    <Copy className="size-4" />
                  </Button>
                </p>
                <p className="result">
                  密码 <code>{task.result.password}</code>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copy(task.result.password)}
                  >
                    <Copy className="size-4" />
                  </Button>
                </p>
                <Button
                  variant="outline"
                  onClick={() =>
                    copy(
                      `用户名：${task.result.username}\n密码：${task.result.password}`,
                    )
                  }
                >
                  复制全部信息
                </Button>
                <p className="rounded-md bg-amber-50 p-3 text-sm text-amber-900">
                  系统不会保存账号密码，请立即保存到密码管理器。关闭或刷新页面后可能无法再次查看。
                </p>
              </>
            )}
            <p>
              <Clock3 className="mr-2 inline size-4" />
              到期时间：{new Date(task.result.endTime).toLocaleString()}
            </p>
          </div>
        )}
        {(error || task?.error) && (
          <p className="mt-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            {error || task.error}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
function Admin() {
  const [logged, setLogged] = useState(false),
    [password, setPassword] = useState(""),
    [capToken, setCapToken] = useState(""),
    [months, setMonths] = useState(1),
    [codes, setCodes] = useState(""),
    [counts, setCounts] = useState<any>({}),
    [message, setMessage] = useState("");
  const cap = useRef<CapHandle>(null);
  const req = (p: string, o: RequestInit = {}) =>
    json(p, {
      credentials: "include",
      ...o,
      headers: { "Content-Type": "application/json", ...(o.headers || {}) },
    });
  const load = () =>
    req("/api/admin/codes/counts")
      .then((x) => {
        setCounts(x);
        setLogged(true);
      })
      .catch(() => setLogged(false));
  useEffect(() => {
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
    } catch (e) {
      setMessage((e as Error).message);
    } finally {
      setCapToken("");
      cap.current?.reset();
    }
  }
  async function imports(e: FormEvent) {
    e.preventDefault();
    try {
      const x = await req("/api/admin/codes/import", {
        method: "POST",
        body: JSON.stringify({ months, codes }),
      });
      setMessage(`新增 ${x.added} 张，重复 ${x.duplicates} 张`);
      setCodes("");
      await load();
    } catch (e) {
      setMessage((e as Error).message);
    }
  }
  return (
    <Card>
      <CardHeader>
        <CardTitle>卡密管理</CardTitle>
        <CardDescription>批量导入一个月或三个月卡密</CardDescription>
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
            <div className="mb-6 grid grid-cols-2 gap-3">
              <div className="stat">
                一个月卡密<strong>{counts.one_month || 0}</strong>
              </div>
              <div className="stat">
                三个月卡密<strong>{counts.three_month || 0}</strong>
              </div>
            </div>
            <form className="grid gap-5" onSubmit={imports}>
              <Field label="卡密类型">
                <select
                  className="h-10 rounded-md border bg-background px-3"
                  value={months}
                  onChange={(e) => setMonths(Number(e.target.value))}
                >
                  <option value={1}>一个月</option>
                  <option value={3}>三个月</option>
                </select>
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
              <Button
                type="button"
                variant="outline"
                onClick={async () => {
                  await req("/api/admin/logout", { method: "POST" });
                  setLogged(false);
                }}
              >
                <LogOut className="size-4" />
                退出登录
              </Button>
            </form>
          </>
        )}
        {message && <p className="mt-4 text-sm">{message}</p>}
      </CardContent>
    </Card>
  );
}
export default function App() {
  return (
    <BrowserRouter>
      <header>
        <Link className="font-semibold" to="/">
          {siteName}
        </Link>
        <Link className="text-sm text-muted-foreground" to="/admin">
          卡密管理
        </Link>
      </header>
      <main>
        <Routes>
          <Route path="/" element={<Redeem />} />
          <Route path="/admin" element={<Admin />} />
        </Routes>
      </main>
    </BrowserRouter>
  );
}
