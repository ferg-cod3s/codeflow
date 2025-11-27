import fs from 'fs-extra';
import * as path from 'path';
import { glob } from 'glob';

export async function readAllFiles(pattern: string, cwd: string = process.cwd()): Promise<string[]> {
  const files = await glob(pattern, { cwd });
  return files;
}

export async function readFile(filePath: string): Promise<string> {
  return await fs.readFile(filePath, 'utf-8');
}

export async function writeFile(filePath: string, content: string): Promise<void> {
  await fs.ensureDir(path.dirname(filePath));
  await fs.writeFile(filePath, content, 'utf-8');
}

export async function ensureDir(dirPath: string): Promise<void> {
  await fs.ensureDir(dirPath);
}

export function getRelativePath(filePath: string, basePath: string = process.cwd()): string {
  return path.relative(basePath, filePath);
}

export function changeExtension(filePath: string, newExt: string): string {
  const parsed = path.parse(filePath);
  return path.join(parsed.dir, `${parsed.name}${newExt}`);
}