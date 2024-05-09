#!/bin/bash

# Define the source and destination directories
SOURCE="src/pages"
DESTINATION="src/_pages"

# Function to copy the directory structure
copy_structure() {
    local source_dir="$1"
    local destination_dir="$2"

    # Create the destination directory if it doesn't exist
    [ ! -d "$destination_dir" ] && mkdir -p "$destination_dir"

    # Iterate over all files and directories in the source
    for item in "$source_dir"/*; do
        # Get the basename of the item
        item_name=$(basename "$item")

        # If it's a directory, copy its structure
        if [ -d "$item" ]; then
            mkdir -p "$destination_dir/$item_name"
            copy_structure "$item" "$destination_dir/$item_name"
        fi
    done
}

# Start the copying process
copy_structure "$SOURCE" "$DESTINATION"

echo "Directory structure copied from $SOURCE to $DESTINATION"
