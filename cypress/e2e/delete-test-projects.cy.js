describe("Delete all the created spots for cypress tests.", () => {
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
      .find('button[title="Delete Spot"]')
      .click();

    // Handle SweetAlert confirmation dialog
    cy.get(".swal2-confirm").click();

    // Ensure the spot is deleted (you may need to add your specific assertion here)
    // For example, check that the spot no longer appears in the list
    cy.get("td").contains("cypress--adv--s2a").should("not.exist");

    // Click the edit button for the cypress--quick--s2a spot
    cy.get("td")
      .contains("cypress--quick--s2a")
      .parent("tr")
      .find('button[title="Delete Spot"]')
      .click();

    // Handle SweetAlert confirmation dialog
    cy.get(".swal2-confirm").click();

    // Ensure the spot is deleted (you may need to add your specific assertion here)
    // For example, check that the spot no longer appears in the list
    cy.get("td").contains("cypress--quick--s2a").should("not.exist");

    // Click the edit button for the cypress--quick--v2a spot
    cy.get("td")
      .contains("cypress--quick--v2a")
      .parent("tr")
      .find('button[title="Delete Spot"]')
      .click();

    // Handle SweetAlert confirmation dialog
    cy.get(".swal2-confirm").click();

    // Ensure the spot is deleted (you may need to add your specific assertion here)
    // For example, check that the spot no longer appears in the list
    cy.get("td").contains("cypress--quick--v2a").should("not.exist");
  });
});
