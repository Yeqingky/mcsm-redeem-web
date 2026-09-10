import { useEffect, useState } from "react";
import { ExternalLink, Info } from "lucide-react";
import { buildCommit } from "../../lib/client";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import type { AdminRequest } from "./types";

const backendRepo = "https://github.com/Yeqingky/mcsm-redeem";
const frontendRepo = "https://github.com/Yeqingky/mcsm-redeem-web";
const licenseUrl = "https://github.com/Yeqingky/mcsm-redeem/blob/main/LICENSE";

// 后端构建信息由需鉴权的 GET /api/admin/version 下发。
// 后端低于首次引入该端点的版本时返回 404，此处不视为错误，仅提示无法获取。
type BackendBuild = {
  version: string;
  commit: string;
  built: string;
};

function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 py-1.5">
      <span className="w-20 shrink-0 text-muted-foreground">{label}</span>
      <span className="min-w-0 break-all">{children}</span>
    </div>
  );
}

function RepoLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <a
      className="inline-flex items-center gap-1 break-all hover:underline"
      href={href}
      target="_blank"
      rel="noreferrer"
    >
      {children}
      <ExternalLink className="size-3.5 shrink-0" />
    </a>
  );
}

function commitLink(repo: string, commit: string) {
  if (!commit || commit === "unknown") return undefined;
  return `${repo}/commit/${commit}`;
}

function CommitValue({ repo, commit }: { repo: string; commit: string }) {
  const href = commitLink(repo, commit);
  if (!commit) return <span className="text-muted-foreground">未知</span>;
  if (!href) return <span>{commit}</span>;
  return <RepoLink href={href}>{commit}</RepoLink>;
}

export function AboutPanel({ request }: { request: AdminRequest }) {
  const [backend, setBackend] = useState<BackendBuild>();
  const [unavailable, setUnavailable] = useState(false);

  useEffect(() => {
    let cancelled = false;
    request<BackendBuild>("/api/admin/version")
      .then((value) => {
        if (!cancelled) setBackend(value);
      })
      .catch(() => {
        // 后端版本过低没有该端点，或读取失败：只在页面上说明，不打断其它操作。
        if (!cancelled) setUnavailable(true);
      });
    return () => {
      cancelled = true;
    };
  }, [request]);

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-5">
      <div className="pl-4">
        <h2 className="text-2xl font-semibold">关于</h2>
        <p className="mt-1 text-sm text-muted-foreground">版本信息与开源许可</p>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto pr-1">
        <Card className="ml-4 max-w-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Info className="size-4" />
              版本信息
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            <Row label="前端提交">
              <CommitValue repo={frontendRepo} commit={buildCommit} />
            </Row>
            <Row label="后端版本">
              {backend ? (
                <span>{backend.version || "未知"}</span>
              ) : unavailable ? (
                <span className="text-muted-foreground">
                  无法获取（后端版本过低）
                </span>
              ) : (
                <span className="text-muted-foreground">读取中…</span>
              )}
            </Row>
            <Row label="后端提交">
              {backend ? (
                <CommitValue repo={backendRepo} commit={backend.commit} />
              ) : (
                <span className="text-muted-foreground">
                  {unavailable ? "—" : "读取中…"}
                </span>
              )}
            </Row>
            <Row label="仓库">
              <div className="flex flex-col gap-0.5">
                <RepoLink href={frontendRepo}>mcsm-redeem-web</RepoLink>
                <RepoLink href={backendRepo}>mcsm-redeem</RepoLink>
              </div>
            </Row>
            <Row label="开源协议">
              <RepoLink href={licenseUrl}>MIT License</RepoLink>
              <span className="ml-2 text-muted-foreground">
                Copyright (c) 2026 YeqingKy
              </span>
            </Row>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
