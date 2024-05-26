describe("Edit advanced spot workflow", () => {
  it("should log in, navigate to the home page, edit cypress--adv--s2a spot, generate voice with enhancements, finalize, and add music", () => {
    // Log in to the application
    cy.visit("http://localhost:3000");
    cy.get('input[type="email"]').type(Cypress.env("user_email"));
    cy.get('input[type="password"]').type(Cypress.env("user_password"));
    cy.get("button").contains("Login").click();

    // Ensure the login was successful
    cy.url().should("not.include", "/login");

    // Click on "Create a new Spot" button
    cy.get("button")
      .filter(".btn.btn-warning")
      .filter((index, button) => {
        return (
          button.style.backgroundColor === "rgb(235, 99, 28)" &&
          button.style.borderColor === "rgb(235, 99, 28)" &&
          button.style.color === "white" &&
          button.textContent.trim() === "Create a new Spot"
        );
      })
      .click();

    // Ensure the modal appears and enter the spot name "cypress--adv--s2a"
    cy.get('input[placeholder="Type the Spot name here"]').type(
      "cypress--adv--s2a"
    );
    cy.get("button").contains("Next").click();

    // Click on the "Get Started" button for the advanced mode
    cy.get("div")
      .contains("Advanced ad")
      .parent()
      .within(() => {
        cy.get("a").contains("Get Started").click();
      });

    // Verify navigation to the advanced mode page
    cy.url().should("include", "/advanced-mode/script-to-ad/create-sections");
  });
});
