describe("Create advanced s2a spot workflow", () => {
  it("should log in, navigate to the home page, create cypress--adv--s2a spot and return home", () => {
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

    // Enter "cypress//test" as the script in the textarea
    cy.get(
      'textarea[placeholder="Enter your script here (up to 441 characters)"]'
    ).type("cypress//test");

    // Click the "Next" button
    cy.get("button")
      .filter(".mt-3.btn.btn-primary")
      .filter((index, button) => {
        return (
          button.style.backgroundColor === "rgb(235, 99, 28)" &&
          button.style.borderColor === "rgb(235, 99, 28)" &&
          button.textContent.trim() === "Next"
        );
      })
      .click();

    // Press the "Save" button
    cy.get("button.btn.btn-primary")
      .filter((index, button) => {
        return (
          button.style.width === "100px" &&
          button.style.height === "40px" &&
          button.style.backgroundColor === "white" &&
          button.style.border === "1px solid rgb(253, 169, 66)" &&
          button.style.color === "black" &&
          button.style.display === "inline-flex" &&
          button.style.justifyContent === "center" &&
          button.style.alignItems === "center" &&
          button.style.opacity === "1" &&
          button.style.marginRight === "10px" &&
          button.style.marginTop === "20px" &&
          button.textContent.trim() === "Save"
        );
      })
      .click();
    cy.wait(3000);
  });
});
