<p align="center">
  <strong><span style="color: red;">⚠️ 警告：此项目完全由 AI 开发，请不要用于生产环境。</span></strong>
</p>

# MCSManager 卡密兑换系统

MCSManager 卡密兑换系统的独立 React 前端，使用 React 19、TypeScript、Vite、shadcn/ui、Tailwind CSS 与 Cap Widget。

右上角入口为“管理面板”。登录后左侧提供卡密管理和套餐管理导航：卡密管理使用固定高度分页表格，顶部支持状态与套餐多选筛选（不选择表示全部）、本地生成 UUID 卡密、卡密搜索、导入和批量启用/禁用；套餐管理可以创建、编辑或删除套餐，并为每个套餐分别配置 MCSManager 实例参数。Docker 镜像支持搜索，并从目标节点已有镜像中选择。卡密使用 UUID 格式，有效天数在导入时独立填写，不属于套餐。兑换成功后的结果默认可在 10 分钟内凭任务 ID 重复查询。

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

| 变量                | 是否必填 | 说明                                             | 默认值或示例                |
| ------------------- | -------- | ------------------------------------------------ | --------------------------- |
| `VITE_API_BASE_URL` | 是       | 浏览器可访问的后端 API 基础地址，不要以 `/` 结尾 | `http://localhost:8080`     |
| `VITE_CAP_URL`      | 是       | 浏览器可访问的 Cap 验证服务基础地址              | `https://cap.example.com`   |
| `VITE_CAP_SITE_KEY` | 是       | Cap 的公开 Site Key                              | `your-site-key`             |
| `VITE_SITE_NAME`    | 否       | 页面左上角名称和浏览器标签页标题                 | `夜轻面板兑换页`            |
| `VITE_PANEL_URL`    | 是       | 兑换成功后引导用户访问的 MCSManager 地址         | `https://mcsm.example.com/` |

所有以 `VITE_` 开头的变量都会在构建时写入前端资源，任何访问者都可以查看。请勿在这些变量中填写 Cap Secret、MCSManager API Key、管理员密码或其他私密凭据。修改变量后需重新运行 `npm run dev` 或重新构建部署。

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
