const { defineConfig } = require("cypress");

module.exports = defineConfig({
  e2e: {
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
  },
  env: {
    "user_email": "kjayamanna@firebaystudios.com",
    "user_password": "pasindu123"
  },
  

  component: {
    devServer: {
      framework: "next",
      bundler: "webpack",
    },
  },
});
