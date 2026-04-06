// @ts-check
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  // 本地开发占位符，GitHub Actions 构建时会通过 --site 参数覆盖
  site: 'https://example.com',
});
