import { toast } from "sonner";

const api = String(import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");

export const siteName = import.meta.env.VITE_SITE_NAME || "夜轻面板兑换页";
export const panelUrl = String(import.meta.env.VITE_PANEL_URL || "").trim();
export const uuidCodePattern =
  "[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}";

export function isUUIDCode(value: string) {
  return new RegExp(`^${uuidCodePattern}$`).test(value.trim());
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export async function requestJSON<T = unknown>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const response = await fetch(api + path, options);
  const result = response.status === 204 ? {} : await response.json();
  if (!response.ok)
    throw new ApiError(result.error || "请求失败", response.status);
  return result as T;
}

export function notify(
  level: "success" | "error",
  title: string,
  options: { description?: string; id?: string } = {},
) {
  const detail = options.description || "";
  if (level === "error") {
    console.error(`[通知] ${title}`, detail);
    toast.error(title, { ...options, duration: 5000 });
  } else {
    console.info(`[通知] ${title}`, detail);
    toast.success(title, { ...options, duration: 5000 });
  }
}
