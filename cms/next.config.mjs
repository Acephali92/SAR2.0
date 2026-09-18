import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { withPayload } from '@payloadcms/next/withPayload';

const dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // cms/ ist ein eigenstaendiges npm-Projekt. Ohne feste Wurzel waehlt Turbopack wegen des zweiten
  // Lockfiles im Repo-Root das Elternverzeichnis - samt dessen node_modules (z. B. eigenes sharp).
  turbopack: {
    root: dirname,
  },
};

export default withPayload(nextConfig, { devBundleServerPackages: false });
