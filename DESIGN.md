# DESIGN.md — 我的日志视觉与交互规范

> 本文件用于记录并维护当前博客的整体设计风格，任何后续视觉重构都应以此为基准进行对比与迭代。
> 版本：v1.0.0

---

## 1. 设计哲学

- **极简主义**：无卡片、无阴影、无夸张圆角。通过留白、字号和字重建立层级。
- **内容优先**：页面结构服务于阅读，装饰元素被压缩到最低。
- **克制配色**：仅使用背景色、正文色、次要文字色、边框色四种核心颜色，强调色即正文色本身。
- **无缝明暗切换**：依据系统主题自动适配，同时允许用户手动切换并持久化。

---

## 2. 色彩系统

色彩通过 `src/styles/global.css` 中的 `@theme` 注册为 Tailwind CSS v4 自定义属性。

### 2.1 浅色主题（默认）

| Token | 值 | 用途 |
|-------|------|------|
| `--color-bg` | `#ffffff` | 页面背景 |
| `--color-text` | `#1a1a1a` | 正文、主标题、强调元素 |
| `--color-text-secondary` | `#666666` | 次要文字、日期、标签、目录 |
| `--color-border` | `#e5e5e5` | 边框、分割线、代码块背景 |
| `--color-accent` | `#1a1a1a` | 强调色（与正文色一致） |

### 2.2 深色主题

触发条件：`data-theme="dark"` 或系统 `prefers-color-scheme: dark`。

| Token | 值 | 用途 |
|-------|------|------|
| `--color-bg` | `#0a0a0a` | 页面背景 |
| `--color-text` | `#ededed` | 正文、主标题 |
| `--color-text-secondary` | `#a0a0a0` | 次要文字 |
| `--color-border` | `#2a2a2a` | 边框、分割线、代码块背景 |
| `--color-accent` | `#ededed` | 强调色 |

### 2.3 色彩使用规则

- 不允许引入新的品牌色或渐变背景。
- 交互状态仅允许通过 `border-text` / `text-text` 变化实现，不使用背景色变化作为 hover 主效果。
- 链接默认无下划线，hover 时通过 `border-bottom-color` 变化提供反馈。

---

## 3. 字体与排版

### 3.1 字体

- **正文字体**：`LXGW Bright Code`（本地托管，见 `public/fonts/`）。
- **备用字体栈**：`-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`
- **等宽字体栈**：`"LXGW Bright Code", "SF Mono", Monaco, Inconsolata, "Fira Code", monospace`
- 字体文件通过 `BaseLayout.astro` 以四个 CSS 子集方式加载：300、400、300 italic、400 italic。

### 3.2 字号规范

| 元素 | 字号 | 字重 | 行高 | 备注 |
|------|------|------|------|------|
| 页面主标题（H1） | `1.5rem` / `1.875rem` | 600 | 1.3 | 文章页为 `text-3xl` |
| 文章二级标题 | `1.4rem` | 600 | 1.3 | `margin-top: 2.5rem` |
| 文章三级标题 | `1.15rem` | 600 | 1.3 | `margin-top: 2rem` |
| 正文 | `1rem` (16px) | 400 | 1.7 | 全局基准 |
| 辅助/日期/标签 | `0.75rem` ~ `0.875rem` | 400 | 1.625 | 使用 `text-text-secondary` |
| 代码 | `0.9em` | 400 | inherit | 等宽字体 |

### 3.3 行宽与间距

- 正文行高：`1.7`
- 标题行高：`1.3`
- 段落底部间距：`1.25rem`
- 列表底部间距：`1.25rem`，列表项左侧内边距：`1.5rem`
- 引用块：左侧 `2px` 实线边框，`padding-left: 1.25rem`，使用次要文字色。
- 分隔线 `<hr>`：`1px` 上边框，`margin: 2.5rem 0`。

---

## 4. 布局系统

### 4.1 外层容器

- 最大宽度：`max-w-[1500px]`，水平居中。
- 页面内边距：`px-6 py-12`。
- 整体为 `min-h-screen flex flex-col`，`main` 区域 `flex-1` 保证页脚沉底。

### 4.2 三栏网格

组件：`src/components/PageGrid.astro`

```
桌面端（≥1024px）：220px | minmax(0, 960px) | 220px
平板（≥768px）：  200px | minmax(0, 1fr)   | 200px
小屏（≥640px）：  160px | minmax(0, 1fr)   | 160px
移动端（<1024px）：单列，左右栏隐藏
```

- 左右侧边栏使用 `sticky top-8 self-start` 实现滚动固定。
- 文章详情页：左侧为 `DocTree` 文章树，右侧为目录 `TOC`。
- 非文章页：左右栏保留位置但留空，确保中间栏对齐。

### 4.3 响应式断点

