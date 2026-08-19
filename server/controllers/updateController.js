const semver = require("semver");

const OTA_MANIFEST_URL =
  "https://raw.githubusercontent.com/uday-gandhi04/MoBoxd/main/ota/latest.json";

let cachedManifest = null;
let manifestFetchedAt = 0;

// Cache the manifest for 5 minutes.
// This prevents every Android startup from hitting GitHub.
const MANIFEST_CACHE_DURATION = 5 * 60 * 1000;

const getLatestManifest = async () => {
  const now = Date.now();

  if (
    cachedManifest &&
    now - manifestFetchedAt < MANIFEST_CACHE_DURATION
  ) {
    return cachedManifest;
  }

  const response = await fetch(
    `${OTA_MANIFEST_URL}?t=${now}`
  );

  if (!response.ok) {
    throw new Error(
      `Failed to fetch OTA manifest: ${response.status}`
    );
  }

  const manifest = await response.json();

  if (
    !manifest.version ||
    !manifest.url ||
    !manifest.checksum
  ) {
    throw new Error("Invalid OTA manifest");
  }

  if (!semver.valid(manifest.version)) {
    throw new Error(
      `Invalid OTA version: ${manifest.version}`
    );
  }

  cachedManifest = manifest;
  manifestFetchedAt = now;

  return manifest;
};

const checkForUpdate = async (req, res) => {
  try {
    const {
      app_id,
      platform,
      version_name,
      version_build,
      plugin_version,
    } = req.body || {};

    console.log("📦 OTA update check:", {
      app_id,
      platform,
      version_name,
      version_build,
      plugin_version,
    });

    // Only Android for now
    if (platform && platform !== "android") {
      return res.json({
        version: "",
        url: "",
      });
    }

    // Only MoBoxd
    if (
      app_id &&
      app_id !== "com.moboxd.app"
    ) {
      return res.json({
        version: "",
        url: "",
      });
    }

    const currentVersion =
      version_name &&
      version_name !== "builtin" &&
      semver.valid(version_name)
        ? version_name
        : "1.0.0";

    const latest = await getLatestManifest();

    // Already up to date
    if (
      semver.gte(
        currentVersion,
        latest.version
      )
    ) {
      console.log(
        `📦 No OTA update: ${currentVersion}`
      );

      return res.json({
        version: "",
        url: "",
      });
    }

    console.log(
      `📦 OTA update available: ${currentVersion} → ${latest.version}`
    );

    return res.json({
      version: latest.version,
      url: latest.url,
      checksum: latest.checksum,
    });

  } catch (error) {
    console.error(
      "❌ OTA update check failed:",
      error
    );

    return res.status(500).json({
      message: "Failed to check for updates",
    });
  }
};

module.exports = {
  checkForUpdate,
};