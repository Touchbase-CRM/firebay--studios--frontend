describe("Edit advanced s2a spot workflow", () => {
  const SPOT_NAME = "cypress--adv--s2a";

  it("logs in, edits the spot, generates voices, stitches, and reaches the export panel", () => {
    cy.visit("http://localhost:3000");

    // Login
    cy.get('input[type="email"]').type(Cypress.env("user_email"));
    cy.get('input[type="password"]').type(Cypress.env("user_password"));
    cy.contains("button", "Sign in").click();
    cy.url().should("not.include", "/login");

    // Click the spot row — row click is the edit affordance now
    cy.get(`[data-cy="spot-row"][data-cy-spot-name="${SPOT_NAME}"]`).click();

    cy.url().should(
      "match",
      /\/advanced-mode\/script-to-ad\/process-section\/0$/
    );

    // Generate the first take
    cy.contains("button", "Generate voice").click();

    // Audio bar appears once generation completes (real backend timing)
    cy.get("audio", { timeout: 30000 })
      .should("have.attr", "src")
      .and("match", /^blob:http:\/\/localhost:3000\/.+/);

    // Toggle Dragon's breath via the new inspector
    cy.get('[data-cy="dragons-breath-toggle"] input[type="checkbox"]').check({
      force: true,
    });

    // Re-generate (button label flips after first generation)
    cy.contains("button", /Re-generate/i).click();
    cy.get("audio", { timeout: 30000 })
      .should("have.attr", "src")
      .and("match", /^blob:http:\/\/localhost:3000\/.+/);

    // Advance to the next section
    cy.contains("button", /Next section/i).click();
    cy.url().should(
      "match",
      /\/advanced-mode\/script-to-ad\/process-section\/1$/
    );

    // Generate take for section 2
    cy.contains("button", "Generate voice").click();
    cy.get("audio", { timeout: 30000 })
      .should("have.attr", "src")
      .and("match", /^blob:http:\/\/localhost:3000\/.+/);

    // Continue to stitch (last section's primary CTA)
    cy.contains("button", /Continue to stitch/i).click();
    cy.url().should("include", "/advanced-mode/script-to-ad/stitch-sections");

    // Kick off the stitch
    cy.contains("button", "Stitch sections").click();

    // After stitching, the inline Export panel shows up
    cy.contains("Export your spot", { timeout: 60000 }).should("be.visible");
    cy.contains("Stitched").should("be.visible");

    // The fixed-bottom audio player should be playing the final cut
    cy.contains("Now playing").should("be.visible");
    cy.contains(/Final cut/i).should("be.visible");

    // Download button is present and the file-name input has a default value
    cy.get('input').filter('[type="text"]').last().should("have.value", /./);
    cy.contains("button", "Download").should("be.visible");
  });
});
