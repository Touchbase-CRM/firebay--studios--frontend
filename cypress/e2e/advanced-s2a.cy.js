describe("Next.js App Workflow", () => {
  beforeEach(() => {
    // Log in before each test
    cy.visit("http://localhost:3000");
    cy.get('input[type="email"]').type(Cypress.env("user_email"));
    cy.get('input[type="password"]').type(Cypress.env("user_password"));
    cy.get("button").contains("Login").click();
  });

  it("should navigate to the home page and edit cypress--adv--s2a spot", () => {
    // Navigate to home page
    cy.visit("http://localhost:3000/home");

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
  });
});
