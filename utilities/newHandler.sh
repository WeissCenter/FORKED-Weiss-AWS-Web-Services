#!/bin/bash

# Check if the folder name is provided as an argument
if [ -z "$1" ]; then
    echo "Usage: $0 <folder-name>"
    exit 1
fi

# Check if the folder already exists
if [ -d "./lib/handlers/$1" ]; then
    echo "Folder './lib/handlers/$1' already exists."
    exit 1
fi

# Create the new folder in the ./lib/handlers directory
mkdir -p "./lib/handlers/$1"


# Confirm the folder creation
if [ $? -eq 0 ]; then
    echo "Folder './lib/handlers/$1' created successfully."
    cd "./lib/handlers/$1" || exit 1
    npm init -y
    if [[ "$OSTYPE" == "darwin"* ]]; then
        sed -i '' "s/\"main\": \"index.js\"/\"main\": \"$1.ts\"/" package.json
    else
    # For Linux and GNU sed, this works without the empty backup extension
        sed -i "s/\"main\": \"index.js\"/\"main\": \"$1.ts\"/" package.json
    fi

    # copy the template file to the new folder
    typescriptCode=$(cat <<-EOF
import { APIGatewayEvent, Context, Handler } from "aws-lambda";
import {
  CreateBackendResponse,
  CreateBackendErrorResponse,
} from "../../../libs/types/src";

// Define Environment Variables

// AWS SDK Clients


export const handler: Handler = async (
  event: APIGatewayEvent,
  context: Context
) => {
  try {
    console.log(event);

    return CreateBackendResponse(200);
  } catch (err) {
    return CreateBackendErrorResponse(500, "Internal Server Error");
  }
};
EOF
    )

    echo "$typescriptCode" > "$1.ts"
else
    echo "Failed to create folder './lib/handlers/$1'."
    exit 1
fi

cd ../../.. || exit 1