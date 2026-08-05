const themeStorageKey = "mcsm-redeem-theme";
export type Theme = "light" | "dark";

export function systemTheme(): Theme {
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

export function initialTheme(): Theme {
  try {
    const saved = window.localStorage.getItem(themeStorageKey);
    if (saved === "light" || saved === "dark") return saved;
  } catch {
    // 浏览器禁止本地存储时使用系统偏好。
  }
  return systemTheme();
}

export function applyTheme(theme: Theme, persist = true) {
  document.documentElement.classList.toggle("dark", theme === "dark");
  if (persist) {
    try {
      window.localStorage.setItem(themeStorageKey, theme);
    } catch {
      // 浏览器禁止本地存储时仅应用当前会话。
    }
  }
}

// watchSystemTheme 在用户未手动选择主题时，跟随系统深浅色实时切换；
// 手动点击切换后系统变化不再影响页面。返回取消监听的清理函数。
export function watchSystemTheme(onChange: (theme: Theme) => void): () => void {
  const mq = window.matchMedia("(prefers-color-scheme: dark)");
  const handler = () => {
    let manual: string | null = null;
    try {
      manual = window.localStorage.getItem(themeStorageKey);
    } catch {
      // 无法读取本地存储时视为未手动选择。
    }
    if (manual !== "light" && manual !== "dark") {
      onChange(systemTheme());
    }
  };
  mq.addEventListener("change", handler);
  return () => mq.removeEventListener("change", handler);
}

// switchTheme 从点击位置以圆形扩散/收回动画过渡到新主题。
// 实现方式：View Transitions API 的页面快照 + clip-path 圆形动画，
// 圆内是页面内容快照（而非纯色遮罩）。
// 进入暗色：新主题快照从点击点展开；进入亮色：旧主题快照收缩露出新主题。
// commitTheme 必须同步提交框架状态，确保主题 class、图标和 Toaster 被捕获为
// 同一个新状态，避免动画结束后才重绘导致闪烁。
// 浏览器不支持或用户偏好减少动画时直接切换。
let activeThemeTransition: ViewTransition | null = null;

function clearTransitionStyles() {
  const root = document.documentElement;
  root.classList.remove(
    "theme-expanding",
    "theme-collapsing",
    "theme-switching",
  );
  root.style.removeProperty("--theme-origin-x");
  root.style.removeProperty("--theme-origin-y");
  root.style.removeProperty("--theme-radius");
}

export function switchTheme(
  current: Theme,
  origin?: HTMLElement | null,
  commitTheme?: (theme: Theme) => void,
): void {
  // View Transition 仍在展示快照时忽略重复点击，避免新旧伪元素互相中断。
  if (activeThemeTransition) return;

  const next = current === "dark" ? "light" : "dark";
  const updateTheme = () => {
    applyTheme(next);
    commitTheme?.(next);
  };
  const reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;
  if (!document.startViewTransition || reduceMotion || !origin) {
    updateTheme();
    return;
  }
  const rect = origin.getBoundingClientRect();
  const x = rect.left + rect.width / 2;
  const y = rect.top + rect.height / 2;
  const radius = Math.hypot(
    Math.max(x, window.innerWidth - x),
    Math.max(y, window.innerHeight - y),
  );
  document.documentElement.style.setProperty("--theme-origin-x", `${x}px`);
  document.documentElement.style.setProperty("--theme-origin-y", `${y}px`);
  document.documentElement.style.setProperty("--theme-radius", `${radius}px`);
  document.documentElement.classList.add("theme-switching");
  document.documentElement.classList.toggle("theme-expanding", next === "dark");
  document.documentElement.classList.toggle(
    "theme-collapsing",
    next === "light",
  );

  const transition = document.startViewTransition(() => {
    updateTheme();
    // 组件颜色过渡已临时禁用；强制同步样式，确保捕获的是完整的新主题。
    void document.body.offsetHeight;
  });
  activeThemeTransition = transition;

  // 新快照建立后即可恢复普通组件的 hover/active 过渡。
  void transition.ready.then(
    () => document.documentElement.classList.remove("theme-switching"),
    () => document.documentElement.classList.remove("theme-switching"),
  );
  void transition.finished.then(
    () => {
      if (activeThemeTransition !== transition) return;
      activeThemeTransition = null;
      clearTransitionStyles();
    },
    () => {
      if (activeThemeTransition !== transition) return;
      activeThemeTransition = null;
      clearTransitionStyles();
    },
  );
}
