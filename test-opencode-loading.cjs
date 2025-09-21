const fs = require('fs');
const path = require('path');

// Simple YAML frontmatter parser
function parseMarkdownFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return {};
  
  const frontmatter = match[1];
  const result = {};
  
  // Simple parsing - split by lines and extract key-value pairs
  const lines = frontmatter.split('\n');
  for (const line of lines) {
    const colonIndex = line.indexOf(':');
    if (colonIndex > 0) {
      const key = line.substring(0, colonIndex).trim();
      const value = line.substring(colonIndex + 1).trim();
      result[key] = value.replace(/^['"]|['"]$/g, ''); // Remove quotes
    }
  }
  
  return result;
}

function testOpenCodeCommandLoading() {
  const testSetupDir = path.join(process.cwd(), 'test-setup', '.opencode', 'command');
  const files = ['commit.md', 'document.md', 'execute.md', 'plan.md', 'research.md', 'review.md', 'test.md'];
  
  console.log('🧪 Testing OpenCode command loading and parsing...\n');
  
  let allPassed = true;
  
  for (const file of files) {
    const filePath = path.join(testSetupDir, file);
    console.log(`📄 Testing ${file}...`);
    
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const frontmatter = parseMarkdownFrontmatter(content);
      
      // Check if frontmatter exists
      if (Object.keys(frontmatter).length === 0) {
        console.log(`  ❌ No frontmatter found`);
        allPassed = false;
        continue;
      }
      
      // Check required fields
      const requiredFields = ['name', 'description', 'version', 'last_updated'];
      let hasAllRequired = true;
      
      for (const field of requiredFields) {
        if (!frontmatter[field]) {
          console.log(`  ❌ Missing required field: ${field}`);
          hasAllRequired = false;
          allPassed = false;
        }
      }
      
      if (hasAllRequired) {
        console.log(`  ✅ All required frontmatter fields present`);
        console.log(`    - Name: ${frontmatter.name}`);
        console.log(`    - Description: ${frontmatter.description}`);
        console.log(`    - Version: ${frontmatter.version}`);
        console.log(`    - Last Updated: ${frontmatter.last_updated}`);
      }
      
      // Check for OpenCode-specific fields
      if (frontmatter.agent) {
        console.log(`  ✅ Has agent field: ${frontmatter.agent}`);
      }
      
      if (frontmatter.model) {
        console.log(`  ✅ Has model field: ${frontmatter.model}`);
      }
      
    } catch (error) {
      console.log(`  ❌ Error reading file: ${error.message}`);
      allPassed = false;
    }
  }
  
  console.log(`\n${allPassed ? '✅' : '❌'} OpenCode command loading test ${allPassed ? 'PASSED' : 'FAILED'}`);
  return allPassed;
}

testOpenCodeCommandLoading();
