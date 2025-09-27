#!/usr/bin/env node

/**
 * Script to automatically fix Prettier formatting errors across the project
 * This script will format all files and can be run as part of CI/CD or manually
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing Prettier formatting errors...\n');

try {
  // Check if Prettier is installed
  execSync('npx prettier --version', { stdio: 'pipe' });
  console.log('✅ Prettier is available\n');
} catch (error) {
  console.error('❌ Prettier is not installed. Please install it first:');
  console.error('npm install --save-dev prettier\n');
  process.exit(1);
}

try {
  // Run Prettier to fix all files
  console.log('📝 Formatting all files...');
  execSync('npx prettier --write .', { stdio: 'inherit' });
  console.log('✅ All files have been formatted\n');
} catch (error) {
  console.error('❌ Error formatting files:', error.message);
  process.exit(1);
}

try {
  // Check for any remaining formatting issues
  console.log('🔍 Checking for remaining formatting issues...');
  execSync('npx prettier --check .', { stdio: 'pipe' });
  console.log('✅ No formatting issues found\n');
} catch (error) {
  console.warn('⚠️  Some files may still have formatting issues');
  console.warn(
    'Run "npx prettier --check ." to see which files need attention\n'
  );
}

// Create a .prettierignore file if it doesn't exist
const prettierIgnorePath = '.prettierignore';
if (!fs.existsSync(prettierIgnorePath)) {
  const prettierIgnoreContent = `# Dependencies
node_modules/

# Production builds
.next/
out/
dist/
build/

# Environment files
.env*

# Database
*.db
*.sqlite

# Logs
*.log

# OS generated files
.DS_Store
Thumbs.db

# IDE
.vscode/
.idea/

# Test coverage
coverage/

# Package manager
package-lock.json
yarn.lock
pnpm-lock.yaml

# Generated files
*.tsbuildinfo
`;

  fs.writeFileSync(prettierIgnorePath, prettierIgnoreContent);
  console.log('📄 Created .prettierignore file\n');
}

// Create a pre-commit hook if it doesn't exist
const gitHooksPath = '.git/hooks';
const preCommitHookPath = path.join(gitHooksPath, 'pre-commit');

if (fs.existsSync('.git') && !fs.existsSync(preCommitHookPath)) {
  const preCommitHookContent = `#!/bin/sh
# Pre-commit hook to run Prettier formatting

echo "🔧 Running Prettier formatting check..."

# Run Prettier check
npx prettier --check .

if [ $? -ne 0 ]; then
  echo "❌ Prettier formatting issues found!"
  echo "Please run 'npm run format' to fix formatting issues before committing."
  exit 1
fi

echo "✅ Prettier formatting check passed!"
`;

  if (!fs.existsSync(gitHooksPath)) {
    fs.mkdirSync(gitHooksPath, { recursive: true });
  }

  fs.writeFileSync(preCommitHookPath, preCommitHookContent);
  fs.chmodSync(preCommitHookPath, '755');
  console.log('🪝 Created pre-commit hook for automatic formatting\n');
}

console.log('🎉 Formatting setup complete!');
console.log('\n📋 Available commands:');
console.log('  npm run format        - Format all files');
console.log('  npm run format:check  - Check formatting without fixing');
console.log('  npm run lint:fix      - Fix ESLint and Prettier issues');
console.log(
  '\n💡 Tip: The pre-commit hook will automatically check formatting before each commit.'
);
