import * as fs from 'fs/promises';
import * as path from 'path';

export async function readFile(filePath: string): Promise<string> {
  try {
    return await fs.readFile(filePath, 'utf-8');
  } catch (error) {
    throw new Error(`Failed to read file ${filePath}: ${error}`);
  }
}

export async function writeFile(filePath: string, content: string): Promise<void> {
  try {
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, content, 'utf-8');
  } catch (error) {
    throw new Error(`Failed to write file ${filePath}: ${error}`);
  }
}

export async function readAllFiles(pattern: string, dir: string): Promise<string[]> {
  try {
    const files: string[] = [];
    const entries = await fs.readdir(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      if (entry.isDirectory()) {
        const subFiles = await readAllFiles(pattern, fullPath);
        files.push(...subFiles.map(f => path.join(entry.name, f)));
      } else if (entry.name.match(pattern.replace('**/', '.*'))) {
        files.push(entry.name);
      }
    }
    
    return files;
  } catch (error) {
    throw new Error(`Failed to read directory ${dir}: ${error}`);
  }
}

export async function ensureDir(dirPath: string): Promise<void> {
  try {
    await fs.mkdir(dirPath, { recursive: true });
  } catch (error) {
    throw new Error(`Failed to create directory ${dirPath}: ${error}`);
  }
}