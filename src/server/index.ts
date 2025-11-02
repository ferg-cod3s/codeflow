#!/usr/bin/env bun





import { serve } from 'bun';

/**
 * Simple REST API server for Codeflow
 * Provides basic health check and status endpoints
 */

interface ServerConfig {
  port?: number;
  hostname?: string;
}

export async function startServer(config: ServerConfig = {}) {
  const port = config.port || 3000;
  const hostname = config.hostname || 'localhost';

  console.log(`🚀 Starting Codeflow REST API server on http://${hostname}:${port}`);

  const server = serve({
    port,
    hostname,
    async fetch(request: Request) {
      const url = new URL(request.url);

      // Health check endpoint
      if (url.pathname === '/status' && request.method === 'GET') {
        return new Response(JSON.stringify({ status: 'ok' }), {
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
          },
        });
      }

      // API info endpoint
      if (url.pathname === '/' && request.method === 'GET') {
        return new Response(
          JSON.stringify({
            name: 'Codeflow API',
            version: '1.0.0',
            description: 'REST API for Codeflow CLI tool',
            endpoints: {
              'GET /status': 'Health check endpoint',
              'GET /': 'API information',
            },
          }),
          {
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
              'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
              'Access-Control-Allow-Headers': 'Content-Type',
            },
          }
        );
      }

      // Handle CORS preflight requests
      if (request.method === 'OPTIONS') {
        return new Response(null, {
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
          },
        });
      }

      // 404 for unknown endpoints
      return new Response(
        JSON.stringify({
          error: 'Not Found',
          message: `Endpoint ${request.method} ${url.pathname} not found`,
        }),
        {
          status: 404,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    },
  });

  console.log(`✅ Server running at http://${hostname}:${port}`);
  console.log(`📊 Health check: GET /status`);
  console.log(`ℹ️  API info: GET /`);

  return server;
}

export async function stopServer(server: any) {
  if (server && server.stop) {
    server.stop();
    console.log('🛑 Server stopped');
  }
}
