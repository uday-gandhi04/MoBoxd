const semver = require("semver");

const CURRENT_OTA_VERSION = "1.0.1";

const OTA_URL =
  "https://github.com/uday-gandhi04/MoBoxd/releases/download/v1.0.1/com.moboxd.app_1.0.1.zip";

const OTA_CHECKSUM =
  "bc77f1efe29a84f4803a367b4993047552db815184a5e78712b056654b04788c";

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

    // Only serve Android OTA updates for now
    if (platform !== "android") {
      return res.json({
        message: "No update available",
        version: "",
        url: "",
      });
    }

    // Only our MoBoxd app
    if (app_id && app_id !== "com.moboxd.app") {
      return res.json({
        message: "No update available",
        version: "",
        url: "",
      });
    }

    // Capgo may report "builtin" in some cases.
    // Treat that as the currently installed native bundle.
    const currentVersion =
      version_name && version_name !== "builtin"
        ? version_name
        : "1.0.0";

    // Don't downgrade.
    if (
      semver.valid(currentVersion) &&
      semver.gte(currentVersion, CURRENT_OTA_VERSION)
    ) {
      return res.json({
        message: "No update available",
        version: "",
        url: "",
      });
    }

    console.log(
      `📦 OTA update available: ${currentVersion} → ${CURRENT_OTA_VERSION}`
    );

    return res.json({
      version: CURRENT_OTA_VERSION,
      url: OTA_URL,
      checksum: OTA_CHECKSUM,
    });
  } catch (error) {
    console.error("❌ OTA update check failed:", error);

    return res.status(500).json({
      message: "Failed to check for updates",
      error: "UPDATE_CHECK_FAILED",
    });
  }
};

module.exports = {
  checkForUpdate,
};