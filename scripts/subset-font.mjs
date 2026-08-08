// 构建期字体子集化
//
// 输入：scripts/fonts/LXGWBrightCode-Regular.woff2（完整字体，来源见 AGENTS.md 6.3）
// 输出：public/fonts/lxgw-bright-code-400.subset.<hash>.woff2（内容哈希命名，可安全长缓存）
//       src/generated/font-subset.json（供 BaseLayout 引用当前字体 URL）
//
// 字符集来源：src/ 下所有文本文件（文章 + 组件 + 页面）+ 下方常备字符。
// 评论等动态内容中的罕见字不在子集内时，浏览器会自动回退到系统字体，不会破版。

import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";
import subsetFont from "subset-font";

const SRC_FONT = "scripts/fonts/LXGWBrightCode-Regular.woff2";
const OUT_DIR = "public/fonts";
const OUT_BASE = "lxgw-bright-code-400.subset";
const META_DIR = "src/generated";
const META_FILE = join(META_DIR, "font-subset.json");

// 常备字符：ASCII 可打印区 + 常用中文标点 + 全角英数 + 常用符号
//（这些字符未必出现在源码里，但 UI/日期/动态内容经常会用到）
const EXTRAS =
    Array.from({ length: 95 }, (_, i) => String.fromCodePoint(0x20 + i)).join("") +
    "。，、；：？！“”‘’（）《》〈〉【】「」『』—…·～％℃年月日时分秒" +
    "０１２３４５６７８９" +
    "ＡＢＣＤＥＦＧＨＩＪＫＬＭＮＯＰＱＲＳＴＵＶＷＸＹＺ" +
    "ａｂｃｄｅｆｇｈｉｊｋｌｍｎｏｐｑｒｓｔｕｖｗｘｙｚ" +
    "→←↑↓↔★☆✓✗•◦▪■□";

const SCAN_EXTS = new Set([".md", ".astro", ".ts", ".tsx", ".js", ".mjs"]);

function collectText(dir) {
    let text = "";
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const path = join(dir, entry.name);
        if (entry.isDirectory()) {
            if (entry.name === "generated") continue;
            text += collectText(path);
        } else if (SCAN_EXTS.has(entry.name.slice(entry.name.lastIndexOf(".")))) {
            text += readFileSync(path, "utf8");
        }
    }
    return text;
}

const text = collectText("src") + EXTRAS;
const chars = new Set();
for (const ch of text) {
    const cp = ch.codePointAt(0);
    if (cp >= 0x20 && cp !== 0x7f) chars.add(ch);
}
const subsetText = [...chars].join("");
console.log(`收集到 ${chars.size} 个不重复字符`);

const fontBuffer = readFileSync(SRC_FONT);
const subset = await subsetFont(fontBuffer, subsetText, { targetFormat: "woff2" });

const sizeKB = subset.length / 1024;
if (sizeKB < 50 || sizeKB > 4096) {
    throw new Error(`子集大小异常: ${sizeKB.toFixed(0)}KB，请检查输入字体或字符集`);
}

const hash = createHash("sha256").update(subset).digest("hex").slice(0, 8);
const filename = `${OUT_BASE}.${hash}.woff2`;
writeFileSync(join(OUT_DIR, filename), subset);

// 清理旧哈希的子集文件，避免部署体积随时间膨胀
for (const f of readdirSync(OUT_DIR)) {
    if (f.startsWith(`${OUT_BASE}.`) && f !== filename) {
        rmSync(join(OUT_DIR, f));
        console.log(`已清理旧子集: ${f}`);
    }
}

mkdirSync(META_DIR, { recursive: true });
writeFileSync(META_FILE, JSON.stringify({ url: `/fonts/${filename}` }, null, 2) + "\n");

console.log(`字体子集: ${filename} (${sizeKB.toFixed(0)}KB)`);
if (!existsSync(META_FILE)) throw new Error("元数据写入失败");
