# AGENT.md — 个人博客项目

> 本文件面向 AI 编码助手。在修改代码前请先阅读本文档。
> **当前版本：v1.0.0**

---

## 1. 技术栈与架构

| 层级 | 技术 |
|------|------|
| 框架 | **Astro 6.x**（静态 + SSR API，输出 `dist/`） |
| 包管理器 | **Bun 1.3.x**（`bun install`、`bun run build`） |
| 样式 | **Tailwind CSS 4.x**（Vite 插件方式接入） |
| 字体 | **LXGW Bright Code**（构建期子集化，产物在 `public/fonts/`） |
| 内容 | Markdown + Astro Content Collections（`src/content/blog/`） |
| 部署 | **Cloudflare Workers** via GitHub Actions（`.github/workflows/deploy.yml`） |
| 数据库 | **Cloudflare D1**（`cmsdb`）+ Drizzle ORM |
| 运行时 | Node 24（CI 构建要求），Bun 仅做包管理 |

---

## 2. 目录结构

```
.
├── src/
│   ├── content/blog/          # 文章（Markdown）
│   ├── components/            # 可复用组件
│   │   ├── PageGrid.astro     # 三栏布局容器
│   │   ├── SiteHeader.astro   # 顶栏（sticky + 毛玻璃 + 当前页高亮）
│   │   ├── DocTree.astro      # 左侧文章树
│   │   ├── ThemeToggle.astro  # 主题切换按钮
│   │   └── Comments.astro     # 评论组件（D1 + 原生 JS）
│   ├── db/
│   │   └── schema.ts          # Drizzle 表定义（comments, commentRateLimits）
│   ├── layouts/
│   │   ├── BaseLayout.astro   # 基础布局（导航、页脚、字体）
│   │   └── BlogPostLayout.astro  # 文章页布局（含目录 TOC + 评论）
│   ├── pages/
│   │   ├── index.astro        # 首页（文章列表）
│   │   ├── about.astro        # 关于页
│   │   ├── api/
│   │   │   └── comments.ts    # 评论 API（GET / POST）
│   │   ├── blog/
│   │   │   ├── [...slug].astro   # 文章详情路由
│   │   │   └── index.astro       # 重定向到 /
│   │   └── tags/
│   │       ├── index.astro       # 标签列表页
│   │       └── [tag].astro       # 标签详情页
│   ├── styles/global.css      # 全局样式 + CSS 变量
│   ├── generated/             # 构建期生成（gitignored，如 font-subset.json）
│   └── content.config.ts      # 内容集合 schema
├── scripts/
│   ├── subset-font.mjs        # 构建期字体子集化脚本
│   └── fonts/                 # 完整字体源（LXGWBrightCode-Regular.woff2）
├── public/fonts/              # 构建期生成的字体子集（gitignore，勿手改）
├── .github/workflows/deploy.yml  # CI/CD（Cloudflare Workers）
├── wrangler.toml              # Cloudflare Workers / D1 / KV 绑定配置
├── schema.sql                 # D1 初始化 SQL（comments + comment_rate_limits）
├── Dockerfile                 # 生产构建镜像
├── docker-compose.yml         # 本地 Docker 编排
└── astro.config.mjs
```

---

## 3. 设计规范

### 3.1 极简主义风格
- **无卡片、无阴影、无圆角大按钮**
- 以留白和排版传递层次感
- 主色调：纯白 / 纯黑暗色；强调色：正文色本身

### 3.2 三栏布局策略
- **桌面端（≥1024px）**：`220px | 中间内容 | 220px`
- **中间栏固定最大宽度 960px**，整体 `max-width: 1500px` 居中
- **文章详情页**：左侧显示 `DocTree`，右侧显示 `TOC`
- **其他页面**：左右侧边栏保留位置但留空，保证中间栏对齐
- **移动端（<1024px）**：隐藏左右栏，变为单栏

### 3.3 链接样式规则
- **全局 `a` 默认无下划线**
- **只有文章正文和引用块中的链接显示下划线**（`article a`、`blockquote a`）
- 标签、导航、按钮必须显式去除下划线，避免与边框样式冲突

### 3.4 字体
- 全局使用 `LXGW Bright Code`（霞鹜文楷 + Monaspace Argon 混合）
- 正文字号：`16px`，行高 `1.7`

---

## 4. 内容创作规范（Frontmatter）

每篇文章位于 `src/content/blog/xxx.md`，头部格式：

