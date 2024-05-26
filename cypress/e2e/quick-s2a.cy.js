describe("Create quick s2a spot workflow", () => {
  it("should log in, navigate to the home page, edit cypress--adv--s2a spot, generate voice with enhancements, finalize, add music, and reach download page", () => {
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
      "cypress--quick--s2a"
    );
    cy.get("button").contains("Next").click();

    // Click on the "Get Started" button for the advanced mode
    cy.get("div")
      .contains("Quick ad")
      .parent()
      .within(() => {
        cy.get("a").contains("Get Started").click();
      });

    // Verify navigation to the advanced mode page
    cy.url().should(
      "include",
      "/options/quick?spotName=cypress--quick--s2a&option=quick"
    );

    // Click on the "Get Started" button for the advanced mode
    cy.get("div")
      .contains("Script to Ad")
      .parent()
      .within(() => {
        cy.get("a").contains("Get Started").click();
      });

    // Verify navigation to the advanced mode page
    cy.url().should("include", "/quick-mode/script-to-ad/create-ad");

    // Enter "cypress//test" as the script in the textarea
    cy.get(
      'textarea[placeholder="Enter your script here (up to 441 characters)"]'
    ).type("cypress//test");

    // Click the "Generate Voice" button
    cy.get("button").contains("Generate Voice").click();

    // Wait for the output to process
    cy.wait(20000);

    // Verify that there is a new blob audio player
    cy.get('div[role="group"] audio')
      .should("have.attr", "src")
      .then((src) => {
        // Verify that the audio src is a blob URL
        expect(src).to.match(/^blob:http:\/\/localhost:3000\/.+/);
      });

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
    // Click the "Next" button to navigate to the add music page
    cy.get("button.btn.btn-primary").contains("Next").click();

    // Verify that it navigates to the correct URL
    cy.url().should("eq", "http://localhost:3000/add-music");

    // Click the "Submit" button
    cy.get("button[type='submit']").contains("Submit").click();

    // Wait for the output to process
    cy.wait(20000);

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
