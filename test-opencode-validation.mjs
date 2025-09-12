import { validate } from './src/cli/validate.ts';

console.log('🔍 Testing OpenCode agent format validation...\n');

try {
  await validate({
    format: 'opencode',
    verbose: true,
    checkDuplicates: false,
    canonicalCheck: false,
  });
  console.log('\n✅ OpenCode validation completed successfully');
} catch (error) {
  console.error('\n❌ OpenCode validation failed:', error.message);
  process.exit(1);
}
