import { FormEvent, useEffect, useRef, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  Ban,
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
  Copy,
  Eye,
  LoaderCircle,
  Plus,
  Power,
  RefreshCw,
  Search,
  Upload,
  X,
} from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { ScrollArea, ScrollBar } from "../ui/scroll-area";
import { Select } from "../ui/select";
import { Textarea } from "../ui/textarea";
import { isUUIDCode } from "../../lib/client";
import { MultiSelect } from "./MultiSelect";
import {
  codeStateLabels,
  type AdminRequest,
  type CodeList,
  type CodeRecord,
  type CodeState,
  type CodeStatus,
  type ImportResult,
  type Notify,
  type SKU,
} from "./types";

const pageSizeOptions = [10, 25, 50, 100, 500] as const;
const pageSizeStorageKey = "mcsm-redeem-admin-page-size";
const maxRedeemDays = 106751;
const maxGenerateCount = 10000;
const maxImportCount = 10000;

function initialPageSize() {
  try {
    const saved = Number(window.localStorage.getItem(pageSizeStorageKey));
    return pageSizeOptions.some((size) => size === saved) ? saved : 10;
  } catch {
    return 10;
  }
}

function formatTime(value: number | null | undefined) {
  return value ? new Date(value).toLocaleString() : "—";
}

function createUUID() {
  if (typeof crypto.randomUUID === "function") return crypto.randomUUID();
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (value) => value.toString(16).padStart(2, "0"));
  return `${hex.slice(0, 4).join("")}-${hex.slice(4, 6).join("")}-${hex.slice(6, 8).join("")}-${hex.slice(8, 10).join("")}-${hex.slice(10).join("")}`;
}

function SelectionCheckbox({
  checked,
  indeterminate = false,
  disabled = false,
  label,
  onChange,
}: {
  checked: boolean;
  indeterminate?: boolean;
  disabled?: boolean;
  label: string;
  onChange: (checked: boolean) => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (input.current) input.current.indeterminate = indeterminate;
  }, [indeterminate]);
  return (
    <input
      ref={input}
      className="size-4 cursor-pointer accent-primary disabled:cursor-not-allowed disabled:opacity-50"
      type="checkbox"
      checked={checked}
      disabled={disabled}
      aria-label={label}
      title={label}
      onChange={(event) => onChange(event.target.checked)}
    />
  );
}

function StatusBadge({ status }: { status: CodeState }) {
  const style = {
    0: "bg-emerald-100 text-emerald-800",
    1: "bg-zinc-200 text-zinc-700",
    2: "bg-red-100 text-red-800",
    3: "bg-amber-100 text-amber-800",
  }[status];
  return (
    <span
      className={`whitespace-nowrap rounded-full px-2 py-1 text-xs ${style}`}
    >
      {codeStateLabels[status]}
    </span>
  );
}

function SortHeader({
  label,
  active,
  direction,
  onClick,
}: {
  label: string;
  active: boolean;
  direction: "asc" | "desc";
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className="inline-flex items-center gap-1 transition-opacity duration-100 hover:opacity-70 active:scale-[0.97] active:opacity-50 motion-reduce:transition-none motion-reduce:active:scale-100"
      title={`按${label}排序`}
      aria-label={`按${label}排序，当前${active ? (direction === "asc" ? "升序" : "降序") : "未启用"}`}
      onClick={onClick}
    >
      {label}
      {active ? (
        direction === "asc" ? (
          <ArrowUp className="size-3.5" />
        ) : (
          <ArrowDown className="size-3.5" />
        )
      ) : (
        <ChevronsUpDown className="size-3.5 opacity-50" />
      )}
    </button>
  );
}

