describe("Edit advanced s2a spot workflow", () => {
  it("should log in, navigate to the home page, edit cypress--adv--s2a spot, generate voice with enhancements, finalize, and add music", () => {
    // Log in to the application
    cy.visit("http://localhost:3000");
    cy.get('input[type="email"]').type(Cypress.env("user_email"));
    cy.get('input[type="password"]').type(Cypress.env("user_password"));
    cy.get("button").contains("Login").click();

    // Ensure the login was successful
    cy.url().should("not.include", "/login");

    // Click the edit button for the cypress--adv--s2a spot
    cy.get("td")
      .contains("cypress--adv--s2a")
      .parent("tr")
      .find('button[title="Edit Spot"]')
      .click();

    // Verify that it navigates to the correct URL
    cy.url().should(
      "eq",
      "http://localhost:3000/advanced-mode/script-to-ad/process-section/0"
    );

    // Click the "Generate Voice" button
    cy.get("button").contains("Generate Voice").click();

    cy.wait(2900); // Adjust the wait time as necessary

    // Wait for the audio player to appear
    cy.get('div[role="group"] audio')
      .should("have.attr", "src")
      .then((src) => {
        // Verify that the audio src is a blob URL
        expect(src).to.match(/^blob:http:\/\/localhost:3000\/.+/);
      });

    // Enable the "Dragon's Breath" checkbox
    cy.get('input[type="checkbox"][id="dragonBreathEnhancementSwitch"]').check({
      force: true,
    });

    // Click the "Generate Voice" button again
    cy.get("button").contains("Generate Voice").click();

    // Wait for the new audio player to appear
    cy.get('div[role="group"] audio')
      .should("have.attr", "src")
      .then((src) => {
        // Verify that the new audio src is a blob URL
        expect(src).to.match(/^blob:http:\/\/localhost:3000\/.+/);
      });

    // Wait for some time to ensure the second audio generation is complete
    cy.wait(9000); // Adjust the wait time as necessary

    // Click the "Next" button
    cy.get("button.btn.btn-primary").contains("Next").click();

    // Wait for the transition to happen
    cy.wait(300);

    // Verify that it navigates to the correct URL
    cy.url().should(
      "eq",
      "http://localhost:3000/advanced-mode/script-to-ad/process-section/1"
    );

    // Click the "Generate Voice" button
    cy.get("button").contains("Generate Voice").click();

    // Wait for the new audio player to appear
    cy.get('div[role="group"] audio')
      .should("have.attr", "src")
      .then((src) => {
        // Verify that the new audio src is a blob URL
        expect(src).to.match(/^blob:http:\/\/localhost:3000\/.+/);
      });

    // Wait for some time to ensure the second audio generation is complete
    cy.wait(5000); // Adjust the wait time as necessary

    // Click the "Next" button
    cy.get("button.btn.btn-primary").contains("Next").click();

    // Wait for the transition to happen
    cy.wait(300);

    // Verify that it navigates to the correct URL
    cy.url().should(
      "eq",
      "http://localhost:3000/advanced-mode/script-to-ad/stitch-sections"
    );

    // Click the "Finalize" button
    cy.get("button.btn.btn-primary").contains("Finalize").click();

    // Wait for the audio player to appear with the finalized audio
    cy.get('div[role="group"] audio')
      .should("have.attr", "src")
      .then((src) => {
        // Verify that the finalized audio src is a blob URL
        expect(src).to.match(/^blob:http:\/\/localhost:3000\/.+/);
      });

    // Verify that the download link appears and has the correct URL
    cy.get('a[title="Download"]')
      .should("have.attr", "href")
      .and("match", /^blob:http:\/\/localhost:3000\/.+/);

    // Verify that the "Now playing: Final Cut" text appears
    cy.get("span").contains("Now playing: Final Cut").should("be.visible");

    // Click the "Next" button to navigate to the add music page
    cy.get("button.btn.btn-primary").contains("Next").click();

    // Verify that it navigates to the correct URL
    cy.url().should("eq", "http://localhost:3000/add-music");

    // Click the "Submit" button
    cy.get("button.btn.btn-primary").contains("Submit").click();

    // Wait for the output to process
    cy.wait(5000);

    // Verify that there is a new blob audio player
    cy.get('div[role="group"] audio')
      .should("have.attr", "src")
      .then((src) => {
        // Verify that the audio src is a blob URL
        expect(src).to.match(/^blob:http:\/\/localhost:3000\/.+/);
      });

    // Verify that the "Now playing:" text appears
    cy.get("span").contains("Now playing:").should("be.visible");
  });
});
