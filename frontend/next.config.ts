import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export", // 静的エクスポート（out/ にHTML/JS/CSSを生成）
  trailingSlash: true, // /requirements -> /requirements/index.html（S3+CloudFront配信向き）
  images: { unoptimized: true }, // 静的エクスポートでは画像最適化サーバを使わない
};

export default nextConfig;
