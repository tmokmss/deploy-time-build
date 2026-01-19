#!/bin/bash
set -e

# Minimum CDK version to test against
MIN_CDK_VERSION="${1:-2.38.0}"
MIN_CONSTRUCTS_VERSION="${2:-10.0.5}"

echo "=== Verifying compatibility with aws-cdk-lib@${MIN_CDK_VERSION} ==="

# Install minimum versions (this modifies package-lock.json temporarily)
# Use --legacy-peer-deps to ignore peer dependency conflicts from devDeps like @aws-cdk/integ-tests-alpha
# These conflicts are internal to this repo and not relevant to library consumers
echo "Installing minimum CDK version..."
npm install "aws-cdk-lib@${MIN_CDK_VERSION}" "constructs@${MIN_CONSTRUCTS_VERSION}" --save-dev --legacy-peer-deps

# Run jsii compilation
echo "Running JSII compilation..."
npx jsii --silence-warnings=reserved-word

# Run unit tests (without integ-runner)
echo "Running unit tests..."
npx jest --passWithNoTests

# Restore package.json and package-lock.json
echo "Restoring package files..."
git checkout package.json package-lock.json

echo "=== Minimum CDK version compatibility verified! ==="
