import { PrismaClient } from '@prisma/client';
import { getDefaultCategories, getDefaultCurrencies } from '../app/lib/utils';

const prisma = new PrismaClient();

async function main() {
  try {
    // Seed default categories
    const defaultCategories = getDefaultCategories();
    for (const category of defaultCategories) {
      await prisma.category.upsert({
        where: { id: category.id },
        update: {},
        create: {
          id: category.id,
          name: category.name,
          isCustom: category.isCustom || false,
        },
      });
    }
    console.log('✅ Default categories seeded');

    // Seed default currencies
    const defaultCurrencies = getDefaultCurrencies();
    for (const currency of defaultCurrencies) {
      await prisma.currency.upsert({
        where: { code: currency.code },
        update: {
          symbol: currency.symbol,
          name: currency.name,
          exchangeRate: currency.exchangeRate,
        },
        create: {
          code: currency.code,
          symbol: currency.symbol,
          name: currency.name,
          exchangeRate: currency.exchangeRate,
        },
      });
    }
    console.log('✅ Default currencies seeded');

    console.log('✅ Database seeded successfully');
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 