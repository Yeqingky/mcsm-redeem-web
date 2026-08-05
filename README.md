> 配套后端仓库：<https://github.com/Yeqingky/mcsm-redeem>

<p align="center">
  <strong><span style="color: red;">⚠️ 警告：此项目完全由 AI 开发，请不要用于生产环境。</span></strong>
</p>

# MCSManager 卡密兑换系统（前端）

## 技术栈

- **框架**：React 19 + TypeScript（严格模式）
- **构建**：Vite 6
- **样式**：Tailwind CSS 4 + shadcn/ui 风格组件（基于 Radix UI）
- **图表**：手写 SVG 折线图（无图表库依赖）
- **验证码**：`cap-widget` 组件
- **通知**：sonner（右下角 Toast）
- **部署**：Cloudflare Pages / EdgeOne Pages 静态托管

## 简介

MCSManager 卡密兑换系统的独立 React 前端，与后端仓库 `mcsm-redeem` 配套。前后端分离：前端是纯静态 SPA，真正的鉴权、业务逻辑与数据校验全部在后端。

<details>
<summary>界面截图（点击展开）</summary>

![界面截图 1](https://cdn.nodeimage.com/i/BFBtyr8fbrFR2KQYCwKtpQhH9lHqMWCf.webp)

![界面截图 2](https://cdn.nodeimage.com/i/do70SynnkJxI5IGzV5s6Q9955n0Cl6YP.webp)

![界面截图 3](https://cdn.nodeimage.com/i/6rl6WpASbFIT3WysIqSPof6VRP8PL2uH.webp)

![界面截图 4](https://cdn.nodeimage.com/i/p9cYZDHoZ2H4pLWO1ntQM0ywEhNyWe4K.webp)

![界面截图 5](https://cdn.nodeimage.com/i/G9KaBzzTThC0Ax1Ah4r8FmLNEizptXw9.webp)

![界面截图 6](https://cdn.nodeimage.com/i/mFykEbN0DGmhBF28R7YsZlQxTME1Zo9v.webp)

</details>

页面结构：

- `/`：卡密兑换页——用卡密开通新实例，或用"卡密 + 32 位十六进制实例 ID"续费；兑换成功展示实例 ID、用户名、密码和到期时间（密码只显示一次）。任务轮询默认 1 秒，排队任务较多时自动拉长间隔（上限 5 秒），排队位置 5 以上时显示预计等待时间。
- `/admin`：管理面板——登录后包含四个导航：数据概况、卡密管理、套餐管理、限流管理。其他路径自动回退到 `/`。

页面右上角提供暗色/亮色模式切换，选择会持久化到本地存储，未选择时跟随系统偏好。

管理面板功能：

- **数据概况**：总卡密数量、已使用/未使用/已禁用/已锁定数量、今日/本周/本月兑换量，以及最近 30 天（移动端 7 天）兑换量折线图。数据全部由后端 `GET /api/admin/codes/stats` 计算返回。
- **卡密管理**：固定高度分页表格（表格内部独立滚动），顶部支持状态与套餐多选筛选、本地生成 UUID 卡密（单次最多 1 万张）、搜索（卡密或 IP）、批量导入（单次最多 1 万张）和批量启用/禁用；支持按创建时间或使用时间排序，排序与分页由服务端完成。
- **套餐管理**：创建、编辑、复制、删除套餐，为每个套餐配置 MCSManager 实例参数；Docker 镜像支持搜索并从目标节点已有镜像中选择，节点不可用时可手动输入镜像名称。
- **限流管理**：开启/关闭限流（开关），配置登录/兑换的失败统计窗口与上限、封禁时长，查看被封禁 IP 列表（含封禁截止时间）并解除封禁。

## 本地开发

```bash
cp .env.example .env
npm ci
npm run dev
```

默认访问 `http://localhost:5173`。请在 `.env` 中设置后端 API、Cap 地址和公开 Site Key；不要将 Cap Secret、MCSManager API Key 或管理员密码放入本仓库。

## 环境变量

前端的所有配置既可以通过构建或启动进程的系统环境变量传入，也可以写在项目根目录的 `.env` 中。配置优先级为：**系统环境变量 > `.env` > 默认值**；修改配置后需要重新启动开发服务或重新构建。

复制示例文件后按实际部署环境修改：

```bash
cp .env.example .env
```

| 变量                | 是否必填 | 说明                                             | 默认值或示例                              |
| ------------------- | -------- | ------------------------------------------------ | ----------------------------------------- |
| `VITE_API_BASE_URL` | 是       | 浏览器可访问的后端 API 基础地址，不要以 `/` 结尾 | `http://localhost:8080`                   |
| `VITE_CAP_URL`      | 是       | 浏览器可访问的 Cap 验证服务基础地址              | `https://cap.example.com`                 |
| `VITE_CAP_SITE_KEY` | 是       | Cap 的公开 Site Key                              | `your-site-key`                           |
| `VITE_SITE_NAME`    | 否       | 页面左上角名称和浏览器标签页标题                 | `夜轻面板兑换页`                          |
| `VITE_LOGO_URL`     | 否       | 页面左上角 Logo 图片地址，留空则不显示           | `https://list.yppp.net/d/cos/yeqing.jpeg` |
| `VITE_PANEL_URL`    | 是       | 兑换成功后引导用户访问的 MCSManager 地址         | `https://mcsm.example.com/`               |

所有以 `VITE_` 开头的变量都会在构建时写入前端资源，任何访问者都可以查看。请勿在这些变量中填写 Cap Secret、MCSManager API Key、管理员密码或其他私密凭据。修改变量后需重新运行 `npm run dev` 或重新构建部署。

## 鉴权方式

管理面板不保存任何本地令牌：登录时提交密码与 Cap token，后端校验通过后下发 `HttpOnly` Cookie（`redeem_admin`），后续所有管理请求通过 `credentials: "include"` 携带 Cookie，由后端会话校验；401 时前端回到登录表单。

## 构建

```bash
npm ci
npm run typecheck
npm run build
```

`npm run build` 会先进行 TypeScript 检查，再通过 Vite 生成静态文件。构建产物位于 `dist/`。

## Cloudflare Pages / EdgeOne Pages 部署

本仓库不包含 CI/CD 工作流，请直接连接 Git 仓库并由托管平台完成构建。Cloudflare Pages 和 EdgeOne Pages 使用以下设置：

- Node.js 版本：`22`
- 安装命令：`npm ci`
- 构建命令：`npm run build`
- 输出目录：`dist`
- 根目录：仓库根目录

在平台的环境变量设置中配置 `VITE_API_BASE_URL`、`VITE_CAP_URL`、`VITE_CAP_SITE_KEY` 和 `VITE_SITE_NAME`。这是 React 单页应用，需将未知路径回退到 `/index.html`，避免直接访问子路由时返回 404。

## 许可证

本项目采用 [MIT 许可证](LICENSE) 开源。
