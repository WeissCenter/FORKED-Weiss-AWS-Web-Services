#!/bin/bash

# Directory containing TypeScript files
DIRECTORY="/Users/aarondyke/Code/Weiss/adapt/apps/adapt-admin-infrastructure/src/providers/aws/handlers"

# Loop through all .ts files in the directory
for file in "$DIRECTORY"/*.ts; 
do
    # Extract the file name without the extension
    filename=$(basename -- "$file")
    name="${filename%.*}"
    
    # Run the newHandler.sh script with the name as a parameter
    ./utilities/newHandler.sh "$name"
    # wait for user input
    read -p "Press enter to continue"
done