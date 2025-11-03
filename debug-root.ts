import { getCodeflowRoot } from './src/utils/path-resolver.ts';
import { join } from 'node:path';

console.log('getPackageRoot():', getCodeflowRoot());
console.log('Expected:', '/home/f3rg/src/github/codeflow');
console.log('Command dir should be:', join(getCodeflowRoot(), 'command'));
