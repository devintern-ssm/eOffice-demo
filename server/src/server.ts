import { createApp } from './app.js';
import { config } from './config.js';
import { prisma } from './prisma.js';

const app = createApp();

const server = app.listen(config.port, () => {
  console.log(`[eoffice-server] listening on http://localhost:${config.port}`);
  console.log(`[eoffice-server] health: http://localhost:${config.port}/api/v1/health`);
});

async function shutdown(signal: string) {
  console.log(`\n[eoffice-server] ${signal} received, shutting down...`);
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
