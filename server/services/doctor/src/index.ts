import dotenv from 'dotenv';
import app from './app';
import prisma from './lib/prisma';

dotenv.config();

const PORT = process.env.PORT || 4003;

const server = app.listen(PORT, () => {
  console.log(`doctor service running on port ${PORT}`);
});

const shutdown = async (signal: string) => {
  console.log(`Received ${signal}. Shutting down doctor service...`);
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
};

process.on('SIGINT', () => {
  void shutdown('SIGINT');
});

process.on('SIGTERM', () => {
  void shutdown('SIGTERM');
});