```md
---
title: "文章标题"
pubDate: 2026-04-02
description: "可选的简短描述"
tags: ["标签一", "标签二"]
draft: false
testOnly: false
---
```

- `title`：**必填**
- `pubDate`：**必填**，`YYYY-MM-DD` 格式
- `tags`：字符串数组，**可选**
- `draft`：布尔值，默认 `false`；`true` 时不会在首页和标签页显示（路由仍生成，可通过 URL 访问）
- `testOnly`：布尔值，默认 `false`；`true` 时仅在 `bun run dev` 开发环境可见，生产构建**完全不生成路由**（404），并从所有列表、RSS、标签页中移除

---

## 5. 常用命令

```bash
# 安装依赖
bun install

# 本地开发（自动先执行字体子集化）
bun run dev

# 构建（自动先执行字体子集化，输出到 dist/）
bun run build

# 单独执行字体子集化
bun run subset:font

# 预览构建结果（在本地 workerd 运行时中运行，含 D1/KV 绑定）
bun run preview

# D1 本地 SQL 执行（仅影响本地副本，不影响远程）
wrangler d1 execute cmsdb --local --file=./schema.sql
```

---

## 6. 已知注意事项

### 6.1 Astro 内容缓存
修改 `src/content.config.ts` 后，如果页面未生效，请清除缓存：
```bash
rm -rf .astro && bun run dev
```

### 6.2 CI 构建
GitHub Actions 中**必须同时安装 Node 22 和 Bun**：
- Astro 6 要求 `node >= 22.12.0`
- `ubuntu-latest` 默认只带 Node 20