export function CardManagement({
  request,
  notify,
  skus,
}: {
  request: AdminRequest;
  notify: Notify;
  skus: SKU[];
}) {
  const [states, setStates] = useState<CodeState[]>([]);
  const [skuIDs, setSkuIDs] = useState<number[]>([]);
  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [items, setItems] = useState<CodeRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [sort, setSort] = useState<"createdAt" | "usedAt">("createdAt");
  const [order, setOrder] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [changing, setChanging] = useState<Set<string>>(new Set());
  const [refreshRevision, setRefreshRevision] = useState(0);
  const [generateOpen, setGenerateOpen] = useState(false);
  const [generateCount, setGenerateCount] = useState(10);
  const [generatedCodes, setGeneratedCodes] = useState<string[]>([]);
  const [importOpen, setImportOpen] = useState(false);
  const [importSkuID, setImportSkuID] = useState(0);
  const [days, setDays] = useState(30);
  const [codes, setCodes] = useState("");
  const [importing, setImporting] = useState(false);
  const [detail, setDetail] = useState<CodeStatus>();
  const [detailLoading, setDetailLoading] = useState(false);
  const [refreshSpin, setRefreshSpin] = useState(0);
  const requestRevision = useRef(0);

  useEffect(() => {
    if (!importSkuID && skus.length > 0) setImportSkuID(skus[0].id);
  }, [importSkuID, skus]);

  useEffect(() => {
    try {
      window.localStorage.setItem(pageSizeStorageKey, String(pageSize));
    } catch {
      // 浏览器禁止本地存储时继续使用当前会话中的选择。
    }
  }, [pageSize]);

  useEffect(() => {
    const revision = ++requestRevision.current;
    setLoading(true);
    const params = new URLSearchParams({
      limit: String(pageSize),
      offset: String((page - 1) * pageSize),
    });
    if (states.length > 0) params.set("status", states.join(","));
    if (skuIDs.length > 0) params.set("skuId", skuIDs.join(","));
    if (appliedSearch) params.set("query", appliedSearch);
    if (sort !== "createdAt") params.set("sort", sort);
    if (order !== "desc") params.set("order", order);
    void (async () => {
      try {
        const result = await request<CodeList>(`/api/admin/codes?${params}`);
        if (revision !== requestRevision.current) return;
        setItems(result.items);
        setTotal(result.total);
        setLoaded(true);
        setSelected(new Set());
      } catch (error) {
        if (revision === requestRevision.current) {
          notify("error", "读取卡密列表失败", {
            description: (error as Error).message,
          });
        }
      } finally {
        if (revision === requestRevision.current) setLoading(false);
      }
    })();
  }, [
    appliedSearch,
    notify,
    order,
    page,
    pageSize,
    refreshRevision,
    request,
    skuIDs,
    sort,
    states,
  ]);

  function updateStates(value: CodeState[]) {
    setPage(1);
    setStates(value);
  }

  function updateSKUs(value: number[]) {
    setPage(1);
    setSkuIDs(value);
  }

  function submitSearch(event: FormEvent) {
    event.preventDefault();
    setPage(1);
    setAppliedSearch(search.trim());
  }

  function updateSort(field: "createdAt" | "usedAt") {
    setPage(1);
    if (sort === field) {
      setOrder((value) => (value === "asc" ? "desc" : "asc"));
    } else {
      setSort(field);
      setOrder("desc");
    }
  }

  const pageItems = items;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const currentCodes = pageItems.map((item) => item.code);

  function selectCode(code: string, checked: boolean) {
    setSelected((current) => {
      const next = new Set(current);
      if (checked) next.add(code);
      else next.delete(code);
      return next;
    });
  }

  const allSelected =
    currentCodes.length > 0 && currentCodes.every((code) => selected.has(code));
  const someSelected = currentCodes.some((code) => selected.has(code));
  const selectedRows = pageItems.filter((item) => selected.has(item.code));
  const canDisable =
    selectedRows.length > 0 && selectedRows.every((item) => item.status === 0);
  const canEnable =
    selectedRows.length > 0 && selectedRows.every((item) => item.status === 2);

  async function changeCodes(items: CodeRecord[], target: 0 | 2) {
    if (items.length === 0) return;
    const action = target === 2 ? "禁用" : "启用";
    if (!window.confirm(`确认${action}所选 ${items.length} 张卡密吗？`)) return;
    const selectedCodes = items.map((item) => item.code);
    setChanging(new Set(selectedCodes));
    try {
      const result = await request<{ updated: number }>(
        `/api/admin/codes/${target === 2 ? "disable" : "enable"}`,
        {
          method: "POST",
          body: JSON.stringify({ codes: selectedCodes }),
        },
      );
      notify("success", `已${action} ${result.updated} 张卡密`);
      setPage(1);
      setRefreshRevision((value) => value + 1);
    } catch (error) {
      notify("error", `${action}卡密失败`, {
        description: (error as Error).message,
      });
    } finally {
      setChanging(new Set());
    }
  }

  async function copyValue(value: string, label: string) {
    try {
      await navigator.clipboard.writeText(value);
      notify("success", `${label}已复制`);
    } catch {
      notify("error", "复制失败，请手动复制");
    }
  }

  function generateCodes(event: FormEvent) {
    event.preventDefault();
    if (
      !Number.isInteger(generateCount) ||
      generateCount < 1 ||
      generateCount > maxGenerateCount
    ) {
      notify("error", "生成数量无效", {
        description: `每次可生成 1 到 ${maxGenerateCount} 张卡密`,
      });
      return;
    }
    const next = new Set<string>();
    while (next.size < generateCount) next.add(createUUID());
    setGeneratedCodes(Array.from(next));
    notify("success", `已生成 ${next.size} 张卡密`);
  }

  async function viewCode(code: string) {
    setDetailLoading(true);
    try {
      const result = await request<CodeStatus>("/api/admin/codes/status", {
        method: "POST",
        body: JSON.stringify({ code }),
      });
      setDetail(result);
    } catch (error) {
      notify("error", "查询卡密失败", {
        description: (error as Error).message,
      });
    } finally {
      setDetailLoading(false);
    }
  }

  async function importCodes(event: FormEvent) {
    event.preventDefault();
    const inputCodes = codes
      .split(/\r?\n/)
      .map((code) => code.trim())
      .filter(Boolean);
    if (inputCodes.length === 0) {
      notify("error", "卡密格式无效", {
        description: "请输入至少一张 UUID 格式的卡密",
      });
      return;
    }
    if (inputCodes.length > maxImportCount) {
      notify("error", "导入数量过多", {
        description: `单次最多导入 ${maxImportCount} 张卡密，当前 ${inputCodes.length} 张`,
      });
      return;
    }
    const invalidCodes = inputCodes.filter((code) => !isUUIDCode(code));
    if (invalidCodes.length > 0) {
      console.error("[卡密导入] UUID 格式无效", invalidCodes);
      notify("error", "卡密格式无效", {
        description: `有 ${invalidCodes.length} 张卡密不是 UUID 格式，详情已输出到浏览器控制台`,
      });
      return;
    }
    setImporting(true);
    try {
      const result = await request<ImportResult>("/api/admin/codes/import", {
        method: "POST",
        body: JSON.stringify({ skuId: importSkuID, days, codes }),
      });
      console.info("[卡密导入] 接口返回", result);
      if (result.duplicateCodes.length > 0) {
        console.warn("[卡密导入] 重复卡密", result.duplicateCodes);
      }
      if (result.failedCodes.length > 0) {
        console.error("[卡密导入] 失败卡密", result.failedCodes);
      }
      notify("success", "批量导入完成", {
        description: `新增 ${result.added} 张，重复 ${result.duplicates} 张，失败 ${result.failed} 张`,
      });
      setCodes("");
      setImportOpen(false);
      setPage(1);
      setRefreshRevision((value) => value + 1);
    } catch (error) {
      notify("error", "批量导入失败", {
        description: (error as Error).message,
      });
    } finally {
      setImporting(false);
    }
  }

  return (
    <div className="flex min-h-0 flex-col gap-5 md:h-full">
      <div>
        <h2 className="text-2xl font-semibold">卡密管理</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          筛选、查看、导入以及批量启用或禁用卡密
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2 md:flex md:flex-wrap md:items-center md:gap-2">
        <Button type="button" onClick={() => setGenerateOpen(true)}>
          <Plus className="size-4" />
          生成卡密
        </Button>
        <Button
          type="button"
          onClick={() => setImportOpen(true)}
          disabled={skus.length === 0}
        >
          <Upload className="size-4" />
          导入卡密
        </Button>
        <Button
          type="button"
          className="md:ml-auto"
          variant="destructive"
          disabled={!canDisable || changing.size > 0}
          onClick={() => void changeCodes(selectedRows, 2)}
        >
          <Ban className="size-4" />
          禁用所选
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={!canEnable || changing.size > 0}
          onClick={() => void changeCodes(selectedRows, 0)}
        >
          <Power className="size-4" />
          启用所选
        </Button>
      </div>

      {skus.length === 0 && (
        <p className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
          请先在左侧进入套餐管理并创建套餐，之后才能导入卡密。
        </p>
      )}

      <div className="flex flex-wrap gap-2 rounded-lg border bg-muted/35 p-3">
        <MultiSelect
          label="状态"
          options={([0, 1, 2, 3] as CodeState[]).map((status) => ({
            value: status,
            label: codeStateLabels[status],
          }))}
          value={states}
          onChange={updateStates}
        />
        <MultiSelect
          label="套餐"
          options={skus.map((sku) => ({
            value: sku.id,
            label: `${sku.alias}(${sku.id})`,
          }))}
          value={skuIDs}
          onChange={updateSKUs}
        />
        <form
          className="flex w-full min-w-0 flex-1 basis-full gap-2 md:w-auto md:basis-auto md:min-w-60"
          onSubmit={submitSearch}
        >
          <Input
            className="min-w-0 flex-1"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="搜索卡密或 IP"
            autoComplete="off"
          />
          <Button type="submit" variant="outline" aria-label="搜索卡密">
            <Search className="size-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="refresh-button"
            title="刷新列表"
            aria-label="刷新卡密列表"
            onClick={() => {
              setRefreshSpin((value) => value + 1);
              setRefreshRevision((value) => value + 1);
            }}
          >
            <RefreshCw
              key={refreshSpin}
              className={`size-4 ${refreshSpin > 0 ? "refresh-spin" : ""}`}
              onAnimationEnd={() => setRefreshSpin(0)}
            />
          </Button>
        </form>
      </div>

      <ScrollArea className="min-h-48 flex-none rounded-lg border md:flex-1">
        <table className="w-full min-w-[1080px] border-collapse text-left text-sm">
          <thead className="bg-muted">
            <tr>
              <th className="sticky top-0 z-20 w-12 bg-muted px-4 py-3">
                <SelectionCheckbox
                  checked={allSelected}
                  indeterminate={someSelected && !allSelected}
                  disabled={changing.size > 0}
                  label="全选当前页卡密"
                  onChange={(checked) =>
                    setSelected(checked ? new Set(currentCodes) : new Set())
                  }
                />
              </th>
              <th className="sticky top-0 z-20 bg-muted px-4 py-3 font-medium">
                卡密
              </th>
              <th className="sticky top-0 z-20 whitespace-nowrap bg-muted px-4 py-3 font-medium">
                套餐
              </th>
              <th className="sticky top-0 z-20 whitespace-nowrap bg-muted px-4 py-3 font-medium">
                天数
              </th>
              <th className="sticky top-0 z-20 whitespace-nowrap bg-muted px-4 py-3 font-medium">
                状态
              </th>
              <th className="sticky top-0 z-20 whitespace-nowrap bg-muted px-4 py-3 font-medium">
                用户名
              </th>
              <th className="sticky top-0 z-20 whitespace-nowrap bg-muted px-4 py-3 font-medium">
                <SortHeader
                  label="创建时间"
                  active={sort === "createdAt"}
                  direction={order}
                  onClick={() => updateSort("createdAt")}
                />
              </th>
              <th className="sticky top-0 z-20 whitespace-nowrap bg-muted px-4 py-3 font-medium">
                <SortHeader
                  label="使用时间"
                  active={sort === "usedAt"}
                  direction={order}
                  onClick={() => updateSort("usedAt")}
                />
              </th>
              <th className="sticky top-0 z-20 w-36 bg-muted px-4 py-3 text-right font-medium">
                操作
              </th>
            </tr>
          </thead>
          <tbody>
            {!loaded ? (
              <tr>
                <td className="h-80 text-center" colSpan={9}>
                  <LoaderCircle className="mr-2 inline size-4 animate-spin" />
                  正在读取卡密
                </td>
              </tr>
            ) : pageItems.length ? (
              pageItems.map((item) => (
                <tr
                  className={`cursor-pointer border-t transition-colors ${
                    selected.has(item.code)
                      ? "bg-primary/10 hover:bg-primary/15"
                      : "hover:bg-muted/30"
                  }`}
                  key={item.code}
                  aria-selected={selected.has(item.code)}
                  onClick={(event) => {
                    if (changing.size > 0) return;
                    const target = event.target as HTMLElement;
                    if (
                      target.closest(
                        'input, button, a, [data-row-selection="ignore"]',
                      )
                    ) {
                      return;
                    }
                    selectCode(item.code, !selected.has(item.code));
                  }}
                >
                  <td className="px-4 py-3">
                    <SelectionCheckbox
                      checked={selected.has(item.code)}
                      disabled={changing.size > 0}
                      label={`选择卡密 ${item.code}`}
                      onChange={(checked) => selectCode(item.code, checked)}
                    />
                  </td>
                  <td className="max-w-72 px-4 py-3">
                    <button
                      type="button"
                      className="cursor-copy break-all text-left transition-opacity hover:opacity-70 active:opacity-50"
                      aria-label={`复制卡密 ${item.code}`}
                      onClick={() => void copyValue(item.code, "卡密")}
                    >
                      <code>{item.code}</code>
                    </button>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <span className="font-medium">
                      {item.skuAlias}({item.skuId})
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    {item.days} 天
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={item.status} />
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    {item.username ? (
                      <button
                        type="button"
                        className="cursor-copy transition-opacity hover:opacity-70 active:opacity-50"
                        aria-label={`复制用户名 ${item.username}`}
                        onClick={() =>
                          void copyValue(item.username || "", "用户名")
                        }
                      >
                        {item.username}
                      </button>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                    {formatTime(item.createdAt)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                    {formatTime(item.usedAt)}
                  </td>
                  <td className="px-4 py-3" data-row-selection="ignore">
                    <div className="flex justify-end gap-1.5">
                      {item.status === 0 && (
                        <Button
                          type="button"
                          size="sm"
                          variant="destructive"
                          className="px-2.5"
                          aria-label={`禁用卡密 ${item.code}`}
                          title="禁用卡密"
                          disabled={changing.size > 0}
                          onClick={() => void changeCodes([item], 2)}
                        >
                          {changing.has(item.code) ? (
                            <LoaderCircle className="size-4 animate-spin" />
                          ) : (
                            <Ban className="size-4" />
                          )}
                        </Button>
                      )}
                      {item.status === 2 && (
                        <Button
                          type="button"
                          size="sm"
                          className="px-2.5"
                          aria-label={`启用卡密 ${item.code}`}
                          title="启用卡密"
                          disabled={changing.size > 0}
                          onClick={() => void changeCodes([item], 0)}
                        >
                          {changing.has(item.code) ? (
                            <LoaderCircle className="size-4 animate-spin" />
                          ) : (
                            <Power className="size-4" />
                          )}
                        </Button>
                      )}
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="px-2.5"
                        aria-label={`查看卡密 ${item.code}`}
                        title="查看详情"
                        disabled={detailLoading}
                        onClick={() => void viewCode(item.code)}
                      >
                        <Eye className="size-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  className="h-80 text-center text-muted-foreground"
                  colSpan={9}
                >
                  暂无符合条件的卡密
                </td>
              </tr>
            )}
          </tbody>
        </table>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>

      <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
        <div className="flex flex-wrap items-center gap-3">
          <span>
            共 {total} 张，第 {page} / {pageCount} 页
          </span>
          <label className="flex items-center gap-2">
            每页
            <Select
              className="w-20"
              value={pageSize}
              options={pageSizeOptions.map((size) => ({
                value: size,
                label: String(size),
              }))}
              ariaLabel="每页显示卡密数量"
              onChange={(size) => {
                setPageSize(size);
                setPage(1);
              }}
            />
            张
          </label>
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={loading || page <= 1}
            onClick={() => setPage((value) => value - 1)}
          >
            <ChevronLeft className="size-4" />
            上一页
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={loading || page >= pageCount}
            onClick={() => setPage((value) => value + 1)}
          >
            下一页
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>

      {generateOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-black/55 p-4">
          <form
            className="w-full max-w-xl rounded-xl border bg-card p-6 shadow-2xl"
            onSubmit={generateCodes}
          >
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h3 className="text-xl font-semibold">生成卡密</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  卡密只在当前浏览器生成，复制后请使用“导入卡密”入库
                </p>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="px-2.5"
                  aria-label="复制全部已生成卡密"
                  title="复制全部"
                  disabled={generatedCodes.length === 0}
                  onClick={() =>
                    void copyValue(generatedCodes.join("\n"), "全部卡密")
                  }
                >
                  <Copy className="size-4" />
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  aria-label="关闭生成卡密窗口"
                  onClick={() => setGenerateOpen(false)}
                >
                  <X className="size-5" />
                </Button>
              </div>
            </div>
            <div className="grid gap-5">
              <div className="grid gap-2">
                <Label htmlFor="generate-count">生成数量</Label>
                <Input
                  id="generate-count"
                  type="number"
                  min={1}
                  max={maxGenerateCount}
                  step={1}
                  value={generateCount}
                  onChange={(event) =>
                    setGenerateCount(Number(event.target.value))
                  }
                  required
                />
              </div>
              <Button>
                <Plus className="size-4" />
                生成
              </Button>
              <div className="grid gap-2">
                <div className="flex items-center justify-between gap-3">
                  <Label htmlFor="generated-codes">生成结果</Label>
                  <span className="text-xs text-muted-foreground">
                    {generatedCodes.length} 张
                  </span>
                </div>
                <Textarea
                  id="generated-codes"
                  className="h-72 resize-none font-mono"
                  value={generatedCodes.join("\n")}
                  placeholder="输入数量后点击生成"
                  readOnly
                />
              </div>
            </div>
          </form>
        </div>
      )}

      {importOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-black/55 p-4">
          <form
            className="w-full max-w-xl rounded-xl border bg-card p-6 shadow-2xl"
            onSubmit={importCodes}
          >
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h3 className="text-xl font-semibold">导入卡密</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  卡密有效天数独立设置，套餐只决定实例规格
                </p>
              </div>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                aria-label="关闭导入窗口"
                onClick={() => setImportOpen(false)}
              >
                <X className="size-5" />
              </Button>
            </div>
            <div className="grid gap-5">
              <div className="grid gap-2">
                <Label htmlFor="import-sku">套餐</Label>
                <Select
                  id="import-sku"
                  value={importSkuID}
                  options={skus.map((sku) => ({
                    value: sku.id,
                    label: `${sku.alias}(${sku.id})`,
                  }))}
                  placeholder="选择套餐"
                  onChange={(skuID) => setImportSkuID(skuID)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="import-days">有效天数</Label>
                <Input
                  id="import-days"
                  type="number"
                  min={1}
                  max={maxRedeemDays}
                  step={1}
                  value={days}
                  onChange={(event) => setDays(Number(event.target.value))}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="import-codes">每行一张卡密</Label>
                <Textarea
                  id="import-codes"
                  rows={12}
                  value={codes}
                  onChange={(event) => setCodes(event.target.value)}
                  required
                />
              </div>
              <Button disabled={importing || !importSkuID}>
                {importing && <LoaderCircle className="size-4 animate-spin" />}
                开始导入
              </Button>
            </div>
          </form>
        </div>
      )}

      {detail && (
        <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-black/55 p-4">
          <div className="w-full max-w-lg rounded-xl border bg-card p-6 shadow-2xl">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h3 className="text-xl font-semibold">卡密详情</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {detail.skuAlias}({detail.skuId})
                </p>
              </div>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                aria-label="关闭详情"
                onClick={() => setDetail(undefined)}
              >
                <X className="size-5" />
              </Button>
            </div>
            <div className="grid gap-3 rounded-lg border p-4 text-sm">
              <div className="flex items-start justify-between gap-4">
                <button
                  type="button"
                  className="cursor-copy break-all text-left transition-opacity hover:opacity-70 active:opacity-50"
                  aria-label={`复制卡密 ${detail.code}`}
                  onClick={() => void copyValue(detail.code, "卡密")}
                >
                  <code>{detail.code}</code>
                </button>
                <StatusBadge status={detail.status} />
              </div>
              <p>有效天数：{detail.days} 天</p>
              <p>创建时间：{formatTime(detail.createdAt)}</p>
              <p>使用时间：{formatTime(detail.usedAt)}</p>
              <p>IP 地址：{detail.ipAddress || "—"}</p>
              <p>
                用户名：
                {detail.username ? (
                  <button
                    type="button"
                    className="cursor-copy transition-opacity hover:opacity-70 active:opacity-50"
                    aria-label={`复制用户名 ${detail.username}`}
                    onClick={() =>
                      void copyValue(detail.username || "", "用户名")
                    }
                  >
                    {detail.username}
                  </button>
                ) : (
                  "—"
                )}
              </p>
              <p>
                密码：<code>{detail.password || "—"}</code>
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
