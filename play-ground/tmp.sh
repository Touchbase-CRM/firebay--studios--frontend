#!/bin/bash

# Define the directory path and file name
dir_path="src/stories/advanced-mode/script-to-ad/process-section"
file_name="[idx].stories.js"

# Create the directory structure if it doesn't exist
mkdir -p "$dir_path"

# Create the .stories.js file in the specified directory
touch "$dir_path/$file_name"

echo "File '$file_name' created in '$dir_path'."
