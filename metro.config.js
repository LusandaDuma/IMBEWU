const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

// Stub out OpenTelemetry packages — they use dynamic import() which Hermes
// cannot process, causing the Android bundle to fail at build time.
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName.startsWith('@opentelemetry/')) {
    return { type: 'empty' };
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = withNativeWind(config, { input: "./global.css" });
