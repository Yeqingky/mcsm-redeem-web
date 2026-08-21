import { useState, useRef, useEffect } from "react";
import { Check, ChevronRight, Layers, X } from "lucide-react";
import { cn } from "../../lib/utils";

export type CascaderOption = {
  label: string;
  value: string;
  children?: CascaderOption[];
};

type CascaderProps = {
  options: CascaderOption[];
  value: string[]; // selected leaf values as "panelId:daemonId"
  onChange: (value: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
};

// 通过叶子 value 反查显示标签："panelLabel:daemonLabel"
function leafLabel(options: CascaderOption[], leaf: string) {
  for (const panel of options) {
    for (const child of panel.children ?? []) {
      if (child.value === leaf) return `${panel.label} · ${child.label}`;
    }
  }
  return leaf;
}

export function Cascader({
  options,
  value,
  onChange,
  placeholder = "请选择",
  disabled,
}: CascaderProps) {
  const [open, setOpen] = useState(false);
  const [hoveredPanel, setHoveredPanel] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const allLeaves = options.flatMap((p) => (p.children ?? []).map((c) => c.value));
  const isAllSelected = allLeaves.length > 0 && allLeaves.every((v) => value.includes(v));

  function toggleLeaf(leafValue: string) {
    if (value.includes(leafValue)) {
      onChange(value.filter((v) => v !== leafValue));
    } else {
      onChange([...value, leafValue]);
    }
  }

  function togglePanelLeaves(panel: CascaderOption) {
    const leaves = (panel.children ?? []).map((c) => c.value);
    const allSelected = leaves.length > 0 && leaves.every((v) => value.includes(v));
    if (allSelected) {
      onChange(value.filter((v) => !leaves.includes(v)));
    } else {
      const set = new Set(value);
      leaves.forEach((v) => set.add(v));
      onChange(Array.from(set));
    }
  }

  function toggleAll() {
    if (isAllSelected) onChange([]);
    else onChange([...allLeaves]);
  }

  const hoveredOption = options.find((p) => p.value === hoveredPanel) ?? null;
  // 悬浮「全部」时：按面板汇总所有节点为综合列表
  const allHover = hoveredPanel === "__all__";
  const allLeafOptions = options.flatMap((p) =>
    (p.children ?? []).map((c) => ({ label: `${p.label} · ${c.label}`, value: c.value })),
  );

  return (
    <div ref={containerRef} className="relative">
      {/* 触发器：选中的节点以 pill 形式内联显示在输入框内，默认「全部」用椭圆包裹 */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          setOpen((v) => !v);
          if (!open) setHoveredPanel(null);
        }}
        className={cn(
          "flex min-h-10 w-full flex-wrap items-center gap-1 rounded-md border bg-transparent px-2.5 py-1.5 text-left text-sm outline-none transition-colors hover:bg-accent/40 focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
          open && "ring-2 ring-ring",
        )}
      >
        <Layers className="size-4 shrink-0 text-muted-foreground" />
        {value.length === 0 && (
          <span className="text-muted-foreground">{placeholder}</span>
        )}
        {isAllSelected ? (
          <span className="inline-flex items-center rounded-full bg-primary px-2.5 py-0.5 text-xs font-medium text-primary-foreground">
            全部
          </span>
        ) : (
          value.map((v) => (
            <span
              key={v}
              className="inline-flex max-w-full items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs"
              title={leafLabel(options, v)}
            >
              <span className="truncate">{leafLabel(options, v)}</span>
              <button
                type="button"
                aria-label="移除"
                className="shrink-0 rounded-full hover:text-destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleLeaf(v);
                }}
              >
                <X className="size-3" />
              </button>
            </span>
          ))
        )}
      </button>

      {open && (
        <div className="absolute z-50 mt-1">
          <div
            className="relative"
            onMouseLeave={() => setHoveredPanel(null)}
          >
            {/* 面板列表（独立边框，右侧节点区是浮层，两列各自独立高度） */}
            <div className="max-h-[320px] w-[200px] overflow-auto rounded-md border bg-card shadow-md">
            {/* 透明缓冲桥：覆盖主级→子级之间的缝隙，鼠标穿过时不丢失悬浮 */}
            <div
              aria-hidden
              className="absolute bottom-0 left-[200px] top-0 w-[8px]"
            />
            <div
              className={cn(
                "flex cursor-pointer items-center justify-between px-3 py-2 text-sm hover:bg-accent",
                isAllSelected && "bg-accent",
              )}
              onMouseEnter={() => setHoveredPanel("__all__")}
              onClick={toggleAll}
            >
              <span className="flex items-center gap-2">
                <span
                  className={cn(
                    "flex size-4 items-center justify-center rounded border",
                    isAllSelected && "bg-primary text-primary-foreground",
                  )}
                >
                  {isAllSelected && <Check className="size-3" />}
                </span>
                全部
              </span>
            </div>
            {options.map((panel) => {
              const leaves = (panel.children ?? []).map((c) => c.value);
              const allPanelSelected =
                leaves.length > 0 && leaves.every((v) => value.includes(v));
              const someSelected = leaves.some((v) => value.includes(v));
              const isHovered = hoveredPanel === panel.value;
              return (
                <div
                  key={panel.value}
                  className={cn(
                    "flex cursor-pointer items-center gap-1 px-3 py-2 text-sm hover:bg-accent",
                    isHovered && "bg-accent",
                  )}
                  onClick={() => setHoveredPanel(panel.value)}
                  onMouseEnter={() => setHoveredPanel(panel.value)}
                >
                  <span
                    role="button"
                    aria-label={`全选${panel.label}`}
                    className={cn(
                      "flex size-4 shrink-0 items-center justify-center rounded border",
                      allPanelSelected && "bg-primary text-primary-foreground",
                      someSelected && !allPanelSelected && "bg-primary/50",
                    )}
                    onClick={(e) => {
                      e.stopPropagation();
                      togglePanelLeaves(panel);
                    }}
                  >
                    {allPanelSelected && <Check className="size-3" />}
                  </span>
                  <span className="min-w-0 flex-1 truncate">{panel.label}</span>
                  <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                </div>
              );
            })}
          </div>
          {/* 节点列表：独立浮层定位在面板列表右侧，不与左侧对齐、不撑开左侧高度 */}
          {allHover ? (
            allLeafOptions.length > 0 ? (
              <div className="absolute left-[204px] top-0 z-10 max-h-[320px] w-[240px] overflow-auto rounded-md border bg-card shadow-md">
                <div className="sticky top-0 bg-card px-3 py-2 text-xs font-medium text-muted-foreground">
                  全部节点
                </div>
                {allLeafOptions.map((daemon) => {
                  const checked = value.includes(daemon.value);
                  return (
                    <div
                      key={daemon.value}
                      className="flex cursor-pointer items-center gap-2 px-3 py-2 text-sm hover:bg-accent"
                      onClick={() => toggleLeaf(daemon.value)}
                    >
                      <span
                        className={cn(
                          "flex size-4 items-center justify-center rounded border",
                          checked && "bg-primary text-primary-foreground",
                        )}
                      >
                        {checked && <Check className="size-3" />}
                      </span>
                      <span className="truncate" title={daemon.label}>
                        {daemon.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="absolute left-[204px] top-0 z-10 w-[240px] rounded-md border bg-card p-4 text-sm text-muted-foreground shadow-md">
                暂无可用节点
              </div>
            )
          ) : hoveredOption &&
            (hoveredOption.children && hoveredOption.children.length > 0 ? (
              <div className="absolute left-[204px] top-0 z-10 max-h-[320px] w-[240px] overflow-auto rounded-md border bg-card shadow-md">
                <div className="sticky top-0 bg-card px-3 py-2 text-xs font-medium text-muted-foreground">
                  {hoveredOption.label}
                </div>
                {hoveredOption.children.map((daemon) => {
                  const checked = value.includes(daemon.value);
                  return (
                    <div
                      key={daemon.value}
                      className="flex cursor-pointer items-center gap-2 px-3 py-2 text-sm hover:bg-accent"
                      onClick={() => toggleLeaf(daemon.value)}
                    >
                      <span
                        className={cn(
                          "flex size-4 items-center justify-center rounded border",
                          checked && "bg-primary text-primary-foreground",
                        )}
                      >
                        {checked && <Check className="size-3" />}
                      </span>
                      <span className="truncate" title={daemon.label}>
                        {daemon.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="absolute left-[204px] top-0 z-10 w-[240px] rounded-md border bg-card p-4 text-sm text-muted-foreground shadow-md">
                该面板暂无可用节点
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
