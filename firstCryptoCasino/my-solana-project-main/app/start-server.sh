#!/bin/bash
cd "$(dirname "$0")"
source ~/.nvm/nvm.sh 2>/dev/null || true
nvm use default 2>/dev/null || true

echo "Installing dependencies..."
npm install

echo "Starting dev server..."
npm run dev
