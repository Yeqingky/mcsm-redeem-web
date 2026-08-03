import { FormEvent, useRef, useState } from "react";
import {
  CircleHelp,
  Copy,
  LoaderCircle,
  PackagePlus,
  Pencil,
  Trash2,
  X,
} from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { ScrollArea, ScrollBar } from "../ui/scroll-area";
import { Textarea } from "../ui/textarea";
import {
  defaultSKU,
  type AdminRequest,
  type Notify,
  type SKU,
  type SKUInput,
} from "./types";

function formatTime(value: number) {
  return new Date(value).toLocaleString();
}

function packageName(alias: string, id: number) {
  return `${alias}(${id})`;
}

const instanceTypeOptions = [
  { value: "universal", label: "通用程序" },
  { value: "universal/web_shell", label: "Web Shell" },
  { value: "universal/mcdr", label: "MCDReforged" },
  { value: "minecraft/java", label: "Minecraft Java 版" },
  { value: "minecraft/java/bukkit", label: "Minecraft Bukkit" },
  { value: "minecraft/java/spigot", label: "Minecraft Spigot" },
  { value: "minecraft/java/paper", label: "Minecraft Paper" },
  { value: "minecraft/java/folia", label: "Minecraft Folia" },
  { value: "minecraft/java/leaves", label: "Minecraft Leaves" },
  { value: "minecraft/java/pufferfish", label: "Minecraft Pufferfish" },
  { value: "minecraft/java/fabric", label: "Minecraft Fabric" },
  { value: "minecraft/java/forge", label: "Minecraft Forge" },
  { value: "minecraft/java/neoforge", label: "Minecraft NeoForge" },
  { value: "minecraft/java/bungeecord", label: "Minecraft BungeeCord" },
  { value: "minecraft/java/velocity", label: "Minecraft Velocity" },
  { value: "minecraft/java/geyser", label: "Minecraft Geyser" },
  { value: "minecraft/java/sponge", label: "Minecraft Sponge" },
  { value: "minecraft/java/mohist", label: "Minecraft Mohist" },
  { value: "minecraft/java/purpur", label: "Minecraft Purpur" },
  { value: "minecraft/bedrock", label: "Minecraft 基岩版" },
  { value: "minecraft/bedrock/bds", label: "Minecraft BDS" },
  { value: "minecraft/bedrock/nukkit", label: "Minecraft Nukkit" },
  { value: "hytale", label: "Hytale" },
  { value: "steam/universal", label: "Steam 游戏服务端" },
  { value: "steam/terraria", label: "Terraria" },
] as const;

function HelpTip({ text }: { text: string }) {
  return (
    <span className="group relative inline-flex">
      <button
        type="button"
        className="cursor-pointer rounded-full text-muted-foreground transition-transform duration-100 outline-none hover:text-foreground active:scale-90 focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transition-none motion-reduce:active:scale-100"
        aria-label={text}
      >
        <CircleHelp className="size-3.5" />
      </button>
      <span
        role="tooltip"
        className="pointer-events-none absolute left-0 top-[calc(100%+0.45rem)] z-50 w-64 rounded-md bg-white px-3 py-2 text-xs font-normal leading-relaxed text-zinc-900 opacity-0 shadow-lg ring-1 ring-zinc-200 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100"
      >
        {text}
      </span>
    </span>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-2">
      <div className="flex items-center gap-1.5">
        <Label>{label}</Label>
        {hint && <HelpTip text={hint} />}
      </div>
      {children}
    </div>
  );
}

function TextField({
  label,
  value,
  onChange,
  required,
  hint,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  hint?: string;
  placeholder?: string;
}) {
  return (
    <Field label={label} hint={hint}>
      <Input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required={required}
        placeholder={placeholder}
      />
    </Field>
  );
}

function TextareaField({
  label,
  value,
  onChange,
  hint,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  hint?: string;
  placeholder?: string;
}) {
  return (
    <Field label={label} hint={hint}>
      <Textarea
        className="min-h-24 font-mono"
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
      />
    </Field>
  );
}

function NumberField({
  label,
  value,
  onChange,
  min,
  max,
  hint,
  placeholder,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  hint?: string;
  placeholder?: string;
}) {
  return (
    <Field label={label} hint={hint}>
      <Input
        type="number"
        step={1}
        min={min}
        max={max}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(Number(event.target.value))}
        required
      />
    </Field>
  );
}

