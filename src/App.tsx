import { useState } from "react";
import { Menu } from "lucide-react";
import { AdminPanel } from "./components/admin/AdminPanel";
import { RedeemPage } from "./components/RedeemPage";
import { Toaster } from "./components/ui/sonner";
import { notify, requestJSON, siteName } from "./lib/client";

document.title = siteName;

export default function App() {
  const requestedPath = window.location.pathname;
  const isAdmin = requestedPath === "/admin";
  const [sidebarOpen, setSidebarOpen] = useState(false);
  if (requestedPath !== "/" && !isAdmin) {
    window.history.replaceState(null, "", "/");
  }
  return (
    <>
      <header className={isAdmin ? "admin-header" : ""}>
        <div className="flex items-center gap-3">
          {isAdmin && (
            <button
              type="button"
              className="grid size-8 cursor-pointer place-items-center rounded-md transition-opacity duration-100 hover:opacity-70 active:scale-[0.97] active:opacity-50 md:hidden"
              aria-label="展开侧边栏"
              title="展开侧边栏"
              onClick={() => setSidebarOpen((value) => !value)}
            >
              <Menu className="size-5" />
            </button>
          )}
          <a className="font-semibold" href="/">
            {siteName}
          </a>
        </div>
        {!isAdmin && (
          <a className="text-sm text-muted-foreground" href="/admin">
            管理面板
          </a>
        )}
      </header>
      <main className={isAdmin ? "admin-main" : ""}>
        {isAdmin ? (
          <AdminPanel
            baseRequest={requestJSON}
            notify={notify}
            sidebarOpen={sidebarOpen}
            onCloseSidebar={() => setSidebarOpen(false)}
          />
        ) : (
          <RedeemPage />
        )}
      </main>
      <Toaster />
    </>
  );
}
