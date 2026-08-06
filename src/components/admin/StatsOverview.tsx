import { useEffect, useRef, useState } from "react";
import {
  Ban,
  Calendar,
  CalendarDays,
  CalendarRange,
  CheckCircle2,
  CircleDashed,
  LoaderCircle,
  Lock,
  RefreshCw,
  TicketCheck,
} from "lucide-react";
import { Button } from "../ui/button";
import type { AdminRequest, Notify, Stats } from "./types";

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
  const [stats, setStats] = useState<Stats>();
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
        const result = await request<Stats>(
          `/api/admin/codes/stats?days=${days}`,
        );
        if (rev !== requestRevision.current) return;
        setStats(result);
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
  }, [days, notify, request, revision]);

  const summary = stats
    ? stats
    : {
        total: 0,
        used: 0,
        unused: 0,
        disabled: 0,
        locked: 0,
        todayCount: 0,
        weekCount: 0,
        monthCount: 0,
        daily: [],
      };

  const daily = (stats?.daily || []).map((item) => {
    const parts = item.date.split("-").map(Number);
    return { label: `${parts[1]}/${parts[2]}`, count: item.count };
  });

  const items = [
    {
      label: "总卡密数量",
      value: summary.total,
      icon: TicketCheck,
      color: "bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400",
    },
    {
      label: "未使用卡密数量",
      value: summary.unused,
      icon: CircleDashed,
      color:
        "bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400",
    },
    {
      label: "已使用卡密数量",
      value: summary.used,
      icon: CheckCircle2,
      color:
        "bg-green-100 text-green-600 dark:bg-green-950 dark:text-green-400",
    },
    {
      label: "已禁用卡密数量",
      value: summary.disabled,
      icon: Ban,
      color: "bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-400",
    },
    {
      label: "已锁定卡密数量",
      value: summary.locked,
      icon: Lock,
      color:
        "bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400",
    },
    {
      label: "今日兑换数量",
      value: summary.todayCount,
      icon: CalendarDays,
      color: "bg-sky-100 text-sky-600 dark:bg-sky-950 dark:text-sky-400",
    },
    {
      label: "本周兑换数量",
      value: summary.weekCount,
      icon: CalendarRange,
      color:
        "bg-violet-100 text-violet-600 dark:bg-violet-950 dark:text-violet-400",
    },
    {
      label: "本月兑换数量",
      value: summary.monthCount,
      icon: Calendar,
      color:
        "bg-orange-100 text-orange-600 dark:bg-orange-950 dark:text-orange-400",
    },
  ];

  return (
    <div className="flex h-full min-h-0 flex-col gap-5">
      <div className="flex flex-wrap items-start justify-between gap-2 pl-4">
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

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-5">
        <div className="flex flex-col justify-center rounded-xl border bg-card p-4 lg:col-span-2">
          <h3 className="mb-4 text-sm font-medium text-muted-foreground">
            数据统计
          </h3>
          <div className="grid grid-cols-2 gap-x-4 gap-y-5">
            {items.map((item) => (
              <div className="flex items-center gap-3" key={item.label}>
                <span
                  className={`grid size-10 shrink-0 place-items-center rounded-full ${item.color}`}
                >
                  <item.icon className="size-5" />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-xl font-bold tracking-tight">
                    {loaded ? item.value : "—"}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {item.label}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {!mobile && (
          <div className="flex flex-col justify-center rounded-xl border bg-card p-4 lg:col-span-3">
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
    </div>
  );
}
