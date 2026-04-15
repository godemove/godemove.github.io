# AGENT.md — 个人博客项目

> 本文件面向 AI 编码助手。在修改代码前请先阅读本文档。

---

## 1. 技术栈与架构

| 层级 | 技术 |
|------|------|
| 框架 | **Astro 6.x**（混合输出 `hybrid`，输出 `dist/`） |
| 包管理器 | **Bun 1.3.x**（`bun install`、`bun run build`） |
| 样式 | **Tailwind CSS 4.x**（Vite 插件方式接入） |
| 字体 | **LXGW Bright Code**（本地托管于 `public/fonts/`） |
| 内容 | Markdown + Astro Content Collections（`src/content/blog/`） |
| 部署 | **Cloudflare Pages** via GitHub Actions（`.github/workflows/deploy.yml`） |
| 数据库 | **Cloudflare D1**（`cmsdb`）+ Drizzle ORM |
| 运行时 | Node 22（CI 构建要求），Bun 仅做包管理 |

---

## 2. 目录结构

```
.
├── src/
│   ├── content/blog/          # 文章（Markdown）
│   ├── components/            # 可复用组件
│   │   ├── PageGrid.astro     # 三栏布局容器
│   │   ├── DocTree.astro      # 左侧文章树
│   │   ├── TagCloud.astro     # 右侧标签云
│   │   ├── ThemeToggle.astro  # 主题切换按钮
│   │   └── Comments.astro     # 评论组件（D1）
│   ├── db/
│   │   └── schema.ts          # Drizzle 表定义
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
│   └── content.config.ts      # 内容集合 schema
├── public/fonts/              # LXGW Bright Code 字体文件
├── .github/workflows/deploy.yml  # CI/CD（Cloudflare Pages）
├── wrangler.toml              # Cloudflare D1 绑定配置
├── schema.sql                 # D1 comments 表结构
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
---
```

- `title`：**必填**
- `pubDate`：**必填**，`YYYY-MM-DD` 格式
- `tags`：字符串数组，**可选**
- `draft`：布尔值，默认 `false`；`true` 时不会在首页和标签页显示

---

## 5. 常用命令

```bash
# 安装依赖
bun install

# 本地开发（静态页面预览）
bun run dev

# 本地开发（带 D1 绑定，推荐用于测试评论功能）
wrangler pages dev --d1=DB

# 构建（输出到 dist/）
bun run build

# 预览构建结果
bun run preview

# D1 本地 SQL 执行
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
字体通过 `public/fonts/` 本地托管，不要改路径。构建后会自动复制到 `dist/fonts/`。

### 6.4 RSS 站点地址
`astro.config.mjs` 中设置了 `site: 'https://example.com'` 作为本地开发占位符。
**部署前请将其替换为你的实际域名**。

### 6.5 混合渲染（Hybrid Output）
- `astro.config.mjs` 已启用 `output: 'hybrid'` + Cloudflare adapter
- 所有静态页面显式导出 `export const prerender = true`
- 只有 `/api/comments` 为服务端渲染（`prerender = false`）
- 在 `wrangler pages dev --d1=DB` 环境下运行时，API 路由通过 `import { env } from 'cloudflare:workers'` 访问 D1（`env.DB`）

---

## 7. 部署

- 推送到 `main` 分支即触发 GitHub Actions 自动构建并部署到 **Cloudflare Pages**
- 需要在仓库 Settings → Secrets and variables → Actions 中配置：
  - `CLOUDFLARE_API_TOKEN` — Cloudflare API Token（需包含 Cloudflare Pages 编辑权限）
  - `CLOUDFLARE_ACCOUNT_ID` — Cloudflare 账户 ID
- `wrangler.toml` 中已绑定 D1 数据库 `cmsdb`，Cloudflare Pages 构建时自动解析

---

## 8. 功能状态

- ✅ **评论系统**：基于 Cloudflare D1 + Drizzle ORM + 原生 JS，支持文章页显示与提交评论
- ⏳ **搜索**：可考虑 Pagefind 或 Fuse.js

---

## 9. 修改守则

1. **保持极简**：不要引入重型 UI 框架（Shadcn/ui、Bootstrap 等）
2. **样式一致性**：Tailwind 优先，必要时在组件 `<style>` 中补充
3. **最小变更**：只改与需求直接相关的文件
4. **测试构建**：每次修改后运行 `bun run build`，确保 0 报错
5. **更新本文档**：如果改了架构、依赖或部署流程，同步更新 `AGENT.md`
