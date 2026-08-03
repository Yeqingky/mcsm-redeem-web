import { AdminPanel } from "./components/admin/AdminPanel";
import { RedeemPage } from "./components/RedeemPage";
import { Toaster } from "./components/ui/sonner";
import { notify, requestJSON, siteName } from "./lib/client";

document.title = siteName;

export default function App() {
  const requestedPath = window.location.pathname;
  const isAdmin = requestedPath === "/admin";
  if (requestedPath !== "/" && !isAdmin) {
    window.history.replaceState(null, "", "/");
  }
  return (
    <>
      <header>
        <a className="font-semibold" href="/">
          {siteName}
        </a>
        <a className="text-sm text-muted-foreground" href="/admin">
          管理面板
        </a>
      </header>
      <main className={isAdmin ? "admin-main" : ""}>
        {isAdmin ? (
          <AdminPanel baseRequest={requestJSON} notify={notify} />
        ) : (
          <RedeemPage />
        )}
      </main>
      <Toaster />
    </>
  );
}
