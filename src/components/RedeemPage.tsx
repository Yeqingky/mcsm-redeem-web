import {
  type FormEvent,
  type KeyboardEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import { CheckCircle2, Clock3, LoaderCircle } from "lucide-react";
import {
  isUUIDCode,
  panelUrl,
  notify,
  requestJSON,
  uuidCodePattern,
} from "../lib/client";
import { CapWidget, type CapHandle } from "./CapWidget";
import { Button } from "./ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

type TaskResult = {
  username?: string;
  password?: string;
  instanceId: string;
  endTime: number;
};

type Task = {
  id: string;
  status: "queued" | "processing" | "success" | "failed";
  position?: number;
  waiting: number;
  result?: TaskResult;
  error?: string;
};

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

export function RedeemPage() {
  const [action, setAction] = useState<"provision" | "renew">("provision");
  const [submittedAction, setSubmittedAction] = useState<"provision" | "renew">(
    "provision",
  );
  const [code, setCode] = useState("");
  const [instanceId, setInstanceId] = useState("");
  const [capToken, setCapToken] = useState("");
  const [task, setTask] = useState<Task>();
  const [busy, setBusy] = useState(false);
  const cap = useRef<CapHandle>(null);

  useEffect(() => {
    if (!task?.id || !["queued", "processing"].includes(task.status)) return;
    let cancelled = false;
    let timer = 0;
    const poll = async () => {
      try {
        const next = await requestJSON<Task>(`/api/tasks/${task.id}`);
        if (cancelled) return;
        setTask(next);
        if (["queued", "processing"].includes(next.status)) {
          timer = window.setTimeout(() => void poll(), 1500);
        }
      } catch (error) {
        if (!cancelled) {
          const message = (error as Error).message;
          if (message === "任务不存在或已过期") {
            notify("error", "任务已过期，请重新兑换", {
              id: "task-poll-error",
            });
            setTask((prev) =>
              prev
                ? { ...prev, status: "failed", error: "任务已过期，请重新兑换" }
                : undefined,
            );
          } else {
            notify("error", "查询任务失败", {
              id: "task-poll-error",
              description: message,
            });
            timer = window.setTimeout(() => void poll(), 1500);
          }
        }
      }
    };
    timer = window.setTimeout(() => void poll(), 1500);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
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
  }, [submittedAction, task?.error, task?.status]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!isUUIDCode(code)) {
      notify("error", "卡密格式无效", { description: "卡密必须为 UUID 格式" });
      return;
    }
    setBusy(true);
    setSubmittedAction(action);
    try {
      const result = await requestJSON<Task>("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          code,
          instanceId: action === "renew" ? instanceId : "",
          capToken,
        }),
      });
      setTask(result);
    } catch (error) {
      notify("error", "提交失败", {
        description: (error as Error).message,
      });
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
      void copy(value);
    }
  }

  function changeAction(nextAction: "provision" | "renew") {
    if (nextAction !== action && task?.status === "success") {
      setTask(undefined);
    }
    setAction(nextAction);
  }

  const result = task?.result;
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
                    onChange={(event) => setInstanceId(event.target.value)}
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
                onChange={(event) => setCode(event.target.value)}
                autoComplete="off"
                minLength={36}
                maxLength={36}
                pattern={uuidCodePattern}
                placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                required
              />
            </Field>
            <CapWidget ref={cap} onSolve={setCapToken} />
            <Button disabled={busy || !capToken}>
              {busy && <LoaderCircle className="size-4 animate-spin" />}
              提交兑换
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
        {task?.status === "success" && result && (
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
                onClick={() => void copy(result.instanceId)}
                onKeyDown={(event) => copyOnKeyDown(event, result.instanceId)}
              >
                {result.instanceId}
              </code>
            </p>
            {submittedAction === "provision" && (
              <>
                {panelUrl && (
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
                )}
                <p className="result">
                  用户名
                  <code
                    role="button"
                    tabIndex={0}
                    title="点击复制用户名"
                    onClick={() => void copy(result.username || "")}
                    onKeyDown={(event) =>
                      copyOnKeyDown(event, result.username || "")
                    }
                  >
                    {result.username}
                  </code>
                </p>
                <p className="result">
                  密码
                  <code
                    role="button"
                    tabIndex={0}
                    title="点击复制密码"
                    onClick={() => void copy(result.password || "")}
                    onKeyDown={(event) =>
                      copyOnKeyDown(event, result.password || "")
                    }
                  >
                    {result.password}
                  </code>
                </p>
                <p className="rounded-md bg-amber-50 p-3 text-sm text-amber-900">
                  账号密码只会在当前页面显示一次，请尽快保存。
                </p>
              </>
            )}
            <p>
              <Clock3 className="mr-2 inline size-4" />
              到期时间：{new Date(result.endTime).toLocaleString()}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
