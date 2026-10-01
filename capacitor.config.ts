import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.gradelens.app",
  appName: "GradeLens",
  webDir: "public",
  server: {
    // Wraps the live, deployed app instead of bundling local files — this app
    // has a real backend (auth, Postgres, API routes) that can't be statically
    // exported, so the native shell just points at the real URL.
    url: "https://full-stack-ai-cgpa-calculator-th1x.onrender.com",
    cleartext: false,
  },
};

export default config;
