describe('Ad Creation Flow', () => {
  beforeEach(() => {
    // Log in before each test
    cy.visit('http://localhost:3000');
    cy.get('input[type="email"]').type(Cypress.env('user_email'));
    cy.get('input[type="password"]').type(Cypress.env('user_password'));
    cy.get('button').contains('Login').click();
  });

  it('should go through create_ad to add_music flow with randomized input', () => {
    // Visit the create_ad page
    cy.visit('http://localhost:3000/create_ad');

    // Provide input for the script
    cy.get('textarea').type('Sample advertisement script.');

    // Randomly select a voice
    cy.get('select#voice')  // Using the ID selector for specificity
      .find('option')
      .then(options => {
        const randomIndex = Math.floor(Math.random() * options.length);
        cy.get('select#voice').select(options[randomIndex].value);
      });


    // Submit the create_ad form
    cy.get('button').contains('Submit').click();

    // Ensure we're navigated to the add_music page
    cy.url().should('include', '/add_music');

    // Randomly select a genre
    cy.get('select#genre')  // Using the ID selector for specificity
      .find('option')
      .then(options => {
        const randomIndex = Math.floor(Math.random() * options.length);
        cy.get('select#genre').select(options[randomIndex].value);
      });


    // Submit the form on the add_music page
    cy.get('Button[type="submit"]').click();

    // Validate that we're navigated to the download page
    cy.url({ timeout: 10000 }).should('include', '/download');  // Waits up to 10 seconds
  });
});
