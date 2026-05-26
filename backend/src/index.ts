import { httpServer, prisma, db } from './app';
import { pythonService } from './services/pythonServiceManager';

const PORT = process.env.PORT || 3001;

async function main() {
  await pythonService.start();
  httpServer.listen(PORT, () => {
    console.log(`AI COS Backend running on port ${PORT}`);
  });
}

main().catch(console.error);

process.on('SIGTERM', async () => {
  await pythonService.stop();
  await prisma.$disconnect();
  httpServer.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  await pythonService.stop();
  await prisma.$disconnect();
  httpServer.close();
  process.exit(0);
});
