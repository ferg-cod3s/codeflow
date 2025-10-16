#!/usr/bin/env bun

import { runHealthCheck } from '../monitoring/health';

export async function healthCheck(): Promise<void> {
  try {
    await runHealthCheck();
  } catch (error) {
    console.error('❌ Health check failed:', error);
    process.exit(1);
  }
}
