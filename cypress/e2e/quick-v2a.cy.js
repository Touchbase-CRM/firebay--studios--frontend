describe("Create quick v2a spot workflow", () => {
  it("should log in, navigate to the home page, edit cypress--quick--v2a spot, generate voice with enhancements, finalize, add music, and return home", () => {
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
      "cypress--quick--v2a"
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
      "/options/quick?spotName=cypress--quick--v2a&option=quick"
    );

    // Click on the "Get Started" button for the advanced mode
    cy.get("div")
      .contains("Voice to Ad")
      .parent()
      .within(() => {
        cy.get("a").contains("Get Started").click();
      });

    // Verify navigation to the advanced mode page
    cy.url().should("include", "/quick-mode/voice-to-ad/create-ad");

    // Click on the record button
    cy.get('div[data-testid="audio_recorder"]').click();

    // Wait for 30 milliseconds
    cy.wait(30);

    // Click on the stop button
    cy.get('img[data-testid="ar_mic"][title="Save recording"]').click();

    // Verify that the audio file is added
    cy.get("div")
      .filter((index, element) => {
        const style = element.style;
        return (
          style.position === "relative" &&
          style.border === "1px solid rgb(235, 99, 28)" &&
          style.borderRadius === "4px" &&
          style.padding === "30px 10px 10px" &&
          style.display === "flex" &&
          style.justifyContent === "space-between" &&
          style.alignItems === "center" &&
          style.maxWidth === "400px" &&
          style.margin === "10px 0px" &&
          style.backgroundColor === "rgb(249, 249, 249)"
        );
      })
      .should("exist")
      .within(() => {
        cy.get("button")
          .filter((index, button) => {
            return (
              button.style.position === "absolute" &&
              button.style.top === "5px" &&
              button.style.right === "5px" &&
              button.style.border === "none" &&
              button.style.background === "transparent" &&
              button.style.cursor === "pointer" &&
              button.style.fontSize === "20px" &&
              button.style.color === "rgb(235, 99, 28)" &&
              button.style.lineHeight === "1" &&
              button.style.padding === "0px" &&
              button.textContent.trim() === "×"
            );
          })
          .should("exist");

        cy.get("div")
          .filter((index, div) => {
            const style = div.style;
            return (
              style.flex === "1 1 auto" &&
              div.querySelector("div").style.fontWeight === "bold" &&
              div.querySelector("div").style.marginBottom === "4px" &&
              div.querySelector("div").textContent.trim() === "AddedAudio.mp3"
            );
          })
          .should("exist");

        cy.get("div")
          .filter((index, div) => {
            const style = div.style;
            return (
              style.flex === "0 0 auto" &&
              div.querySelector("button").style.border === "none" &&
              div.querySelector("button").style.background === "transparent" &&
              div.querySelector("button").style.cursor === "pointer" &&
              div.querySelector("i").classList.contains("bi-play-fill") &&
              div.querySelector("i").style.color === "rgb(235, 99, 28)" &&
              div.querySelector("i").style.fontSize === "24px"
            );
          })
          .should("exist");
      });
  });
});
