import { defineConfig } from "@playwright/test";

const baseUrl = process.env.PLAYWRIGHT_BASE_URL || process.env.NEXT_PUBLIC_APP_URL || "http://127.0.0.1:3006";
const parsedBaseUrl = new URL(baseUrl);

const appHost = parsedBaseUrl.hostname || "127.0.0.1";
const appPort = parsedBaseUrl.port || (parsedBaseUrl.protocol === "https:" ? "443" : "3006");

export default defineConfig({
  testDir: "./tests",
  use: {
    baseURL: baseUrl,
  },
  webServer: {
    command: `node node_modules/next/dist/bin/next dev --hostname ${appHost} --port ${appPort}`,
    url: parsedBaseUrl.origin,
    reuseExistingServer: true,
    timeout: 120000,
  },
});
