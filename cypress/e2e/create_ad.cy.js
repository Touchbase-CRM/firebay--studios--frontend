// createAd.spec.js

// Helper function to perform login
const performLogin = () => {
  cy.visit('http://localhost:3000');
  cy.get('input[type="email"]').type(Cypress.env('user_email'));
  cy.get('input[type="password"]').type(Cypress.env('user_password'));
  cy.get('button').contains('Login').click();
};

describe('Navigation Tests', () => {
  beforeEach(() => {
      performLogin();
      cy.visit('http://localhost:3000/create_ad');
  });

  it('should redirect to /login when Logout is clicked', () => {
      cy.get('button').contains('Logout').click();
      cy.url().should('include', '/login');
  });
});

describe('Form Interactivity and UI Tests', () => {
  beforeEach(() => {
      performLogin();
      cy.visit('http://localhost:3000/create_ad');
  });

  it('should toggle ad length and update char limit', () => {
      cy.get('select[aria-label="Ad length select"]').select('60 seconds');
      cy.get('textarea').should('have.attr', 'placeholder', 'Enter your script here (up to 897 characters)');
  });

  it('should input and display script', () => {
    const sampleScript = 'Sample script';

    // Input the script into the textarea
    cy.get('textarea#script').type(sampleScript);

    // Verify the character count
    const expectedCount = sampleScript.length;

    cy.get('div[style*="position:absolute;"]').invoke('text').should('match', new RegExp(`^${expectedCount}\\/441$`));
});









  it('should list all voices and allow selection', () => {
      cy.get('select[aria-label="Voice select"]').select('Zoe');
      cy.get('select[aria-label="Voice select"]').should('have.value', 'cBijDV6IOSWp9c8dA7Xn');
  });
});

describe('Form Validation and Behavior Tests', () => {
  beforeEach(() => {
      performLogin();
      cy.visit('http://localhost:3000/create_ad');
  });

  it('should show an alert for empty script', () => {
    cy.get('button[type="submit"]').click();
    cy.get('.swal2-popup').should('contain', 'You cannot have an empty script!');
});


  it('should show an alert for scripts longer than allowed', () => {
      const longScript = 'a'.repeat(1000);  // Some length greater than max allowed
      cy.get('textarea').type(longScript);
    cy.get('button[type="submit"]').click();
    cy.get('.swal2-popup').should('contain', 'You have too many characters!');
  });

  it('should redirect to /add_music with query parameters for valid input', () => {
      cy.get('textarea').type('Valid script');
      cy.get('button[type="submit"]').click();
      cy.url().should('include', '/add_music');
  });
});

describe('General Layout and Styling Tests', () => {
  beforeEach(() => {
      performLogin();
      cy.visit('http://localhost:3000/create_ad');
  });

  it('should display Firebay Studios logo in the Navbar', () => {
      cy.get('img[alt="Firebay Studios"]').should('be.visible');
  });

  it('should have a centered Card with Voice Settings title', () => {
      cy.get('.card').should('have.class', 'bg-dark');
      cy.get('h2').should('contain', 'Voice Settings');
  });
});
