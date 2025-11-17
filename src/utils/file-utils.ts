import { readFile as fsReadFile, writeFile as fsWriteFile, mkdir } from 'fs/promises';
import * as path from 'path';
import { glob } from 'glob';

export async function readAllFiles(pattern: string, cwd: string = process.cwd()): Promise<string[]> {
  const files = await glob(pattern, { cwd });
  return files;
}

export async function readFile(filePath: string): Promise<string> {
  return await fsReadFile(filePath, 'utf-8');
}

export async function writeFile(filePath: string, content: string): Promise<void> {
  await ensureDir(path.dirname(filePath));
  await fsWriteFile(filePath, content, 'utf-8');
}

export async function ensureDir(dirPath: string): Promise<void> {
  try {
    await mkdir(dirPath, { recursive: true });
  } catch (error: any) {
    if (error.code !== 'EEXIST') {
      throw error;
    }
  }
}

export function getRelativePath(filePath: string, basePath: string = process.cwd()): string {
  return path.relative(basePath, filePath);
}

export function changeExtension(filePath: string, newExt: string): string {
  const parsed = path.parse(filePath);
  return path.join(parsed.dir, `${parsed.name}${newExt}`);
}