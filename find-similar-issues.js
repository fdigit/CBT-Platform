/**
 * Script to identify files that might have similar JSON parsing issues
 * This helps prevent the same error from occurring in other components
 */

const fs = require('fs');
const path = require('path');

console.log('=================================================');
console.log('Scanning for Potential Similar Issues');
console.log('=================================================\n');

const problematicPatterns = [
  {
    pattern: /await response\.json\(\)/,
    name: 'Unprotected response.json() call',
    severity: 'High',
    suggestion: 'Wrap in try-catch to handle parsing errors'
  }
];

const componentsDir = path.join(__dirname, 'src', 'components');
const appDir = path.join(__dirname, 'src', 'app');

let filesWithIssues = [];

function scanFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const issues = [];
    
    problematicPatterns.forEach(({ pattern, name, severity, suggestion }) => {
      const lines = content.split('\n');
      lines.forEach((line, index) => {
        if (pattern.test(line)) {
          // Check if it's wrapped in try-catch (simple heuristic)
          const contextStart = Math.max(0, index - 5);
          const contextEnd = Math.min(lines.length, index + 5);
          const context = lines.slice(contextStart, contextEnd).join('\n');
          
          if (!context.includes('try') || !context.includes('catch')) {
            issues.push({
              line: index + 1,
              name,
              severity,
              suggestion,
              code: line.trim()
            });
          }
        }
      });
    });
    
    if (issues.length > 0) {
      filesWithIssues.push({ filePath, issues });
    }
  } catch (error) {
    // Skip files that can't be read
  }
}

function scanDirectory(dir) {
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    
    entries.forEach(entry => {
      const fullPath = path.join(dir, entry.name);
      
      if (entry.isDirectory()) {
        scanDirectory(fullPath);
      } else if (entry.isFile() && (entry.name.endsWith('.tsx') || entry.name.endsWith('.ts'))) {
        scanFile(fullPath);
      }
    });
  } catch (error) {
    // Skip directories that can't be read
  }
}

console.log('Scanning components directory...');
scanDirectory(componentsDir);

console.log('Scanning app directory...');
scanDirectory(appDir);

console.log('\n=================================================');
console.log(`Found ${filesWithIssues.length} files with potential issues`);
console.log('=================================================\n');

if (filesWithIssues.length === 0) {
  console.log('✅ No issues found! All response.json() calls appear to be protected.\n');
} else {
  filesWithIssues.slice(0, 10).forEach(({ filePath, issues }) => {
    const relativePath = path.relative(__dirname, filePath);
    console.log(`📄 ${relativePath}`);
    issues.forEach(({ line, name, severity, suggestion, code }) => {
      console.log(`   Line ${line} [${severity}]: ${name}`);
      console.log(`   Code: ${code}`);
      console.log(`   💡 ${suggestion}\n`);
    });
  });
  
  if (filesWithIssues.length > 10) {
    console.log(`... and ${filesWithIssues.length - 10} more files\n`);
  }
  
  console.log('=================================================');
  console.log('Recommended Action:');
  console.log('=================================================\n');
  console.log('Apply similar fixes to these files:');
  console.log('1. Wrap response.json() in try-catch');
  console.log('2. Add proper error handling');
  console.log('3. Log parsing errors for debugging\n');
  console.log('Example fix:');
  console.log('```typescript');
  console.log('let data;');
  console.log('try {');
  console.log('  data = await response.json();');
  console.log('} catch (jsonError) {');
  console.log('  console.error("Failed to parse JSON:", jsonError);');
  console.log('  throw new Error("Invalid response from server");');
  console.log('}');
  console.log('```\n');
}

console.log('Note: This is a simple heuristic scan.');
console.log('Some files may already have proper error handling.');
console.log('Review each file individually before making changes.\n');

