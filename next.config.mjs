// GitHub Pages 项目站点的访问路径是 https://<user>.github.io/<repo>/，
// 因此构建到 Pages 时需要把 basePath 设为仓库名。本地 dev/build 不设，
// 仍然在根路径 "/" 提供，互不影响（由 GITHUB_PAGES 环境变量切换，
// 部署工作流会设置它）。
const repo = process.env.PAGES_BASE_PATH ?? "tane";
const isPages = process.env.GITHUB_PAGES === "true";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: "export", // 生成纯静态 out/ 目录
  trailingSlash: true, // 每页输出 index.html，利于 Pages 路由
  images: { unoptimized: true }, // 静态导出不支持图片优化（本项目也未用 next/image）
  ...(isPages ? { basePath: `/${repo}` } : {}),
};

export default nextConfig;
