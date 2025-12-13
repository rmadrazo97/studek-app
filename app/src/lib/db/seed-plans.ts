import { closeDatabase } from './index';
import { runMigrations } from './migrate';
import { seedPlans } from './services/plans';

async function main() {
  runMigrations();
  seedPlans();
  console.log('[Seed] Plans seeded');
}

if (require.main === module) {
  main()
    .then(() => {
      closeDatabase();
      process.exit(0);
    })
    .catch((error) => {
      console.error('[Seed] Error seeding plans:', error);
      closeDatabase();
      process.exit(1);
    });
}
