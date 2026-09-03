import type { NextConfig } from 'next';
import path from 'node:path';

const isGitHubPages = process.env.GITHUB_ACTIONS === 'true';

const nextConfig: NextConfig = {
  output: 'export',
  trailingSlash: true,
  basePath: isGitHubPages ? '/ziwei-love-chart' : '',
  assetPrefix: isGitHubPages ? '/ziwei-love-chart/' : '',
  images: { unoptimized: true },
  turbopack: { root: path.resolve(process.cwd()) },
};

export default nextConfig;
