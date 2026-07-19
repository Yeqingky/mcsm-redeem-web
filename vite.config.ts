import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, ".", "");
  return {
    envDir: ".",
    plugins: [react(), tailwindcss()],
    define: {
      "import.meta.env.VITE_API_BASE_URL": JSON.stringify(
        env.VITE_API_BASE_URL || "http://localhost:8080",
      ),
      "import.meta.env.VITE_CAP_URL": JSON.stringify(
        env.VITE_CAP_URL || "",
      ),
      "import.meta.env.VITE_CAP_SITE_KEY": JSON.stringify(
        env.VITE_CAP_SITE_KEY || "",
      ),
      "import.meta.env.VITE_SITE_NAME": JSON.stringify(
        env.VITE_SITE_NAME || "夜轻面板兑换页",
      ),
    },
  };
});
