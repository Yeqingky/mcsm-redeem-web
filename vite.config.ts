import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { execFileSync } from "node:child_process";
const logoFallback = "https://list.yppp.net/d/cos/yeqing.jpeg";

// buildCommit 读取当前构建对应的 git 提交短哈希，供关于页展示。
// 优先用 git（托管平台会 clone 仓库，CI 仅打包源码时不可用），其次回退到
// 构建环境变量 / .env 里的 VITE_BUILD_COMMIT，都没有时返回 unknown。
function readBuildCommit(fallback: string): string {
  if (fallback) return fallback;
  try {
    return String(
      execFileSync("git", ["rev-parse", "--short", "HEAD"], {
        stdio: ["ignore", "pipe", "ignore"],
      }),
    ).trim();
  } catch {
    return "unknown";
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, ".", "");
  const value = (key: string, fallback: string) => {
    if (process.env[key] !== undefined) return process.env[key] || fallback;
    return env[key] || fallback;
  };
  const buildCommit = readBuildCommit(value("VITE_BUILD_COMMIT", ""));
  return {
    envDir: ".",
    plugins: [
      react(),
      tailwindcss(),
      {
        name: "logo-env",
        transformIndexHtml(html) {
          return html.replaceAll(
            "%VITE_LOGO_URL%",
            JSON.stringify(value("VITE_LOGO_URL", logoFallback)),
          );
        },
      },
    ],
    define: {
      "import.meta.env.VITE_API_BASE_URL": JSON.stringify(
        value("VITE_API_BASE_URL", "http://localhost:8080"),
      ),
      "import.meta.env.VITE_CAP_URL": JSON.stringify(value("VITE_CAP_URL", "")),
      "import.meta.env.VITE_CAP_SITE_KEY": JSON.stringify(
        value("VITE_CAP_SITE_KEY", ""),
      ),
      "import.meta.env.VITE_SITE_NAME": JSON.stringify(
        value("VITE_SITE_NAME", "夜轻面板兑换页"),
      ),
      "import.meta.env.VITE_LOGO_URL": JSON.stringify(
        value("VITE_LOGO_URL", logoFallback),
      ),
      "import.meta.env.VITE_PANEL_URL": JSON.stringify(
        value("VITE_PANEL_URL", ""),
      ),
      "import.meta.env.VITE_BUILD_COMMIT": JSON.stringify(buildCommit),
    },
  };
});
