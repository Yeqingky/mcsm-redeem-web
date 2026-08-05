import { useEffect, useMemo, useRef, useState } from "react";
import { LoaderCircle, RefreshCw } from "lucide-react";
import { Button } from "../ui/button";
import type { AdminRequest, CodeList, CodeRecord, Notify } from "./types";

function startOfDay(value: number) {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
}

function startOfWeek(value: number) {
  const date = new Date(startOfDay(value));
  const day = date.getDay();
  date.setDate(date.getDate() + (day === 0 ? -6 : 1 - day));
  return date.getTime();
}

function startOfMonth(value: number) {
  const date = new Date(startOfDay(value));
  date.setDate(1);
  return date.getTime();
}

function dayKey(date: Date) {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

function DailyChart({ daily }: { daily: { label: string; count: number }[] }) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [mouse, setMouse] = useState<{ x: number; y: number } | null>(null);
  const labelStep = daily.length <= 10 ? 1 : 5;
  const width = 1200;
  const height = 260;
  const padLeft = 44;
  const padRight = 24;
  const padTop = 24;
  const padBottom = 36;
  const innerWidth = width - padLeft - padRight;
  const innerHeight = height - padTop - padBottom;
  const maxCount = Math.max(1, ...daily.map((item) => item.count));
  const stepX = innerWidth / (daily.length - 1);
  const xAt = (index: number) => padLeft + index * stepX;
  const yAt = (count: number) =>
    padTop + innerHeight - (count / maxCount) * innerHeight;
  const line = daily
    .map(
      (item, index) =>
        `${index === 0 ? "M" : "L"}${xAt(index).toFixed(1)},${yAt(item.count).toFixed(1)}`,
    )
    .join(" ");
  const area = `${line} L${xAt(daily.length - 1).toFixed(1)},${padTop + innerHeight} L${padLeft},${padTop + innerHeight} Z`;
  const gridLevels = [0, 0.25, 0.5, 0.75, 1].map((ratio) => ({
    y: padTop + innerHeight - ratio * innerHeight,
    value: Math.round(maxCount * ratio),
  }));

  function handleMove(event: React.MouseEvent<SVGSVGElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    const scale = Math.min(rect.width / width, rect.height / height);
    const offsetX = (rect.width - width * scale) / 2;
    const offsetY = (rect.height - height * scale) / 2;
    const x = (event.clientX - rect.left - offsetX) / scale;
    const y = (event.clientY - rect.top - offsetY) / scale;
    const index = Math.round((x - padLeft) / stepX);
    setHoverIndex(index >= 0 && index < daily.length ? index : null);
    setMouse({ x, y });
  }

  function handleLeave() {
    setHoverIndex(null);
    setMouse(null);
  }

  const hovered = hoverIndex != null ? daily[hoverIndex] : null;
  const hoverX = hoverIndex != null ? xAt(hoverIndex) : 0;
  const hoverY = hoverIndex != null ? yAt(daily[hoverIndex].count) : 0;
  const tooltipText = hovered
    ? `${hovered.label}：${hovered.count} 次兑换`
    : "";
  const tooltipWidth = tooltipText.length * 13 + 20;
  const tooltipHeight = 28;
  const tooltipX =
    mouse != null
      ? Math.min(
          Math.max(mouse.x - tooltipWidth / 2, padLeft),
          width - padRight - tooltipWidth,
        )
      : 0;
  const tooltipY =
    mouse != null
      ? mouse.y - tooltipHeight - 16 < padTop
        ? Math.min(mouse.y + 16, padTop + innerHeight - tooltipHeight)
        : mouse.y - tooltipHeight - 16
      : 0;

  return (
    <svg
      className="h-56 w-full cursor-crosshair"
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label="最近 30 天兑换量折线图"
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
    >
      {gridLevels.map((level, index) => (
        <line
          key={index}
          x1={padLeft}
          x2={width - padRight}
          y1={level.y}
          y2={level.y}
          className="stroke-input"
          strokeWidth={1}
        />
      ))}
      <text
        x={padLeft - 8}
        y={gridLevels[4].y + 4}
        textAnchor="end"
        fontSize={12}
        fill="var(--muted-foreground)"
      >
        {gridLevels[4].value}
      </text>
      <text
        x={padLeft - 8}
        y={gridLevels[0].y + 4}
        textAnchor="end"
        fontSize={12}
        fill="var(--muted-foreground)"
      >
        {gridLevels[0].value}
      </text>
      <path d={area} fill="var(--primary)" opacity={0.08} />
      <path
        d={line}
        fill="none"
        stroke="var(--primary)"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {hovered && (
        <line
          x1={hoverX}
          x2={hoverX}
          y1={padTop}
          y2={padTop + innerHeight}
          stroke="var(--ring)"
          strokeWidth={1}
          strokeDasharray="4 4"
        />
      )}
      {daily.map((item, index) => (
        <circle
          key={index}
          cx={xAt(index)}
          cy={yAt(item.count)}
          r={hoverIndex === index ? 5 : 3}
          fill={hoverIndex === index ? "var(--primary)" : "var(--card)"}
          stroke="var(--primary)"
          strokeWidth={1.5}
        >
          <title>{`${item.label}：${item.count} 次兑换`}</title>
        </circle>
      ))}
      {hovered && (
        <g>
          <rect
            x={tooltipX}
            y={tooltipY}
            width={tooltipWidth}
            height={tooltipHeight}
            rx={6}
            fill="var(--card)"
            stroke="var(--input)"
          />
          <text
            x={tooltipX + tooltipWidth / 2}
            y={tooltipY + tooltipHeight / 2 + 4.5}
            textAnchor="middle"
            fontSize={13}
            fill="var(--foreground)"
          >
            {tooltipText}
          </text>
        </g>
      )}
      {daily.map((item, index) =>
        index % labelStep === 0 || index === daily.length - 1 ? (
          <text
            key={index}
            x={xAt(index)}
            y={height - 12}
            textAnchor="middle"
            fontSize={13}
            fill="var(--muted-foreground)"
          >
            {item.label}
          </text>
        ) : null,
      )}
    </svg>
  );
}

