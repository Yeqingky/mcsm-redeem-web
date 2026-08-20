# mcsm-redeem-web 前端开发规范

> 本文件供 AI 与开发者接手本仓库时阅读。开始任务前必须完整阅读本文件。
> **每次代码变更后必须同步更新本文件**：新增/删除组件、路由、类型、业务规则有变时，在对应章节补充，保持与代码一致。

## 仓库职责

MCSManager 卡密兑换系统前端：React 19 + TypeScript + Vite + Tailwind CSS 4 + shadcn/ui 风格组件。后端在独立仓库 `mcsm-redeem`。本仓库只处理前端代码、`.env.example` 和本仓库 README。

## 代码导航

- 路由入口：`src/App.tsx`，只有 `/` 和 `/admin`，其他路径回退到 `/`。
- 兑换页：`src/components/RedeemPage.tsx`（兑换/续费共用，`GET /api/tasks/{id}` 轮询展示账号结果）
- 管理面板与侧边栏：`src/components/admin/AdminPanel.tsx`
- 数据概况（后端统计接口）：`src/components/admin/StatsOverview.tsx`
- 卡密表格、服务端分页、本地 UUID 生成、导入、详情：`src/components/admin/CardManagement.tsx`（详情弹窗仅展示 `username`/`ipAddress`，`v1.0.0` 起不再展示密码）
- 套餐创建/编辑/复制/删除及 Docker 镜像：`src/components/admin/SkuManagement.tsx`
- 系统设置（顶部横向分页：验证码配置、限流开关/参数/封禁 IP 列表）：`src/components/admin/SettingsPanel.tsx`、`src/components/admin/CaptchaSettings.tsx`、`src/components/admin/RateLimitManagement.tsx`
- 通用 UI 组件：`src/components/ui/`（button、input、switch 等）
- API 请求、通知、公共环境变量：`src/lib/client.ts`
- 类型定义：`src/components/admin/types.ts`（`CodeStatus` 自 `v1.0.0` 起仅含 `username`/`ipAddress`，无 `password`）

## 鉴权方式

前端不保存任何本地令牌。登录提交密码与 Cap token，后端下发 `HttpOnly` Cookie（`redeem_admin`）；所有管理请求经 `AdminPanel` 的 `request` 包装带 `credentials: "include"`。401 回到登录表单；其他错误（500/网络）显示错误卡片与重试按钮，不得误报"未登录"（通过 `ApiError.status` 区分）。

## 必须延续的 UI 要求

- 从普通用户角度命名，不向用户强调 SKU ID、API 字段名或后端实现。
- 文案尽量简短；必要的详细说明放在右侧提示图标中。自定义提示使用纯白不透明背景。
- 图标操作按钮不显示冗余文字，但必须保留 `aria-label`。
- 按钮需要有明显的按下反馈，不要恢复点击无反馈的样式。
- 卡密管理是贴合浏览器高度的固定表格区域，表格内部独立滚动，不使用浏览器原生丑陋滚动条。
- 表头始终显示，即使当前没有数据。
- 行选择支持点击整行，但右侧操作按钮区不触发选择。
- 卡密文本和用户名文本点击即复制；不要恢复独立卡密复制操作列按钮。
- Toast 在右下角最多显示三行，持续 5 秒；新消息从底部进入并堆叠，同时在浏览器控制台输出。
- 导入重复/失败卡密只输出到控制台，不在 Toast 中逐张展示。
- 工具栏左侧是"生成卡密、导入卡密"，右侧是"禁用所选、启用所选、刷新"。
- 分页与排序由服务端完成（`limit`/`offset`/`sort`/`order`），前端不得全量拉取后在浏览器排序分页。

## 业务规则

- 卡密格式：UUID 文本；前端 `isUUIDCode` 校验，导入/生成上限 1 万张。
- 兑换任务轮询：任务过期（404）时停止轮询并提示"任务已过期"，不得无限重试。
- 生成卡密完全在浏览器本地（`crypto.randomUUID` + `Set` 去重），生成不会入库，需单独导入。
- 卡密详情：`POST /api/admin/codes/status` 自 `v1.0.0` 起仅返回 `username`/`ipAddress`，不再返回密码；管理面板详情弹窗不再展示密码字段。
- 兑换结果：`GET /api/tasks/{id}` 在 `TASK_TTL` 内返回的 `Result` 含 `username`/`password`/`instanceId`/`endTime`，密码仅此一次可见，前端需提示用户及时保存。
- 兑换与登录的人机验证配置（提供商、地址、Site Key）由后端公开端点 `GET /api/captcha/config` 下发，前端不配置任何 `VITE_CAPTCHA_*` 变量；配置在后端数据库中存储，管理面板"系统设置 → 验证码"中修改。`provider` 为 `null` 时不渲染验证组件、提交按钮不受 token 限制；配置 `cap`/`turnstile`/`hcaptcha` 时渲染对应组件，验证服务不可用时用户无法完成验证（拿不到 token），表单提交按钮禁用，发不出有效请求，属预期行为。页面加载配置前提交按钮禁用。
- 环境变量以 `VITE_` 开头，构建时注入且会公开给浏览器，不能放任何私密凭据。

## 开发与验证命令

```bash
npm ci
npm run typecheck
npm run build
```

格式化修改的文件：

```bash
npx prettier --write <修改的 ts/tsx/md 文件>
```

交付前执行 `git diff --check` 和 `git status --short`。

## Git 与发布

- 本仓库与后端仓库分开提交、分开推送，Git 命令不要跑错仓库。
- 提交身份：`git -c user.name="YeqingKy" -c user.email="me@yeqingky.com" commit ...`
- 提交标题保持简短，详细更新放在提交正文；只在用户明确要求时提交或推送。
- 本仓库没有 Tag CI/CD，由 Cloudflare Pages/EdgeOne Pages 连接仓库构建，不要在本仓库创建 Tag。
- 推送用 WSL 内 `/usr/bin/git`，不要手动调用 `git.exe`。