function LinesField({
  label,
  value,
  onChange,
  hint,
  placeholder,
}: {
  label: string;
  value: string[];
  onChange: (value: string[]) => void;
  hint?: string;
  placeholder?: string;
}) {
  return (
    <Field label={label} hint={hint}>
      <Textarea
        className="min-h-24 font-mono"
        value={value.join("\n")}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value.split(/\r?\n/))}
      />
    </Field>
  );
}

function SelectField<T extends string | number>({
  label,
  value,
  onChange,
  options,
  hint,
}: {
  label: string;
  value: T;
  onChange: (value: T) => void;
  options: readonly { value: T; label: string }[];
  hint?: string;
}) {
  return (
    <Field label={label} hint={hint}>
      <select
        className="h-10 w-full rounded-md border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
        value={value}
        onChange={(event) => {
          const option = options.find(
            (item) => String(item.value) === event.target.value,
          );
          if (option) onChange(option.value);
        }}
      >
        {options.map((option) => (
          <option value={option.value} key={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </Field>
  );
}

function BoolField({
  label,
  checked,
  onChange,
  hint,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
  hint?: string;
}) {
  return (
    <Field label={label} hint={hint}>
      <label className="flex min-h-10 cursor-pointer items-center gap-3 rounded-md border px-3 text-sm">
        <input
          type="checkbox"
          className="size-4 accent-primary"
          checked={checked}
          onChange={(event) => onChange(event.target.checked)}
        />
        {checked ? "已开启" : "已关闭"}
      </label>
    </Field>
  );
}

function Section({
  title,
  children,
  open = false,
}: {
  title: string;
  children: React.ReactNode;
  open?: boolean;
}) {
  return (
    <details className="rounded-lg border" open={open}>
      <summary className="cursor-pointer select-none px-4 py-3 font-medium transition-[background-color,transform] duration-100 hover:bg-accent/50 active:translate-y-px active:bg-accent motion-reduce:transition-none motion-reduce:active:translate-y-0">
        {title}
      </summary>
      <div className="grid gap-4 border-t p-4 sm:grid-cols-2">{children}</div>
    </details>
  );
}

export function SkuManagement({
  request,
  notify,
  skus,
  reload,
}: {
  request: AdminRequest;
  notify: Notify;
  skus: SKU[];
  reload: () => Promise<void>;
}) {
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingSKU, setEditingSKU] = useState<number>();
  const [draft, setDraft] = useState<SKUInput>(() =>
    structuredClone(defaultSKU),
  );
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<number>();
  const [dockerImages, setDockerImages] = useState<string[]>([]);
  const [imageSearch, setImageSearch] = useState("");
  const [imagesLoading, setImagesLoading] = useState(false);
  const [imagesError, setImagesError] = useState("");
  const imageRequestRevision = useRef(0);

  async function loadDockerImages(currentImage: string) {
    const revision = ++imageRequestRevision.current;
    setImagesLoading(true);
    setImagesError("");
    try {
      const images = await request<string[]>("/api/admin/docker-images");
      if (revision !== imageRequestRevision.current) return;
      setDockerImages(images);
      if (currentImage && !images.includes(currentImage)) {
        setDraft((value) => ({
          ...value,
          docker: { ...value.docker, image: "" },
        }));
      }
    } catch (error) {
      if (revision !== imageRequestRevision.current) return;
      setDockerImages([]);
      setImagesError("读取节点镜像失败");
      notify("error", "读取 Docker 镜像失败", {
        description: (error as Error).message,
      });
    } finally {
      if (revision === imageRequestRevision.current) setImagesLoading(false);
    }
  }

  function resetDraft() {
    setDraft(structuredClone(defaultSKU));
  }

  function openCreate() {
    setEditingSKU(undefined);
    setImageSearch("");
    resetDraft();
    setEditorOpen(true);
    void loadDockerImages(defaultSKU.docker.image);
  }

  function openEdit(sku: SKU) {
    const { id, createdAt: _createdAt, ...input } = sku;
    setEditingSKU(id);
    setImageSearch("");
    setDraft(structuredClone(input));
    setEditorOpen(true);
    void loadDockerImages(input.docker.image);
  }

  function openCopy(sku: SKU) {
    const { id: _id, createdAt: _createdAt, ...input } = sku;
    setEditingSKU(undefined);
    setImageSearch("");
    setDraft(
      structuredClone({
        ...input,
        alias: `${input.alias} 副本`,
      }),
    );
    setEditorOpen(true);
    void loadDockerImages(input.docker.image);
  }

  function closeEditor() {
    imageRequestRevision.current += 1;
    setEditorOpen(false);
    setEditingSKU(undefined);
    setDockerImages([]);
    setImageSearch("");
    setImagesError("");
    setImagesLoading(false);
    resetDraft();
  }

  function cleanLines(items: string[]) {
    return items.map((item) => item.trim()).filter(Boolean);
  }

  function cleanedDraft(): SKUInput {
    return {
      ...draft,
      tag: cleanLines(draft.tag),
      actionCommandList: cleanLines(draft.actionCommandList),
      docker: {
        ...draft.docker,
        ports: cleanLines(draft.docker.ports),
        extraVolumes: cleanLines(draft.docker.extraVolumes),
        networkAliases: cleanLines(draft.docker.networkAliases),
        env: cleanLines(draft.docker.env),
        extraArgs: cleanLines(draft.docker.extraArgs),
      },
    };
  }

  async function saveSKU(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    try {
      const editing = editingSKU !== undefined;
      const sku = await request<SKU>(
        editing ? `/api/admin/skus/${editingSKU}` : "/api/admin/skus",
        {
          method: editing ? "PUT" : "POST",
          body: JSON.stringify(cleanedDraft()),
        },
      );
      notify("success", `套餐${editing ? "保存" : "创建"}成功`, {
        description: packageName(sku.alias, sku.id),
      });
      await reload();
      closeEditor();
    } catch (error) {
      notify("error", `${editingSKU === undefined ? "创建" : "保存"}套餐失败`, {
        description: (error as Error).message,
      });
    } finally {
      setSaving(false);
    }
  }

  async function deleteSKU(sku: SKU) {
    if (
      !window.confirm(
        `确认删除套餐「${packageName(sku.alias, sku.id)}」吗？已绑定的卡密和历史记录会继续保留。`,
      )
    ) {
      return;
    }
    setDeleting(sku.id);
    try {
      await request(`/api/admin/skus/${sku.id}`, { method: "DELETE" });
      notify("success", `套餐 ${packageName(sku.alias, sku.id)} 已删除`);
      await reload();
    } catch (error) {
      notify("error", "删除套餐失败", {
        description: (error as Error).message,
      });
    } finally {
      setDeleting(undefined);
    }
  }

  const normalizedImageSearch = imageSearch.trim().toLocaleLowerCase();
  const filteredDockerImages = dockerImages.filter((image) =>
    image.toLocaleLowerCase().includes(normalizedImageSearch),
  );
  const dockerImageReady =
    draft.processType !== "docker" ||
    (!imagesLoading &&
      !imagesError &&
      dockerImages.includes(draft.docker.image));

  return (
    <div className="flex h-full min-h-0 flex-col gap-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold">套餐管理</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            管理开通实例时使用的镜像、命令和资源规格
          </p>
        </div>
        <Button type="button" onClick={openCreate}>
          <PackagePlus className="size-4" />
          新建套餐
        </Button>
      </div>

      <ScrollArea className="min-h-48 flex-1 rounded-lg border">
        <table className="w-full min-w-[820px] border-collapse text-left text-sm">
          <thead className="sticky top-0 z-10 bg-muted">
            <tr>
              <th className="px-4 py-3 font-medium">套餐名</th>
              <th className="px-4 py-3 font-medium">运行方式</th>
              <th className="px-4 py-3 font-medium">镜像</th>
              <th className="px-4 py-3 font-medium">资源限制</th>
              <th className="px-4 py-3 font-medium">创建时间</th>
              <th className="w-28 px-4 py-3 text-right font-medium">操作</th>
            </tr>
          </thead>
          <tbody>
            {skus.length > 0 ? (
              skus.map((sku) => (
                <tr className="border-t hover:bg-muted/30" key={sku.id}>
                  <td className="px-4 py-3 font-medium">
                    {packageName(sku.alias, sku.id)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    {sku.processType === "docker" ? "Docker 容器" : "直接运行"}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">
                    {sku.docker.image || "—"}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                    CPU {sku.docker.cpuUsage}% · 内存 {sku.docker.memory} MB ·
                    存储 {sku.docker.maxSpace} GB
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                    {formatTime(sku.createdAt)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-1.5">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="px-2.5"
                        aria-label={`复制套餐 ${packageName(sku.alias, sku.id)}`}
                        disabled={deleting !== undefined}
                        onClick={() => openCopy(sku)}
                      >
                        <Copy className="size-4" />
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="px-2.5"
                        title="编辑套餐"
                        aria-label={`编辑套餐 ${packageName(sku.alias, sku.id)}`}
                        disabled={deleting !== undefined}
                        onClick={() => openEdit(sku)}
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="destructive"
                        className="px-2.5"
                        title="删除套餐"
                        aria-label={`删除套餐 ${packageName(sku.alias, sku.id)}`}
                        disabled={deleting !== undefined}
                        onClick={() => void deleteSKU(sku)}
                      >
                        {deleting === sku.id ? (
                          <LoaderCircle className="size-4 animate-spin" />
                        ) : (
                          <Trash2 className="size-4" />
                        )}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  className="h-80 text-center text-muted-foreground"
                  colSpan={6}
                >
                  暂无套餐，请先新建套餐
                </td>
              </tr>
            )}
          </tbody>
        </table>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>

      {editorOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-black/55 p-4">
          <form
            className="flex h-[calc(100vh-2rem)] w-full max-w-5xl flex-col rounded-xl border bg-card shadow-2xl"
            onSubmit={saveSKU}
          >
            <div className="flex items-start justify-between gap-4 border-b p-5 sm:p-6">
              <div>
                <h3 className="text-xl font-semibold">
                  {editingSKU === undefined
                    ? "新建套餐"
                    : `编辑套餐：${packageName(draft.alias, editingSKU)}`}
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  配置该套餐开通实例时使用的参数
                </p>
              </div>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                aria-label="关闭套餐编辑窗口"
                onClick={closeEditor}
              >
                <X className="size-5" />
              </Button>
            </div>
            <ScrollArea className="min-h-0 flex-1">
              <div className="grid gap-4 p-5 sm:p-6">
                <Section title="基础设置" open>
                  <TextField
                    label="套餐名"
                    value={draft.alias}
                    onChange={(alias) =>
                      setDraft((value) => ({ ...value, alias }))
                    }
                    placeholder="例如：免费套餐"
                    required
                  />
                  <SelectField
                    label="运行方式"
                    value={draft.processType}
                    options={[
                      { value: "docker", label: "Docker 容器" },
                      { value: "general", label: "直接运行" },
                    ]}
                    hint="Docker 容器使用镜像运行；直接运行会在 MCSManager 节点主机上执行启动命令。"
                    onChange={(processType) =>
                      setDraft((value) => ({ ...value, processType }))
                    }
                  />
                  <SelectField
                    label="实例类型"
                    value={draft.type}
                    options={instanceTypeOptions}
                    hint="用于 MCSManager 识别实例并选择状态查询协议，不会改变镜像中的服务端程序。"
                    onChange={(type) =>
                      setDraft((value) => ({ ...value, type }))
                    }
                  />
                </Section>

                <Section title="启动与文件" open>
                  <div className="sm:col-span-2">
                    <TextareaField
                      label="启动命令"
                      value={draft.startCommand}
                      placeholder="例如：./start.sh"
                      hint="Docker 套餐填写容器内执行的命令；留空时使用镜像默认启动命令。"
                      onChange={(startCommand) =>
                        setDraft((value) => ({ ...value, startCommand }))
                      }
                    />
                  </div>
                  <TextField
                    label="停止命令"
                    value={draft.stopCommand}
                    placeholder="例如：stop"
                    hint="关闭实例时发送给程序的命令，^C 表示 Ctrl+C。"
                    onChange={(stopCommand) =>
                      setDraft((value) => ({ ...value, stopCommand }))
                    }
                  />
                  <TextField
                    label="更新命令"
                    value={draft.updateCommand}
                    placeholder="不需要则留空"
                    onChange={(updateCommand) =>
                      setDraft((value) => ({ ...value, updateCommand }))
                    }
                  />
                  <SelectField
                    label="命令换行方式"
                    value={draft.crlf}
                    options={[
                      { value: 1, label: "Linux / macOS（LF）" },
                      { value: 2, label: "Windows（CRLF）" },
                    ]}
                    hint="如果在控制台发送命令后没有反应，可尝试切换此项。"
                    onChange={(crlf) =>
                      setDraft((value) => ({ ...value, crlf }))
                    }
                  />
                  <LinesField
                    label="实例标签"
                    value={draft.tag}
                    placeholder="每行一个标签"
                    onChange={(tag) => setDraft((value) => ({ ...value, tag }))}
                  />
                </Section>

                {draft.processType === "docker" && (
                  <Section title="Docker 容器" open>
                    <Field
                      label="镜像"
                      hint="只显示 MCSManager 节点中已经存在的 Docker 镜像。"
                    >
                      <Input
                        value={imageSearch}
                        placeholder="搜索镜像"
                        disabled={imagesLoading || Boolean(imagesError)}
                        onChange={(event) => setImageSearch(event.target.value)}
                      />
                      <select
                        className="h-10 w-full rounded-md border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                        value={
                          filteredDockerImages.includes(draft.docker.image)
                            ? draft.docker.image
                            : ""
                        }
                        disabled={
                          imagesLoading ||
                          Boolean(imagesError) ||
                          filteredDockerImages.length === 0
                        }
                        onChange={(event) => {
                          const image = event.target.value;
                          setDraft((value) => ({
                            ...value,
                            docker: { ...value.docker, image },
                          }));
                        }}
                        required
                      >
                        <option value="" disabled>
                          {imagesLoading
                            ? "正在读取节点镜像…"
                            : imagesError
                              ? imagesError
                              : dockerImages.length === 0
                                ? "节点暂无可用镜像"
                                : filteredDockerImages.length === 0
                                  ? "没有匹配的镜像"
                                  : "请选择 Docker 镜像"}
                        </option>
                        {filteredDockerImages.map((image) => (
                          <option value={image} key={image}>
                            {image}
                          </option>
                        ))}
                      </select>
                    </Field>
                    <TextField
                      label="容器工作目录"
                      value={draft.docker.workingDir}
                      placeholder="例如：/workspace"
                      hint="启动命令在容器内的这个目录中执行。"
                      onChange={(workingDir) =>
                        setDraft((value) => ({
                          ...value,
                          docker: { ...value.docker, workingDir },
                        }))
                      }
                    />
                    <BoolField
                      label="强制切换工作目录"
                      checked={draft.docker.changeWorkdir}
                      hint="开启后，MCSManager 会在启动容器时切换到上面填写的容器工作目录。"
                      onChange={(changeWorkdir) =>
                        setDraft((value) => ({
                          ...value,
                          docker: { ...value.docker, changeWorkdir },
                        }))
                      }
                    />
                    <TextField
                      label="Docker 网络"
                      value={draft.docker.networkMode}
                      placeholder="bridge"
                      hint="通常填写 bridge；也可以填写 MCSManager 节点中已经存在的自定义 Docker 网络名称。"
                      onChange={(networkMode) =>
                        setDraft((value) => ({
                          ...value,
                          docker: { ...value.docker, networkMode },
                        }))
                      }
                    />
                    <TextField
                      label="指定 CPU 核心"
                      value={draft.docker.cpusetCpus}
                      placeholder="例如：0,1；留空不限"
                      hint="限制容器只在指定核心上运行，多个核心用英文逗号分隔。"
                      onChange={(cpusetCpus) =>
                        setDraft((value) => ({
                          ...value,
                          docker: { ...value.docker, cpusetCpus },
                        }))
                      }
                    />
                    <NumberField
                      label="CPU 上限（%）"
                      value={draft.docker.cpuUsage}
                      min={0}
                      hint="按所有 CPU 核心合计计算，100% 约等于一个核心，0 表示不限制。"
                      onChange={(cpuUsage) =>
                        setDraft((value) => ({
                          ...value,
                          docker: { ...value.docker, cpuUsage },
                        }))
                      }
                    />
                    <NumberField
                      label="内存（MB）"
                      value={draft.docker.memory}
                      min={0}
                      hint="容器可使用的最大物理内存，0 表示不限制。"
                      onChange={(memory) =>
                        setDraft((value) => ({
                          ...value,
                          docker: { ...value.docker, memory },
                        }))
                      }
                    />
                    <NumberField
                      label="额外虚拟内存（MB）"
                      value={draft.docker.memorySwap}
                      min={0}
                      hint="在内存上限之外允许使用的额外虚拟内存，虚拟内存性能较低。"
                      onChange={(memorySwap) =>
                        setDraft((value) => ({
                          ...value,
                          docker: { ...value.docker, memorySwap },
                        }))
                      }
                    />
                    <NumberField
                      label="存储上限（GB）"
                      value={draft.docker.maxSpace}
                      min={0}
                      hint="MCSManager 定时检查实例工作目录大小，超过限制后停止实例；0 表示不限制。"
                      onChange={(maxSpace) =>
                        setDraft((value) => ({
                          ...value,
                          docker: { ...value.docker, maxSpace },
                        }))
                      }
                    />
                    <LinesField
                      label="端口映射"
                      value={draft.docker.ports}
                      placeholder={"每行一项，例如：\n25565:25565/tcp"}
                      hint="格式为 主机端口:容器端口/协议。可使用 {mcsm_port1}、{mcsm_port2} 等占位符让 MCSManager 自动分配端口。"
                      onChange={(ports) =>
                        setDraft((value) => ({
                          ...value,
                          docker: { ...value.docker, ports },
                        }))
                      }
                    />
                    <LinesField
                      label="目录挂载"
                      value={draft.docker.extraVolumes}
                      placeholder={"每行一项，例如：\n/data/config|/app/config"}
                      hint="格式为 主机路径|容器路径。MCSManager 会自动创建不存在的主机目录。"
                      onChange={(extraVolumes) =>
                        setDraft((value) => ({
                          ...value,
                          docker: { ...value.docker, extraVolumes },
                        }))
                      }
                    />
                    <LinesField
                      label="环境变量"
                      value={draft.docker.env}
                      placeholder={"每行一项，例如：\nTZ=Asia/Shanghai"}
                      hint="使用 KEY=VALUE 格式，每行一个环境变量。"
                      onChange={(env) =>
                        setDraft((value) => ({
                          ...value,
                          docker: { ...value.docker, env },
                        }))
                      }
                    />
                  </Section>
                )}

                <Section title="状态监控与自动运行">
                  <BoolField
                    label="控制台颜色"
                    checked={draft.terminalOption.haveColor}
                    hint="让网页控制台渲染输出内容中的颜色。"
                    onChange={(haveColor) =>
                      setDraft((value) => ({
                        ...value,
                        terminalOption: { ...value.terminalOption, haveColor },
                      }))
                    }
                  />
                  <BoolField
                    label="交互式终端"
                    checked={draft.terminalOption.pty}
                    hint="支持 Tab、Ctrl 等终端交互；如果程序启动异常可关闭。"
                    onChange={(pty) =>
                      setDraft((value) => ({
                        ...value,
                        terminalOption: { ...value.terminalOption, pty },
                      }))
                    }
                  />
                  <BoolField
                    label="自启动"
                    checked={draft.eventTask.autoStart}
                    hint="MCSManager 远程节点启动后，自动启动这个实例。"
                    onChange={(autoStart) =>
                      setDraft((value) => ({
                        ...value,
                        eventTask: { ...value.eventTask, autoStart },
                      }))
                    }
                  />
                  <BoolField
                    label="自动重启"
                    checked={draft.eventTask.autoRestart}
                    hint="实例并非由面板主动停止却退出时，自动重新启动。"
                    onChange={(autoRestart) =>
                      setDraft((value) => ({
                        ...value,
                        eventTask: { ...value.eventTask, autoRestart },
                      }))
                    }
                  />
                </Section>
              </div>
            </ScrollArea>
            <div className="flex justify-end gap-3 border-t p-5 sm:p-6">
              <Button type="button" variant="outline" onClick={closeEditor}>
                取消
              </Button>
              <Button disabled={saving || !dockerImageReady}>
                {saving && <LoaderCircle className="size-4 animate-spin" />}
                {editingSKU === undefined ? "创建套餐" : "保存修改"}
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
