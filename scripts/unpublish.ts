#!/usr/bin/env bun

import { $ } from "bun";

// Get version from command line
const version = process.argv[2];

if (!version) {
  console.error("❌ Usage: ./scripts/unpublish.ts <version>");
  console.error("   Example: ./scripts/unpublish.ts 0.1.0");
  process.exit(1);
}

// Validate version format
if (!/^\d+\.\d+\.\d+$/.test(version)) {
  console.error(`❌ Invalid version format: ${version}`);
  console.error("   Expected format: X.Y.Z (e.g., 0.1.0)");
  process.exit(1);
}

console.log(`🗑️  Preparing to unpublish version ${version} from all packages...\n`);

// Define all packages
const packages = [
  "agentic-cli",
  "agentic-darwin-x64",
  "agentic-darwin-arm64", 
  "agentic-linux-x64",
  "agentic-linux-arm64",
  "agentic-windows-x64",
];

// Track results
const results: { package: string; status: "success" | "failed" | "not found" }[] = [];

// Unpublish each package
for (const pkg of packages) {
  const fullPackage = `${pkg}@${version}`;
  console.log(`Unpublishing ${fullPackage}...`);
  
  try {
    // Check if version exists first
    const exists = await $`npm view ${fullPackage} version 2>/dev/null`.quiet().nothrow();
    
    if (exists.exitCode !== 0) {
      console.log(`  ⚠️  Version ${version} not found for ${pkg}`);
      results.push({ package: pkg, status: "not found" });
      continue;
    }
    
    // Attempt to unpublish (--force required for packages with no dependents)
    const result = await $`npm unpublish ${fullPackage} --force`.quiet().nothrow();
    
    if (result.exitCode === 0) {
      console.log(`  ✅ Successfully unpublished ${pkg}@${version}`);
      results.push({ package: pkg, status: "success" });
    } else {
      console.log(`  ❌ Failed to unpublish ${pkg}@${version}`);
      console.log(`     ${result.stderr.toString().trim()}`);
      results.push({ package: pkg, status: "failed" });
    }
  } catch (error) {
    console.log(`  ❌ Error unpublishing ${pkg}@${version}: ${error}`);
    results.push({ package: pkg, status: "failed" });
  }
}

// Summary
console.log("\n📊 Summary:");
console.log("===========");

const successful = results.filter(r => r.status === "success");
const failed = results.filter(r => r.status === "failed");
const notFound = results.filter(r => r.status === "not found");

if (successful.length > 0) {
  console.log(`✅ Unpublished: ${successful.map(r => r.package).join(", ")}`);
}

if (notFound.length > 0) {
  console.log(`⚠️  Not found: ${notFound.map(r => r.package).join(", ")}`);
}

if (failed.length > 0) {
  console.log(`❌ Failed: ${failed.map(r => r.package).join(", ")}`);
  console.log("\nNote: Unpublishing may fail if:");
  console.log("  - More than 72 hours have passed since publish");
  console.log("  - The package has dependents");
  console.log("  - You don't have permission");
  console.log("\nConsider using 'npm deprecate' instead for older versions");
  process.exit(1);
}

if (successful.length === packages.length) {
  console.log("\n✨ All packages successfully unpublished!");
} else if (successful.length > 0) {
  console.log("\n⚠️  Partial success - some packages were unpublished");
}