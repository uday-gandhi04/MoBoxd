import { CapacitorUpdater } from "@capgo/capacitor-updater";
import { Capacitor } from "@capacitor/core";

export const notifyLiveUpdateReady = async () => {
  if (!Capacitor.isNativePlatform()) {
    return;
  }

  try {
    const result = await CapacitorUpdater.notifyAppReady();

    console.log("✅ Live update bundle marked ready:", result);
  } catch (error) {
    console.error(
      "❌ Failed to notify live update ready:",
      error
    );
  }
};