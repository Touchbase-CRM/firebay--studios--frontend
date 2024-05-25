describe("Next.js App Workflow", () => {
  it("should log in, navigate to the home page, edit cypress--adv--s2a spot, and generate voice with enhancements", () => {
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
    cy.wait(5000); // Adjust the wait time as necessary

    // Click the "History" button
    cy.contains("span", "History").click();

    // Verify that the "Read 2" button exists
    cy.get("button.accordion-button").contains("Read 2").should("exist");
  });
});
