import { syncCanonical } from './src/cli/sync.ts';

console.log('🔄 Testing canonical synchronization...\n');

try {
  await syncCanonical({
    target: 'project',
    sourceFormat: 'base',
    dryRun: true, // Test with dry run first
    force: false,
  });
  console.log('\n✅ Canonical sync test completed successfully');
} catch (error) {
  console.error('\n❌ Canonical sync test failed:', error.message);
  process.exit(1);
}
