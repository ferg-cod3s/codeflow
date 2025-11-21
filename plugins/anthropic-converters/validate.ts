#!/usr/bin/env node

import * as fs from 'fs/promises';
import * as path from 'path';

interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

async function validatePlugin(pluginDir: string): Promise<ValidationResult> {
  const result: ValidationResult = {
    valid: true,
    errors: [],
    warnings: []
  };

  try {
    // Check required files exist
    const requiredFiles = ['package.json', 'index.js', 'README.md'];
    
    for (const file of requiredFiles) {
      const filePath = path.join(pluginDir, file);
      try {
        await fs.access(filePath);
      } catch {
        result.errors.push(`Missing required file: ${file}`);
        result.valid = false;
      }
    }

    // Validate package.json structure
    const packageJsonPath = path.join(pluginDir, 'package.json');
    const packageContent = await fs.readFile(packageJsonPath, 'utf-8');
    const packageJson = JSON.parse(packageContent);

    // Required fields
    const requiredFields = ['name', 'version', 'description', 'main', 'type'];
    for (const field of requiredFields) {
      if (!packageJson[field]) {
        result.errors.push(`Missing required field in package.json: ${field}`);
        result.valid = false;
      }
    }

    // Validate opencode section
    if (!packageJson.opencode) {
      result.warnings.push('Missing opencode section in package.json');
    } else {
      const opencodeFields = ['category', 'tags', 'author', 'repository'];
      for (const field of opencodeFields) {
        if (!packageJson.opencode[field]) {
          result.warnings.push(`Missing opencode field: ${field}`);
        }
      }
    }

    // Validate index.js exists and has content
    const indexPath = path.join(pluginDir, 'index.js');
    const indexContent = await fs.readFile(indexPath, 'utf-8');
    
    if (indexContent.length < 100) {
      result.warnings.push('index.js seems too short');
    }

    // Check for required exports
    if (!indexContent.includes('module.exports')) {
      result.errors.push('index.js missing module.exports');
      result.valid = false;
    }

    // Validate README.md
    const readmePath = path.join(pluginDir, 'README.md');
    const readmeContent = await fs.readFile(readmePath, 'utf-8');
    
    if (readmeContent.length < 200) {
      result.warnings.push('README.md seems too short');
    }

    // Check for required sections
    const requiredSections = ['## Installation', '## Usage'];
    for (const section of requiredSections) {
      if (!readmeContent.includes(section)) {
        result.warnings.push(`README.md missing section: ${section}`);
      }
    }

  } catch (error) {
    result.errors.push(`Validation error: ${error}`);
    result.valid = false;
  }

  return result;
}

async function validateAllPlugins(pluginsDir: string): Promise<void> {
  console.log('🔍 Validating converted plugins...\n');

  try {
    const plugins = await fs.readdir(pluginsDir);
    let totalValid = 0;
    let totalPlugins = 0;

    for (const plugin of plugins) {
      const pluginDir = path.join(pluginsDir, plugin);
      const stat = await fs.stat(pluginDir);
      
      if (stat.isDirectory()) {
        totalPlugins++;
        console.log(`Validating: ${plugin}`);
        
        const result = await validatePlugin(pluginDir);
        
        if (result.valid) {
          console.log('  ✅ Valid');
          totalValid++;
        } else {
          console.log('  ❌ Invalid');
        }
        
        if (result.errors.length > 0) {
          console.log('  Errors:');
          result.errors.forEach(error => console.log(`    - ${error}`));
        }
        
        if (result.warnings.length > 0) {
          console.log('  Warnings:');
          result.warnings.forEach(warning => console.log(`    - ${warning}`));
        }
        
        console.log('');
      }
    }

    console.log(`\n📊 Validation Summary:`);
    console.log(`Total Plugins: ${totalPlugins}`);
    console.log(`Valid: ${totalValid}`);
    console.log(`Invalid: ${totalPlugins - totalValid}`);
    console.log(`Success Rate: ${((totalValid / totalPlugins) * 100).toFixed(1)}%`);

  } catch (error) {
    console.error(`Validation failed: ${error}`);
    process.exit(1);
  }
}

// Run validation
const pluginsDir = process.argv[2] || './converted';
validateAllPlugins(pluginsDir);