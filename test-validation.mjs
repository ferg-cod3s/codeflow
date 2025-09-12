import { validate } from './src/cli/validate.ts';

console.log('🔍 Running comprehensive validation check...\n');

console.log('Options being passed:', {
  format: 'all',
  verbose: true,
  checkDuplicates: true,
  canonicalCheck: true,
});

try {
  await validate({
    format: 'all',
    verbose: true,
    checkDuplicates: true,
    canonicalCheck: true,
  });
  console.log('\n✅ Validation completed successfully');
} catch (error) {
  console.error('\n❌ Validation failed:', error.message);
  process.exit(1);
}
