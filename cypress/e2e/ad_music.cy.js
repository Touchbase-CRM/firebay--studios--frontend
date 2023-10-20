const timeLimit = 60000;
// describe('Ad Creation Flow basic functionality', () => {
//   beforeEach(() => {
//     // Log in before each test
//     cy.visit('http://localhost:3000');
//     cy.get('input[type="email"]').type(Cypress.env('user_email'));
//     cy.get('input[type="password"]').type(Cypress.env('user_password'));
//     cy.get('button').contains('Login').click();
//   });

//   it('should go through create_ad to add_music flow with randomized input', () => {
//     // Visit the create_ad page
//     cy.visit('http://localhost:3000/create_ad');
//     //ad length
//     cy.get('select[aria-label="Ad length select"]').select('30 seconds');

//     // Provide input for the script
//     cy.get('textarea').type('Sample advertisement script.');

//     // Randomly select a voice
//     cy.get('select#voice')  // Using the ID selector for specificity
//       .find('option')
//       .then(options => {
//         const randomIndex = Math.floor(Math.random() * options.length);
//         cy.get('select#voice').select(options[randomIndex].value);
//       });


//     // Submit the create_ad form
//     cy.get('button').contains('Submit').click();

//     // Ensure we're navigated to the add_music page
//     cy.url().should('include', '/add_music');

//     // Randomly select a genre
//     cy.get('select#genre')  // Using the ID selector for specificity
//       .find('option')
//       .then(options => {
//         const randomIndex = Math.floor(Math.random() * options.length);
//         cy.get('select#genre').select(options[randomIndex].value);
//       });

//     // Record the time before submitting the form
//     const startTime = new Date().getTime();


//     // Submit the form on the add_music page
//     cy.get('Button[type="submit"]').click();

//     // Validate that we're navigated to the download page
//     cy.url({ timeout: timeLimit }).should('include', '/download').then(() => {
//       const endTime = new Date().getTime();
//       const elapsedTime = (endTime - startTime) / 1000;  // in seconds
//       cy.log(`Time taken to navigate to the download page: ${elapsedTime} seconds`);
//     });
//   });
// });

// describe('Stress Testing', () => {
//   beforeEach(() => {
//     // Log in before each test
//     cy.visit('http://localhost:3000');
//     cy.get('input[type="email"]').type(Cypress.env('user_email'));
//     cy.get('input[type="password"]').type(Cypress.env('user_password'));
//     cy.get('button').contains('Login').click();
//   });

//   it('should stress test create_ad to add_music flow with max chars', () => {
//     // Visit the create_ad page
//     cy.visit('http://localhost:3000/create_ad');
//     // ad length 
//     cy.get('select[aria-label="Ad length select"]').select('60 seconds');

//     // Calculate the maximum number of characters allowed
//     const CHARACTERSPERSEC = 15.2;
//     const CHACRACTEROVERFLOWTHRESHOLD = 15;
//     const adLength = 60;  // Default ad length from your provided code
//     var charLimit = Math.round(adLength * CHARACTERSPERSEC) - CHACRACTEROVERFLOWTHRESHOLD;
//     const maxCharsScript = 'A'.repeat(charLimit);  // Generate a string with max characters

//     // Provide input for the script with max characters
//     cy.get('textarea').type(maxCharsScript);

//     // Randomly select a voice
//     cy.get('select#voice')
//       .find('option')
//       .then(options => {
//         const randomIndex = Math.floor(Math.random() * options.length);
//         cy.get('select#voice').select(options[randomIndex].value);
//       });

//     // Submit the create_ad form
//     cy.get('button').contains('Submit').click();

//     // Ensure we're navigated to the add_music page
//     cy.url().should('include', '/add_music');

//     // Randomly select a genre
//     cy.get('select#genre')
//       .find('option')
//       .then(options => {
//         const randomIndex = Math.floor(Math.random() * options.length);
//         cy.get('select#genre').select(options[randomIndex].value);
//       });

//     // Record the time before submitting the form
//     const startTime = new Date().getTime();

//     // Submit the form on the add_music page
//     cy.get('Button[type="submit"]').click();

//     // Validate that we're navigated to the download page
//     cy.url({ timeout: timeLimit }).should('include', '/download').then(() => {
//       const endTime = new Date().getTime();
//       const elapsedTime = (endTime - startTime) / 1000;  // in seconds
//       cy.log(`Time taken to navigate to the download page: ${elapsedTime} seconds`);
//     });
//   });
// });

describe('Loading Screen Button Tests', () => {
  beforeEach(() => {
    // Log in before each test
    cy.visit('http://localhost:3000');
    cy.get('input[type="email"]').type(Cypress.env('user_email'));
    cy.get('input[type="password"]').type(Cypress.env('user_password'));
    cy.get('button').contains('Login').click();
    
    // Navigate to the loading screen for each test
    cy.visit('http://localhost:3000/create_ad');
    //ad length
    cy.get('select[aria-label="Ad length select"]').select('30 seconds');

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

    

  });

  it('should handle "Cancel and Start Over" button correctly', () => {


    // Record the time before submitting the form
    const startTime = new Date().getTime();


    // Submit the form on the add_music page
    cy.get('Button[type="submit"]').click();

        // Click "Cancel and Resubmit" button
        cy.get('Button').contains('Cancel and Resubmit').click();

        // Click "Okay" on the SweetAlert modal
        cy.get('button').contains('OK').click();
    
        // Validate that we're navigated back to the add_music page 
        cy.url().should('include', '/add_music');

            // Submit the form on the add_music page
    cy.get('Button[type="submit"]').click();

    

    // Validate that we're navigated to the download page
    cy.url({ timeout: timeLimit }).should('include', '/download').then(() => {
      const endTime = new Date().getTime();
      const elapsedTime = (endTime - startTime) / 1000;  // in seconds
      cy.log(`Time taken to navigate to the download page: ${elapsedTime} seconds`);
    });
    
  });


  it('should handle "Cancel and redo" button correctly', () => {

    // Submit the form on the add_music page
    cy.get('Button[type="submit"]').click();



    
    // Click "Cancel and Start Over" button
    cy.get('Button').contains('Cancel and Start Over').click();

    // Click "Okay" on the SweetAlert modal
    cy.get('button').contains('OK').click();

    // Validate that we're navigated back to the create_ad page
    cy.url().should('include', '/create_ad');
  });

});

