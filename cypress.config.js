const { defineConfig } = require("cypress");

module.exports = defineConfig({
  projectId: "jjnjck",
  e2e: {
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
  },
  env: {
    user_email: "kjayamanna@firebaystudios.com",
    user_password: "pasindu123",
  },
  viewportWidth: 2000,
  viewportHeight: 2000,
  component: {
    devServer: {
      framework: "next",
      bundler: "webpack",
    },
  },
  defaultCommandTimeout: 30000,
});
