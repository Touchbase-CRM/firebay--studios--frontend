describe("Create advanced s2a spot workflow", () => {
  const SPOT_NAME = "cypress--adv--s2a";

  it("logs in, creates a new spot, writes a script, and saves", () => {
    cy.visit("http://localhost:3000");

    // Login screen — new copy + button
    cy.get('input[type="email"]').type(Cypress.env("user_email"));
    cy.get('input[type="password"]').type(Cypress.env("user_password"));
    cy.contains("button", "Sign in").click();

    cy.url().should("not.include", "/login");
    cy.url().should("include", "/home");

    // Open the create-spot modal
    cy.contains("button", "New spot").click();

    // Name the spot and continue — no mode picker anymore
    cy.get('input[placeholder*="Acme"]').type(SPOT_NAME);
    cy.contains("button", "Continue").click();

    // Lands directly on the script step
    cy.url().should("include", "/advanced-mode/script-to-ad/create-sections");

    // Write a two-section script
    cy.get("textarea").type("cypress//test");

    cy.contains("button", "Continue").click();

    // Lands on the section editor
    cy.url().should("include", "/advanced-mode/script-to-ad/process-section/0");

    // Save the section state — feedback flips to "Saved"
    cy.contains("button", "Save").click();
    cy.contains("button", "Saved").should("be.visible");
  });
});
