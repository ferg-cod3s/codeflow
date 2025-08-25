#!/usr/bin/env bun

import { $ } from "bun";
import path from "path";
import fs from "fs/promises";

const version = process.env.AGENTIC_VERSION;
if (!version) {
  throw new Error("AGENTIC_VERSION environment variable is required");
}

console.log(`Publishing agentic-cli v${version}`);

// Platform configurations
const platforms = [
  { name: "darwin-x64", os: "darwin", cpu: "x64", bun: "darwin-x64" },
  { name: "darwin-arm64", os: "darwin", cpu: "arm64", bun: "darwin-arm64" },
  { name: "linux-x64", os: "linux", cpu: "x64", bun: "linux-x64" },
  { name: "linux-arm64", os: "linux", cpu: "arm64", bun: "linux-arm64" },
  { name: "windows-x64", os: "win32", cpu: "x64", bun: "windows-x64", ext: ".exe" },
];

// Create dist directory
const distDir = path.join(process.cwd(), "dist");
await fs.mkdir(distDir, { recursive: true });

// Build binaries for each platform
console.log("\nBuilding binaries...");
for (const platform of platforms) {
  console.log(`  Building ${platform.name}...`);
  const outfile = `./dist/agentic-${platform.name}/bin/agentic${platform.ext || ""}`;
  await $`bun build ./src/cli/index.ts --compile --target=bun-${platform.bun} --outfile ${outfile}`;
}

// Create platform-specific packages
console.log("\nCreating platform packages...");
for (const platform of platforms) {
  const pkgDir = path.join(distDir, `agentic-${platform.name}`);
  
  // Create package.json for platform package
  const platformPkg = {
    name: `agentic-${platform.name}`,
    version: version,
    os: [platform.os],
    cpu: [platform.cpu],
  };
  
  await fs.writeFile(
    path.join(pkgDir, "package.json"),
    JSON.stringify(platformPkg, null, 2)
  );
  
  console.log(`  Created ${platform.name} package`);
}

// Create main package
console.log("\nCreating main package...");
const mainPkgDir = path.join(distDir, "agentic-cli");
await fs.mkdir(mainPkgDir, { recursive: true });
await fs.mkdir(path.join(mainPkgDir, "bin"), { recursive: true });

// Read base package.json
const basePkg = JSON.parse(await fs.readFile("package.json", "utf-8"));

// Create main package.json with optionalDependencies
const mainPkg = {
  name: "agentic-cli",
  version: version,
  description: basePkg.description,
  bin: {
    agentic: "./bin/agentic"
  },
  scripts: {
    postinstall: "node ./postinstall.mjs"
  },
  keywords: basePkg.keywords,
  author: basePkg.author,
  license: basePkg.license,
  repository: basePkg.repository,
  bugs: basePkg.bugs,
  homepage: basePkg.homepage,
  optionalDependencies: Object.fromEntries(
    platforms.map(p => [`agentic-${p.name}`, version])
  ),
};

await fs.writeFile(
  path.join(mainPkgDir, "package.json"),
  JSON.stringify(mainPkg, null, 2)
);

// Create postinstall.mjs
const postinstallScript = `#!/usr/bin/env node

import { existsSync, symlinkSync, unlinkSync, chmodSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Detect platform
const platform = process.platform;
const arch = process.arch;

const platformMap = {
  'darwin-x64': 'darwin-x64',
  'darwin-arm64': 'darwin-arm64',
  'linux-x64': 'linux-x64',
  'linux-arm64': 'linux-arm64',
  'win32-x64': 'windows-x64',
};

const platformKey = \`\${platform}-\${arch}\`;
const platformName = platformMap[platformKey];

if (!platformName) {
  console.error(\`Unsupported platform: \${platformKey}\`);
  process.exit(1);
}

const platformPkg = \`agentic-\${platformName}\`;
const ext = platform === 'win32' ? '.exe' : '';

// Find the platform package
const platformBin = join(__dirname, '..', platformPkg, 'bin', \`agentic\${ext}\`);
const targetBin = join(__dirname, 'bin', 'agentic');

if (!existsSync(platformBin)) {
  console.error(\`Platform binary not found: \${platformBin}\`);
  console.error(\`Please install \${platformPkg} manually\`);
  process.exit(1);
}

// Create symlink
try {
  if (existsSync(targetBin)) {
    unlinkSync(targetBin);
  }
  
  if (platform === 'win32') {
    // On Windows, create a cmd wrapper instead of symlink
    const wrapper = \`@echo off\\n"\${platformBin}" %*\`;
    require('fs').writeFileSync(targetBin + '.cmd', wrapper);
  } else {
    // On Unix, create symlink and ensure executable
    symlinkSync(platformBin, targetBin);
    chmodSync(platformBin, '755');
  }
  
  console.log(\`✓ Agentic CLI configured for \${platformKey}\`);
} catch (error) {
  console.error('Failed to setup agentic binary:', error);
  process.exit(1);
}
`;

await fs.writeFile(
  path.join(mainPkgDir, "postinstall.mjs"),
  postinstallScript
);

// Create Unix wrapper script
const unixWrapper = `#!/usr/bin/env node
const { spawn } = require('child_process');
const path = require('path');

const bin = path.join(__dirname, '..', \`agentic-\${process.platform}-\${process.arch}\`, 'bin', 'agentic');
const child = spawn(bin, process.argv.slice(2), { stdio: 'inherit' });
child.on('exit', code => process.exit(code));
`;

await fs.writeFile(
  path.join(mainPkgDir, "bin", "agentic"),
  unixWrapper,
  { mode: 0o755 }
);

// Copy other necessary files to main package
const filesToCopy = ["LICENSE", "README.md", "CHANGELOG.md"];
for (const file of filesToCopy) {
  if (await fs.stat(file).catch(() => null)) {
    await fs.copyFile(file, path.join(mainPkgDir, file));
  }
}

// Copy agent and command directories
const dirsToCopy = ["agent", "command", "docs"];
for (const dir of dirsToCopy) {
  const srcDir = path.join(process.cwd(), dir);
  const destDir = path.join(mainPkgDir, dir);
  if (await fs.stat(srcDir).catch(() => null)) {
    await $`cp -r ${srcDir} ${destDir}`;
  }
}

// Publish all packages to npm
console.log("\nPublishing to npm...");

// Publish platform packages first
for (const platform of platforms) {
  const pkgDir = path.join(distDir, `agentic-${platform.name}`);
  console.log(`  Publishing agentic-${platform.name}...`);
  await $`cd ${pkgDir} && npm publish --access public`;
}

// Publish main package
console.log("  Publishing agentic-cli...");
await $`cd ${mainPkgDir} && npm publish --access public`;

console.log(`\n✓ Successfully published agentic-cli v${version}`);