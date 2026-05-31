import './config/env.js';
import app from './app.js';
import { connectDatabase } from './config/db.js';
import { seedDemoData } from './store/memoryStore.js';

const port = process.env.PORT || 4000;

async function bootstrap() {
  await connectDatabase();
  await seedDemoData();

  app.listen(port, () => {
    console.log(`ScholarX API listening on port ${port}`);
  });
}

bootstrap().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
