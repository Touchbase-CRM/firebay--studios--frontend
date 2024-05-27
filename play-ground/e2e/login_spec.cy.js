describe('Firebay Studios Login', function() {
  // This runs before each test
  beforeEach(function() {
    // Navigate to the login page
    cy.visit('http://localhost:3000');
  });

  it('should display the login form', function() {
    cy.get('input[type="email"]').should('be.visible');
    cy.get('input[type="password"]').should('be.visible');
    cy.get('button').contains('Login').should('be.visible');
  });

  it('should display an error for empty email and password', function() {
    cy.get('button').contains('Login').click();
    // You would check for a validation error message here (depending on your implementation)
    cy.contains('Please enter your login and password!').should('be.visible');
  });

  it('should display an error for incorrect credentials', function() {
    cy.get('input[type="email"]').type('wrongemail@example.com');
    cy.get('input[type="password"]').type('wrongpassword');
    cy.get('button').contains('Login').click();
    // You would check for an error message that says credentials are incorrect
    cy.contains('User not found, please sign in').should('be.visible'); // Adjust this based on your error message
  });

  it('should log in successfully with correct credentials', function() {
    cy.get('input[type="email"]').type(Cypress.env('user_email'));
    cy.get('input[type="password"]').type(Cypress.env('user_password'));
    cy.get('button').contains('Login').click();
    cy.url().should('include', 'create_ad');
  });

  it('should show warning when trying to reset password without entering email', function() {
    cy.get('a').contains('Forgot password?').click();
    cy.get('body').should('contain', 'Please enter an email address.');
  });

  it('should send password reset email when email is provided', function() {
    cy.get('input[type="email"]').type('testemail@example.com');
    cy.get('a').contains('Forgot password?').click();
    cy.get('body').should('contain', 'Password reset email sent. Please check your email.');
  });

  it('should have a Sign Up link and be clickable', function() {
    cy.get('a').then(($a) => {
      console.log($a);
    });
    cy.get('a').contains('Sign Up').click();
    cy.url().should('include', '/signup'); // Assuming the signup page URL is '/signup'
  });

  // ... Add more tests as needed
});
