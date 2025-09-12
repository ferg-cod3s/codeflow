import { validate } from './src/cli/validate.ts';

console.log('🔍 Testing batch validation and fix suggestions...\n');

try {
  await validate({
    format: 'all',
    verbose: false, // Less verbose for batch testing
    checkDuplicates: false,
    canonicalCheck: false,
    fix: true, // Generate fix suggestions
  });
  console.log('\n✅ Batch validation completed successfully');
} catch (error) {
  console.error('\n❌ Batch validation failed:', error.message);
  process.exit(1);
}
