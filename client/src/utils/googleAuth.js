import { Capacitor } from "@capacitor/core";
import { SocialLogin } from "@capgo/capacitor-social-login";

let initialized = false;

export const initializeGoogleAuth = async () => {
  if (initialized) return;

  if (!Capacitor.isNativePlatform()) {
    return;
  }

  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  console.log("🔐 Google OAuth config:", {
    exists: !!googleClientId,
    length: googleClientId?.length || 0,
    suffix: googleClientId ? googleClientId.slice(-25) : null,
  });

  if (!googleClientId) {
    throw new Error("VITE_GOOGLE_CLIENT_ID is missing from runtime build");
  }

  await SocialLogin.initialize({
    google: {
      webClientId: googleClientId,
      mode: "online",
    },
  });

  initialized = true;

  console.log("✅ Native Google Sign-In initialized");
};

export const nativeGoogleLogin = async () => {
  await initializeGoogleAuth();

  console.log("🔐 Starting native Google Sign-In");

  const result = await SocialLogin.login({
    provider: "google",
    options: {
      scopes: ["email", "profile"],
      filterByAuthorizedAccounts: false,
      style: "bottom",
    },
  });

  console.log("✅ Native Google login result:", result);

  return result;
};
