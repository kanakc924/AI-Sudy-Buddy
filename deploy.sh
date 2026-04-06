#!/bin/bash

echo "🔍 Checking status..."
git status

echo -n "❓ Do you want to proceed with staging and pushing? (y/n): "
read proceed

if [ "$proceed" != "y" ]; then
    echo "❌ Push aborted."
    exit 1
fi

# 1. Ensure we are on main
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" == "master" ]; then
    echo "🔄 Renaming 'master' to 'main'..."
    git branch -M main
fi

# 2. Stage All
echo "📂 Staging all changes..."
git add .

# 3. Commit
echo "💾 Committing changes..."
echo -n "Enter commit message: "
read commit_message
if [ -z "$commit_message" ]; then
  commit_message="Update: Sync repository changes"
fi
git commit -m "$commit_message"

# 4. Push
echo "🚀 Pushing to GitHub main branch..."
git push -u origin main

echo "✅ Successfully pushed to main!"
