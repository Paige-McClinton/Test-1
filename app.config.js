// Extends app.json. When building for GitHub Pages, the site lives at
// https://<user>.github.io/<repo>/, so the build sets EXPO_BASE_URL=/<repo>.
// Locally it's unset and the app runs at the root as usual.
module.exports = ({ config }) => ({
  ...config,
  web: { ...(config.web || {}), output: 'single', bundler: 'metro' },
  experiments: {
    ...(config.experiments || {}),
    ...(process.env.EXPO_BASE_URL ? { baseUrl: process.env.EXPO_BASE_URL } : {}),
  },
});
