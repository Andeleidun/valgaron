const { withAppBuildGradle } = require('expo/config-plugins');

const marker =
  '    // Embed the JavaScript bundle in debug APKs so it can run without Metro.';
const reactBlock = 'react {';

module.exports = function withEmbeddedDebugBundle(config) {
  return withAppBuildGradle(config, (updatedConfig) => {
    if (updatedConfig.modResults.language !== 'groovy') {
      throw new Error(
        'Embedded debug bundles require a Groovy Android build file.'
      );
    }

    if (!updatedConfig.modResults.contents.includes(reactBlock)) {
      throw new Error(
        'Could not find the React Native Gradle configuration block.'
      );
    }

    if (!updatedConfig.modResults.contents.includes(marker)) {
      updatedConfig.modResults.contents =
        updatedConfig.modResults.contents.replace(
          reactBlock,
          `${reactBlock}\n${marker}\n    debuggableVariants = []`
        );
    }

    return updatedConfig;
  });
};
