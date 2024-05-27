#!/bin/bash

# Define the list of spec files in the desired order
spec_files=(
  "cypress/e2e/advanced-s2a-create-spot.cy.js"
  "cypress/e2e/advanced-s2a-edit-spot.cy.js"
  "cypress/e2e/quick-s2a.cy.js"
  "cypress/e2e/quick-v2a.cy.js"
  "cypress/e2e/delete-test-projects.cy.js"
)

# Run Cypress for each spec file in the specified order
for spec in "${spec_files[@]}"; do
  echo "Running Cypress test: $spec"
  npx cypress run --spec "$spec" --browser chrome

  # Check if the last command was successful
  if [ $? -ne 0 ]; then
    echo "Test failed: $spec"
    exit 1
  fi

done

echo "All tests ran successfully."