| 断点 | 布局行为 |
|------|----------|
| `<1024px` | 隐藏左右侧边栏，内容单栏 |
| `≥1024px` | 完整三栏布局 |

---

## 5. 导航与页脚

### 5.1 顶部导航

- 左侧 Logo / 站点名：`font-semibold text-lg`，无下划线。
- 右侧链接：`text-sm text-text-secondary`，hover 过渡为 `text-text`。
- 主题切换按钮：`w-8 h-8 rounded-full`，hover 背景 `bg-border`，无背景默认透明。

### 5.2 页脚

- 居中排列，顶部有 `mt-20 pt-8`。
- 文字：`text-sm text-text-secondary`。
- 包含 RSS 图标链接，hover 透明度与颜色变化。

---

## 6. 链接样式

- **全局默认**：`text-decoration: none`。
- **仅文章正文与引用块中的链接**显示底部边框：
  - 默认：`border-bottom: 1px solid var(--color-border)`
  - hover：`border-bottom-color: var(--color-text)`
- **导航、标签、按钮**必须显式去除下划线，避免与边框冲突。
- 文章列表标题使用 `border-b border-border pb-1.5`，hover 时 `border-text`。

---

## 7. 组件样式

### 7.1 标签

- 形状：`rounded-full`。
- 边框：`1px solid var(--color-border)`。
- 内边距：`px-2 py-0.5`（小标签）或 `px-3 py-1`（标签页）。
- 文字：`text-xs` / `text-sm text-text-secondary`。
- hover：`text-text` + `border-text`。

### 7.2 目录（TOC）

- 标题：`font-semibold text-xs text-text-secondary uppercase tracking-wider`。
- 链接：`text-sm text-text-secondary`，左侧有 `w-1.5 h-1.5 rounded-full bg-border` 圆点。
- 当前激活项：圆点变为 `bg-text`，文字变为 `text-text`。
- 三级标题缩进：`pl-4`。

### 7.3 文章树（DocTree）

- 按年份分组倒序排列。
- 年份：`text-xs text-text-secondary`。
- 文章标题：`text-sm`，当前页 `text-text`，其余 `text-text-secondary hover:text-text`。
- 标题超长时截断：`truncate`。

### 7.4 评论表单

- 区域顶部有 `border-t border-border`。
- 输入框：透明背景，`border border-border rounded`，focus 时 `border-text`。
- 提交按钮：`px-4 py-2 text-sm border border-border rounded`，hover 时 `border-text text-text`。
- 隐藏蜜罐字段 `website` 用于反爬虫。

### 7.5 代码块

- 背景：`var(--color-border)`。
- 内边距：`1rem`。
- 圆角：`4px`。
- 行内代码：`padding: 0.15rem 0.35rem`，圆角 `3px`。

---

## 8. 动画与过渡

所有交互反馈均使用简单过渡，避免复杂动画：

| 属性 | 时长 | 缓动 |
|------|------|------|
| 颜色/边框色 | `0.2s` | `ease` |
| 透明度 | `0.2s` | `ease` |

- 不使用 transform 动画、不使用骨架屏、不使用 loading spinner。
- 主题切换无动画，即时生效。

---

## 9. 暗色模式

- 初始主题通过 `BaseLayout.astro` 内联脚本读取：
  1. `localStorage.theme`
  2. `prefers-color-scheme`
  3. 默认 `light`
- 切换后写入 `localStorage` 并设置 `data-theme`。
- CSS 变量同时支持媒体查询与属性选择器。

---

## 10. 设计约束清单

- [ ] 不使用卡片阴影（`box-shadow`）。
- [ ] 不使用大圆角按钮或卡片。
- [ ] 不引入额外品牌色/渐变。
- [ ] 正文链接必须带底部边框，其他链接不带。
- [ ] 所有 hover 状态使用颜色/边框过渡，不使用背景填充作为默认 hover。
- [ ] 保持三栏布局在桌面端的对齐与留白。
- [ ] 移动端隐藏侧边栏，内容单栏。
- [ ] 字体必须优先使用 `LXGW Bright Code`。

---

## 11. 关键文件索引

| 文件 | 说明 |
|------|------|
| `src/styles/global.css` | 全局样式、CSS 变量、Tailwind v4 主题 |
| `src/layouts/BaseLayout.astro` | 基础布局、导航、页脚、主题脚本 |
| `src/layouts/BlogPostLayout.astro` | 文章页布局、TOC、评论 |
| `src/components/PageGrid.astro` | 三栏网格容器 |
| `src/components/DocTree.astro` | 左侧文章树 |
| `src/components/ThemeToggle.astro` | 主题切换按钮 |
| `src/components/Comments.astro` | 评论列表与表单 |
| `public/fonts/` | LXGW Bright Code 字体文件 |