export function StatsOverview({
  request,
  notify,
}: {
  request: AdminRequest;
  notify: Notify;
}) {
  const [codes, setCodes] = useState<CodeRecord[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [revision, setRevision] = useState(0);
  const [mobile, setMobile] = useState(false);
  const [days, setDays] = useState(30);
  const [refreshSpin, setRefreshSpin] = useState(0);
  const requestRevision = useRef(0);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const update = () => {
      setMobile(mq.matches);
      setDays(mq.matches ? 7 : 30);
    };
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    const rev = ++requestRevision.current;
    setLoading(true);
    void (async () => {
      try {
        const first = await request<CodeList>("/api/admin/codes?limit=500");
        const items = [...first.items];
        while (items.length < first.total) {
          const params = new URLSearchParams({
            limit: "500",
            offset: String(items.length),
          });
          const more = await request<CodeList>(`/api/admin/codes?${params}`);
          if (more.items.length === 0) break;
          items.push(...more.items);
        }
        if (rev !== requestRevision.current) return;
        setCodes(items);
        setLoaded(true);
      } catch (error) {
        if (rev === requestRevision.current) {
          notify("error", "读取统计数据失败", {
            description: (error as Error).message,
          });
        }
      } finally {
        if (rev === requestRevision.current) setLoading(false);
      }
    })();
  }, [notify, request, revision]);

  const summary = useMemo(() => {
    const now = Date.now();
    const today = startOfDay(now);
    const week = startOfWeek(now);
    const month = startOfMonth(now);
    let used = 0;
    let unused = 0;
    let locked = 0;
    let todayCount = 0;
    let weekCount = 0;
    let monthCount = 0;
    for (const code of codes) {
      if (code.status === 1) used += 1;
      else if (code.status === 0) unused += 1;
      else if (code.status === 2 || code.status === 3) locked += 1;
      if (code.usedAt == null) continue;
      if (code.usedAt >= today) todayCount += 1;
      if (code.usedAt >= week) weekCount += 1;
      if (code.usedAt >= month) monthCount += 1;
    }
    return {
      total: codes.length,
      used,
      unused,
      locked,
      todayCount,
      weekCount,
      monthCount,
    };
  }, [codes]);

  const daily = useMemo(() => {
    const base = new Date();
    base.setHours(0, 0, 0, 0);
    const counts = new Map<string, number>();
    for (let offset = days - 1; offset >= 0; offset -= 1) {
      const date = new Date(base);
      date.setDate(base.getDate() - offset);
      counts.set(dayKey(date), 0);
    }
    for (const code of codes) {
      if (code.usedAt == null) continue;
      const key = dayKey(new Date(code.usedAt));
      if (counts.has(key)) counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    const result: { label: string; count: number }[] = [];
    for (let offset = days - 1; offset >= 0; offset -= 1) {
      const date = new Date(base);
      date.setDate(base.getDate() - offset);
      result.push({
        label: `${date.getMonth() + 1}/${date.getDate()}`,
        count: counts.get(dayKey(date)) ?? 0,
      });
    }
    return result;
  }, [codes, days]);

  const items = [
    { label: "总卡密数量", value: summary.total },
    { label: "已使用卡密数量", value: summary.used },
    { label: "已锁定卡密数量", value: summary.locked },
    { label: "未使用卡密数量", value: summary.unused },
    { label: "今日兑换数量", value: summary.todayCount },
    { label: "本周兑换数量", value: summary.weekCount },
    { label: "本月兑换数量", value: summary.monthCount },
  ];

  return (
    <div className="flex h-full min-h-0 flex-col gap-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="text-2xl font-semibold">数据概况</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            卡密数量与近期兑换统计
          </p>
        </div>
        <Button
          type="button"
          variant="ghost"
          className="refresh-button"
          title="刷新统计数据"
          aria-label="刷新统计数据"
          onClick={() => {
            setRefreshSpin((value) => value + 1);
            setRevision((value) => value + 1);
          }}
        >
          <RefreshCw
            key={refreshSpin}
            className={`size-4 ${refreshSpin > 0 ? "refresh-spin" : ""}`}
            onAnimationEnd={() => setRefreshSpin(0)}
          />
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-7">
        {items.map((item) => (
          <div className="rounded-xl border bg-card p-4" key={item.label}>
            <p className="text-sm text-muted-foreground">{item.label}</p>
            <p className="mt-1.5 text-3xl font-bold tracking-tight">
              {loaded ? item.value : "—"}
            </p>
          </div>
        ))}
      </div>

      {!mobile && (
        <div className="rounded-xl border bg-card p-4">
          <h3 className="mb-3 text-sm font-medium text-muted-foreground">
            最近 {days} 天兑换量
          </h3>
          {loaded ? (
            <DailyChart daily={daily} />
          ) : (
            <div className="grid h-56 place-items-center text-sm text-muted-foreground">
              <span>
                <LoaderCircle className="mr-2 inline size-4 animate-spin" />
                正在读取统计数据
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
