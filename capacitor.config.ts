import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.sakurasawasdee.app",
  appName: "Sakura & Sawasdee",
  webDir: "dist",
  server: {
    androidScheme: "https",
  },
  ios: {
    contentInset: "automatic",
  },
  android: {
    backgroundColor: "#4A3F55",
  },
};

export default config;
