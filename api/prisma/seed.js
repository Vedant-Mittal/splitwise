const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Create default categories
  const categories = [
    { name: 'Food', isCustom: false },
    { name: 'Transportation', isCustom: false },
    { name: 'Accommodation', isCustom: false },
    { name: 'Entertainment', isCustom: false },
    { name: 'Shopping', isCustom: false },
    { name: 'Utilities', isCustom: false },
    { name: 'Health', isCustom: false },
    { name: 'Other', isCustom: false }
  ];

  for (const category of categories) {
    await prisma.category.upsert({
      where: { name: category.name },
      update: {},
      create: category,
    });
  }

  // Create default currencies
  const currencies = [
    { code: 'INR', name: 'Indian Rupee', symbol: '₹', exchangeRate: 1 },
    { code: 'USD', name: 'US Dollar', symbol: '$', exchangeRate: 0.012 },
    { code: 'EUR', name: 'Euro', symbol: '€', exchangeRate: 0.011 },
    { code: 'GBP', name: 'British Pound', symbol: '£', exchangeRate: 0.0095 },
    { code: 'JPY', name: 'Japanese Yen', symbol: '¥', exchangeRate: 1.83 }
  ];

  for (const currency of currencies) {
    await prisma.currency.upsert({
      where: { code: currency.code },
      update: {},
      create: currency,
    });
  }

  console.log('Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 