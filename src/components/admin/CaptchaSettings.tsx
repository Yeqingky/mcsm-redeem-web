import { FormEvent, useEffect, useRef, useState } from "react";
import { Info, LoaderCircle, Save } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Select } from "../ui/select";
import type { AdminRequest, CaptchaConfig, Notify } from "./types";

const providers = [
  { value: "", label: "不启用" },
  { value: "cap", label: "Cap" },
  { value: "turnstile", label: "Cloudflare Turnstile" },
  { value: "hcaptcha", label: "hCaptcha" },
];

function providerLabel(provider: string) {
  return providers.find((item) => item.value === provider)?.label || provider;
}

// 参考 cloudreve 的 CapCaptcha 配置区：标题（600 权重）+ 输入框 + 底部说明，
// 字段组之间 24px 间距。
function SettingField({
  label,
  htmlFor,
  hint,
  children,
}: {
  label: string;
  htmlFor: string;
  hint: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={htmlFor} className="font-semibold">
        {label}
      </Label>
      {children}
      <p className="text-xs text-muted-foreground">{hint}</p>
    </div>
  );
}

export function CaptchaSettings({
  request,
  notify,
}: {
  request: AdminRequest;
  notify: Notify;
}) {
  const [provider, setProvider] = useState("");
  const [url, setURL] = useState("");
  const [siteKey, setSiteKey] = useState("");
  const [secretKey, setSecretKey] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedProvider, setSavedProvider] = useState("");
  // 掩码输入用 -webkit-text-security 而非 type="password"，避免触发浏览器密码保存提示；
  // 不支持的浏览器（如 Firefox）退回密码框。
  const [maskSupported] = useState(() => {
    const probe = document.createElement("input");
    probe.style.setProperty("-webkit-text-security", "disc");
    return probe.style.getPropertyValue("-webkit-text-security") === "disc";
  });
  const requestRevision = useRef(0);

  useEffect(() => {
    const rev = ++requestRevision.current;
    setLoading(true);
    void (async () => {
      try {
        const result = await request<CaptchaConfig>("/api/admin/captcha");
        if (rev !== requestRevision.current) return;
        setProvider(result.provider || "");
        setURL(result.url || "");
        setSiteKey(result.siteKey || "");
        setSecretKey(result.secretKey || "");
        setSavedProvider(result.provider || "");
      } catch (error) {
        if (rev === requestRevision.current) {
          notify("error", "读取验证码配置失败", {
            description: (error as Error).message,
          });
        }
      } finally {
        if (rev === requestRevision.current) setLoading(false);
      }
    })();
  }, [notify, request]);

  async function save(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    try {
      await request<CaptchaConfig>("/api/admin/captcha", {
        method: "PUT",
        body: JSON.stringify({ provider, url, siteKey, secretKey }),
      });
      setSavedProvider(provider);
      notify(
        "success",
        provider ? "验证码已启用" : "验证码已关闭",
        provider
          ? { description: "请刷新页面后登录与兑换使用新的验证配置" }
          : undefined,
      );
    } catch (error) {
      notify("error", "保存失败", {
        description: (error as Error).message,
      });
    } finally {
      setSaving(false);
    }
  }

  const needKeys = provider !== "";
  return (
    <form
      className="flex max-w-xl flex-col gap-6 rounded-lg border bg-card p-4"
      onSubmit={save}
    >
      <SettingField
        label="验证码提供商"
        htmlFor="captcha-provider"
        hint="选择人机验证服务商；不启用时登录与兑换跳过验证"
      >
        <Select
          id="captcha-provider"
          variant="filled"
          value={provider}
          options={providers}
          placeholder="选择验证码提供商"
          onChange={(next) => {
            setProvider(next);
            setSecretKey("");
          }}
        />
      </SettingField>
      {provider === "cap" && (
        <SettingField
          label="服务地址"
          htmlFor="captcha-url"
          hint="Cap 服务公开基础地址，不包含站点标识，例如 https://cap.example.com"
        >
          <Input
            id="captcha-url"
            variant="filled"
            value={url}
            onChange={(event) => setURL(event.target.value)}
            placeholder="https://cap.example.com"
            autoComplete="off"
            required
          />
        </SettingField>
      )}
      {needKeys && (
        <>
          <SettingField
            label="站点标识（Site Key）"
            htmlFor="captcha-site-key"
            hint={
              provider === "turnstile"
                ? "在 Cloudflare Turnstile 控制台创建，供浏览器公开使用。"
                : provider === "hcaptcha"
                  ? "在 hCaptcha 控制台创建，供浏览器公开使用。"
                  : "Cap 服务公开站点标识，供浏览器使用。"
            }
          >
            <Input
              id="captcha-site-key"
              variant="filled"
              value={siteKey}
              onChange={(event) => setSiteKey(event.target.value)}
              placeholder="your-site-key"
              autoComplete="off"
              required
            />
          </SettingField>
          <SettingField
            label="服务端密钥（Secret）"
            htmlFor="captcha-secret-key"
            hint="仅供后端验证使用，不会发送到浏览器。"
          >
            <Input
              id="captcha-secret-key"
              variant="filled"
              type={maskSupported ? "text" : "password"}
              className={maskSupported ? "masked-password" : undefined}
              value={secretKey}
              onChange={(event) => setSecretKey(event.target.value)}
              placeholder="your-site-secret"
              autoComplete="off"
              required
            />
          </SettingField>
        </>
      )}
      <div className="flex items-center justify-between">
        <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Info className="size-4 shrink-0" />
          {savedProvider
            ? `当前已启用：${providerLabel(savedProvider)}`
            : "当前未启用人机验证"}
        </p>
        <Button type="submit" disabled={saving || loading}>
          {saving && <LoaderCircle className="size-4 animate-spin" />}
          保存
        </Button>
      </div>
    </form>
  );
}
