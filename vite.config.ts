import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, ".", "");
  const value = (key: string, fallback: string) => {
    if (process.env[key] !== undefined) return process.env[key] || fallback;
    return env[key] || fallback;
  };
  return {
    envDir: ".",
    plugins: [react(), tailwindcss()],
    define: {
      "import.meta.env.VITE_API_BASE_URL": JSON.stringify(
        value("VITE_API_BASE_URL", "http://localhost:8080"),
      ),
      "import.meta.env.VITE_CAP_URL": JSON.stringify(
        value("VITE_CAP_URL", ""),
      ),
      "import.meta.env.VITE_CAP_SITE_KEY": JSON.stringify(
        value("VITE_CAP_SITE_KEY", ""),
      ),
      "import.meta.env.VITE_SITE_NAME": JSON.stringify(
        value("VITE_SITE_NAME", "夜轻面板兑换页"),
      ),
    },
  };
});
