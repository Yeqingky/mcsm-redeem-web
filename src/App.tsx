import { useState } from "react";
import { Menu } from "lucide-react";
import { AdminPanel } from "./components/admin/AdminPanel";
import { RedeemPage } from "./components/RedeemPage";
import { Toaster } from "./components/ui/sonner";
import { notify, requestJSON, siteName, logoUrl } from "./lib/client";

document.title = siteName;

export default function App() {
  const requestedPath = window.location.pathname;
  const isAdmin = requestedPath === "/admin";
  const [sidebarOpen, setSidebarOpen] = useState(false);
  if (requestedPath !== "/" && !isAdmin) {
    window.history.replaceState(null, "", "/");
  }
  return (
    <div className="flex min-h-screen flex-col">
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
          <a className="flex items-center gap-2 font-semibold" href="/">
            {logoUrl && (
              <img
                src={logoUrl}
                alt="logo"
                className="size-6 rounded-full object-cover"
              />
            )}
            {siteName}
          </a>
        </div>
        {isAdmin ? (
          <a
            className="text-sm text-muted-foreground hover:underline"
            href="https://github.com/Yeqingky/mcsm-redeem"
            target="_blank"
            rel="noreferrer"
          >
            Github
          </a>
        ) : (
          <a className="text-sm text-muted-foreground" href="/admin">
            管理面板
          </a>
        )}
      </header>
      <main className={`flex-1 ${isAdmin ? "admin-main" : ""}`}>
        {isAdmin ? (
          <AdminPanel
            baseRequest={requestJSON}
            notify={notify}
            sidebarOpen={sidebarOpen}
            onCloseSidebar={() => setSidebarOpen(false)}
          />
        ) : (
          <>
            <div className="flex w-full flex-1 flex-col justify-center">
              <RedeemPage />
            </div>
            <a
              className="pb-1 text-center text-sm text-muted-foreground hover:underline"
              href="https://github.com/Yeqingky/mcsm-redeem"
              target="_blank"
              rel="noreferrer"
            >
              Github
            </a>
          </>
        )}
      </main>
      <Toaster />
    </div>
  );
}
