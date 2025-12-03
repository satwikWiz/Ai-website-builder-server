import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testVariants() {
  try {
    // Check all variants in database
    const allVariants = await prisma.variant.findMany();
    console.log('All variants in database:', allVariants.length);
    allVariants.forEach(v => {
      console.log(`- ${v.name} (subdomain: ${v.subdomain}, id: ${v.id})`);
    });

    // Check variants for "satwik"
    const satwikVariants = await prisma.variant.findMany({
      where: { subdomain: 'satwik' }
    });
    console.log(`\nVariants for "satwik": ${satwikVariants.length}`);
    satwikVariants.forEach(v => {
      console.log(`- ${v.name} (id: ${v.id})`);
    });
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testVariants();

