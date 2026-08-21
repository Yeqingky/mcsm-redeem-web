import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  LoaderCircle,
  Pencil,
  Plus,
  RefreshCw,
  Server,
  Trash2,
  X,
} from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { ScrollArea, ScrollBar } from "../ui/scroll-area";
import type {
  AdminRequest,
  DaemonInfo,
  Notify,
  Panel,
} from "./types";

function formatTime(value: number) {
  return value ? new Date(value).toLocaleString() : "—";
}

type PanelDraft = {
  name: string;
  apiUrl: string;
  apiKey: string;
};

const emptyDraft: PanelDraft = { name: "", apiUrl: "", apiKey: "" };

export function NodeManagement({
  request,
  notify,
}: {
  request: AdminRequest;
  notify: Notify;
}) {
  const [panels, setPanels] = useState<Panel[]>([]);
  const [daemonsByPanel, setDaemonsByPanel] = useState<Record<number, DaemonInfo[]>>({});
  const [panelLoading, setPanelLoading] = useState(false);
  const [error, setError] = useState("");
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});
  const [daemonLoading, setDaemonLoading] = useState<Record<number, boolean>>({});
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<Panel | undefined>();
  const [draft, setDraft] = useState<PanelDraft>(emptyDraft);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<number>();
  const revision = useRef(0);

  const loadPanels = useCallback(async () => {
    const rev = ++revision.current;
    setPanelLoading(true);
    setError("");
    try {
      const list = await request<Panel[]>("/api/admin/panels");
      if (rev !== revision.current) return;
      setPanels(list ?? []);
    } catch (error) {
      if (rev === revision.current) {
        setError((error as Error).message);
        notify("error", "读取面板列表失败", {
          description: (error as Error).message,
        });
      }
    } finally {
      if (rev === revision.current) setPanelLoading(false);
    }
  }, [notify, request]);

  useEffect(() => {
    void loadPanels();
  }, [loadPanels]);

  useEffect(() => {
    if (drawerOpen) {
      setDraft(
        editing
          ? {
              name: editing.name,
              apiUrl: editing.apiUrl,
              apiKey: editing.apiKey,
            }
          : emptyDraft,
      );
    }
  }, [drawerOpen, editing]);

  async function loadDaemons(panel: Panel, force = false) {
    const wasExpanded = expanded[panel.id];
    setExpanded((value) => ({ ...value, [panel.id]: !wasExpanded }));
    if (wasExpanded && !force) return; // 收起
    if (daemonsByPanel[panel.id] && !force) return; // 已加载
    const rev = ++revision.current;
    setDaemonLoading((value) => ({ ...value, [panel.id]: true }));
    try {
      const daemons = await request<DaemonInfo[]>(
        `/api/admin/panels/${panel.id}/daemons`,
      );
      if (rev !== revision.current) return;
      setDaemonsByPanel((value) => ({ ...value, [panel.id]: daemons ?? [] }));
    } catch (error) {
      if (rev === revision.current) {
        notify("error", `读取「${panel.name}」节点失败`, {
          description: (error as Error).message,
        });
        setDaemonsByPanel((value) => ({ ...value, [panel.id]: [] }));
      }
    } finally {
      if (rev === revision.current)
        setDaemonLoading((value) => ({ ...value, [panel.id]: false }));
    }
  }

  function openCreate() {
    setEditing(undefined);
    setDrawerOpen(true);
  }
  function openEdit(panel: Panel) {
    setEditing(panel);
    setDrawerOpen(true);
  }

  async function save(event: FormEvent) {
    event.preventDefault();
    if (!draft.name.trim() || !draft.apiUrl.trim() || !draft.apiKey.trim()) {
      notify("error", "请填写面板名称、地址和 API Key");
      return;
    }
    setSaving(true);
    try {
      const isEdit = editing !== undefined;
      await request<Panel>(
        isEdit ? `/api/admin/panels/${editing!.id}` : "/api/admin/panels",
        {
          method: isEdit ? "PUT" : "POST",
          body: JSON.stringify({
            name: draft.name.trim(),
            apiUrl: draft.apiUrl.trim(),
            apiKey: draft.apiKey.trim(),
          }),
        },
      );
      notify("success", `面板${isEdit ? "保存" : "创建"}成功`);
      setDrawerOpen(false);
      void loadPanels();
    } catch (error) {
      notify("error", `面板${editing ? "保存" : "创建"}失败`, {
        description: (error as Error).message,
      });
    } finally {
      setSaving(false);
    }
  }

  async function remove(panel: Panel) {
    if (
      !window.confirm(
        `确认删除面板「${panel.name}」吗？引用该面板节点的套餐需改用其他节点，否则兑换会失败。`,
      )
    ) {
      return;
    }
    setDeleting(panel.id);
    try {
      await request(`/api/admin/panels/${panel.id}`, { method: "DELETE" });
      notify("success", `面板「${panel.name}」已删除`);
      void loadPanels();
    } catch (error) {
      notify("error", "删除面板失败", {
        description: (error as Error).message,
      });
    } finally {
      setDeleting(undefined);
    }
  }

  function daemonDisplay(d: DaemonInfo) {
    return d.remarks || `${d.ip}:${d.port}` || d.uuid;
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-5">
      <div className="flex flex-wrap items-start justify-between gap-4 pl-4">
        <div>
          <h2 className="text-2xl font-semibold">节点管理</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            管理系统对接的 MCSM 面板及可用节点；套餐可从中选择部署节点
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              void loadPanels();
              setDaemonsByPanel({});
            }}
          >
            <RefreshCw className="size-4" />
            刷新
          </Button>
          <Button type="button" onClick={openCreate}>
            <Plus className="size-4" />
            新建面板
          </Button>
        </div>
      </div>

      <ScrollArea className="min-h-48 flex-1 rounded-lg border">
        {panelLoading && panels.length === 0 ? (
          <div className="flex justify-center py-12">
            <LoaderCircle className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : panels.length === 0 ? (
          <div className="py-12 text-center text-sm text-muted-foreground">
            {error ? `读取失败：${error}` : "还没有面板，点击“新建面板”添加"}
          </div>
        ) : (
          <div className="divide-y">
            {panels.map((panel) => {
              const isExpanded = !!expanded[panel.id];
              const daemons = daemonsByPanel[panel.id];
              const loading = !!daemonLoading[panel.id];
              const availableCount =
                (daemons ?? []).filter((d) => d.available).length;
              return (
                <div key={panel.id}>
                  <div className="flex items-center gap-3 px-4 py-3 hover:bg-muted/30">
                    <button
                      type="button"
                      className="flex min-w-0 flex-1 items-center gap-3 text-left"
                      onClick={() => void loadDaemons(panel)}
                    >
                      <ChevronRight
                        className={`size-4 shrink-0 text-muted-foreground transition-transform ${
                          isExpanded ? "rotate-90" : ""
                        }`}
                      />
                      <Server className="size-4 shrink-0 text-muted-foreground" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">{panel.name}</p>
                        <p className="truncate font-mono text-xs text-muted-foreground">
                          {panel.apiUrl}
                        </p>
                      </div>
                      <span className="shrink-0 rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                        {loading
                          ? "加载中…"
                          : daemons
                            ? `${availableCount}/${daemons.length} 可用`
                            : "点击展开节点"}
                      </span>
                    </button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="px-2.5"
                      aria-label={`编辑面板 ${panel.name}`}
                      onClick={() => openEdit(panel)}
                    >
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="destructive"
                      className="px-2.5"
                      aria-label={`删除面板 ${panel.name}`}
                      disabled={deleting === panel.id}
                      onClick={() => void remove(panel)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                  {isExpanded && (
                    <div className="border-t bg-muted/20 px-6 py-2">
                      {loading ? (
                        <div className="flex justify-center py-3">
                          <LoaderCircle className="size-4 animate-spin text-muted-foreground" />
                        </div>
                      ) : daemons && daemons.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {daemons.map((d) => (
                            <span
                              key={d.uuid}
                              className="inline-flex items-center gap-2 rounded border bg-background px-2.5 py-1.5 text-xs"
                            >
                              <span
                                className={`size-2 rounded-full ${
                                  d.available ? "bg-emerald-500" : "bg-red-500"
                                }`}
                                title={d.available ? "可用" : "不可用"}
                              />
                              <span>{daemonDisplay(d)}</span>
                              <span className="font-mono text-muted-foreground">
                                {d.ip}:{d.port}
                              </span>
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="py-2 text-xs text-muted-foreground">
                          {error
                            ? "读取失败，请检查面板地址与 API Key"
                            : "该面板暂无可用节点"}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </ScrollArea>

      {drawerOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/55 sm:items-center sm:p-4">
          <div className="w-full max-w-lg rounded-t-xl border bg-card shadow-lg sm:rounded-xl">
            <div className="flex items-center justify-between border-b px-5 py-4 sm:px-6">
              <div>
                <h3 className="text-lg font-semibold">
                  {editing ? `编辑面板：${editing.name}` : "新建面板"}
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  配置 MCSManager Panel 的主控地址和管理员 API Key
                </p>
              </div>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                aria-label="关闭面板编辑窗口"
                onClick={() => setDrawerOpen(false)}
              >
                <X className="size-5" />
              </Button>
            </div>
            <form onSubmit={(event) => void save(event)} className="grid gap-4 p-5 sm:p-6">
              <div className="grid gap-2">
                <Label htmlFor="panel-name">面板名称</Label>
                <Input
                  id="panel-name"
                  value={draft.name}
                  placeholder="例如：我的主控"
                  onChange={(event) =>
                    setDraft((value) => ({ ...value, name: event.target.value }))
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="panel-url">面板地址</Label>
                <Input
                  id="panel-url"
                  value={draft.apiUrl}
                  placeholder="例如：http://127.0.0.1:23333"
                  onChange={(event) =>
                    setDraft((value) => ({
                      ...value,
                      apiUrl: event.target.value,
                    }))
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="panel-key">API Key</Label>
                <Input
                  id="panel-key"
                  type="password"
                  value={draft.apiKey}
                  placeholder="MCSManager 管理员 API Key"
                  onChange={(event) =>
                    setDraft((value) => ({
                      ...value,
                      apiKey: event.target.value,
                    }))
                  }
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => setDrawerOpen(false)}>
                  取消
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving && <LoaderCircle className="size-4 animate-spin" />}
                  {editing ? "保存" : "创建"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