### 6.3 字体文件
采用**构建期子集化**：全站只部署一个按内容裁剪的单文件字体，不再使用 unicode-range 分包方案。
- **完整字体源**：`scripts/fonts/LXGWBrightCode-Regular.woff2`（v2.711，已提交仓库）。升级字体时：从 [lxgw/LxgwBright-Code Releases](https://github.com/lxgw/LxgwBright-Code/releases) 下载对应版本 7z → 解压出 `LXGWBrightCode-Regular.ttf` → 用 `wawoff2` 压缩覆盖该文件
- **子集化脚本**：`scripts/subset-font.mjs`（`bun run dev` / `bun run build` 会自动先执行，也可单独 `bun run subset:font`）。字符集 = `src/` 下所有文本文件 + 常备字符（ASCII、中文标点、全角英数）
- **产物**：`public/fonts/lxgw-bright-code-400.subset.<内容哈希>.woff2`（哈希命名，可安全长缓存；旧哈希文件自动清理），字体 URL 写入 `src/generated/font-subset.json` 供 `BaseLayout.astro` 引用（`<head>` 内 preload + 内联 `@font-face`）。两者均已 gitignore
- **新文章的新字符**在下次构建时自动纳入；`dev` 期间新增字符需重启 dev 才会进入子集
- 评论等动态内容中的罕见字不在子集内时，浏览器自动回退系统字体，不会破版；本地安装过 LXGW Bright Code 的访客优先走 `local()` 完整字体
- 500/600 字重与斜体由浏览器从 400 合成
- **缓存**：`public/_headers` 为 `/fonts/*` 设置了 `Cache-Control: public, max-age=31536000, immutable`，Cloudflare adapter 构建时会自动追加 `/_astro/*` 规则。去掉该规则会导致字体每次访问都回源重新验证，切勿删除
- `public/fonts/` 仅放构建产物，不入库；完整字体源只保留在 `scripts/fonts/`

### 6.4 RSS 站点地址
`astro.config.mjs` 中应配置真实的站点域名。

### 6.5 渲染模式
- Astro 6 默认 `output: 'static'`，配合 Cloudflare adapter 后静态页面会自动预渲染
- API 路由 `src/pages/api/comments.ts` 显式导出 `export const prerender = false`，由 Workers SSR 执行
- 静态页面均已显式添加 `export const prerender = true`
- API 路由通过 `import { env } from 'cloudflare:workers'` 访问 D1（`env.DB`）

### 6.6 评论系统与 D1
- 远程 D1 数据库（`cmsdb`）必须手动创建表，本地 `wrangler d1 execute --local` 不会同步到远程
- 需要的表：
  - `comments` — 存储评论（见 `schema.sql`）
  - `comment_rate_limits` — 存储 IP 限流记录（部署后需手动创建）
- 评论系统包含两层防护：
  - **Honeypot**：隐藏的 `website` 字段，机器人填写即拒绝
  - **IP 速率限制**：同一 IP 5 分钟内只能提交 1 条评论

---

## 7. 部署

- 推送到 `main` 分支即触发 GitHub Actions 自动构建并部署到 **Cloudflare Workers**
- 需要在仓库 **Settings → Secrets and variables → Actions** 中配置：
  - `CLOUDFLARE_API_TOKEN` — Cloudflare API Token（需包含 `Cloudflare Workers:Edit` 权限，建议同时有 `Account:Read`）
  - `CLOUDFLARE_ACCOUNT_ID` — Cloudflare 账户 ID
- 部署流程：
  1. `bun run build`
  2. 向 `wrangler.toml` 追加 `main = "dist/server/entry.mjs"`
  3. 删除 Astro 生成的 `dist/server/wrangler.json`（避免 wrangler 配置冲突）
  4. `npx wrangler deploy`（仅读取根目录 `wrangler.toml`）
- Workers 默认域名：`https://godemove.<account-subdomain>.workers.dev`
- 自定义域名绑定：Dashboard → Workers & Pages → `godemove` → Settings → Triggers → Custom Domains

---

## 8. 功能状态（v1.0.0）

- ✅ **评论系统**：基于 Cloudflare D1 + Drizzle ORM + 原生 JS，支持文章页显示与提交评论
  - ✅ 评论列表（按时间倒序）
  - ✅ 提交表单（昵称 ≤ 32 字，内容 ≤ 2000 字）
  - ✅ Honeypot 反爬虫
  - ✅ IP 速率限制（5 分钟 1 条）
- ✅ **标签云与标签详情页**
- ✅ **RSS 订阅**
- ✅ **暗色 / 亮色主题切换**（三态循环：跟随系统 → 亮色 → 暗色，跟随系统时实时响应 `prefers-color-scheme` 变化）
- ✅ **Docker 支持**
- ⏳ **搜索**：可考虑 Pagefind 或 Fuse.js

---

## 9. 修改守则

1. **保持极简**：不要引入重型 UI 框架（Shadcn/ui、Bootstrap 等）
2. **样式一致性**：Tailwind 优先，必要时在组件 `<style>` 中补充
3. **最小变更**：只改与需求直接相关的文件
4. **测试构建**：每次修改后运行 `bun run build`，确保 0 报错
5. **更新本文档**：如果改了架构、依赖或部署流程，同步更新 `AGENTS.md`
6. **遵循 Conventional Commits**：所有提交必须使用规范格式，见下节

---

## 10. Commit Message 规范（Conventional Commits）

所有提交必须遵循 [Conventional Commits](https://www.conventionalcommits.org/) 格式，确保生成 CHANGELOG 和版本管理时语义清晰。

### 格式

```
<type>(<scope>): <简短描述>

<可选的详细正文>

<可选的脚注>
```

- **type**：必填，表示提交类别
- **scope**：可选，表示影响范围（如 `comments`、`api`、`deploy`、`ui`）
- **subject**：必填，简短描述（小写开头，不加句号）

### 常用 type

| Type | 含义 | 示例 |
|------|------|------|
| `feat` | 新功能 | `feat(comments): add honeypot anti-spam` |
| `fix` | 修复 bug | `fix(api): resolve D1 binding not found in deploy` |
| `docs` | 文档变更 | `docs: update AGENTS.md deployment notes` |
| `style` | 代码格式（不影响逻辑） | `style: format tailwind class order` |
| `refactor` | 重构 | `refactor(comments): simplify fetch logic` |
| `perf` | 性能优化 | `perf(db): add index on comments.post_id` |
| `test` | 测试相关 | `test(api): add rate limit unit tests` |
| `chore` | 构建/工具/依赖 | `chore(deps): bump astro to 6.2.0` |
| `ci` | CI/CD 配置 | `ci: switch deploy action to wrangler-action` |

### 特殊场景

- **破坏性变更**：在 type/scope 后加 `!`，或在脚注加 `BREAKING CHANGE:`
  ```
  feat(api)!: remove legacy comment endpoint
  ```
- **关联 Issue**：在脚注使用 `Closes #123`
  ```
  fix(ui): prevent comment double loading

  Closes #42
  ```

### 示例

```bash
git commit -m "feat(comments): add IP-based rate limiting

- Add comment_rate_limits table to D1 schema
- Enforce 5-minute cooldown per IP in POST /api/comments
- Update AGENTS.md with security notes"
```
