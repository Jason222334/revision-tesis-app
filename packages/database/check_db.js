const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function check() {
  try {
    const count = await prisma.template.count();
    const active = await prisma.template.count({ where: { isActive: true } });
    const templates = await prisma.template.findMany();
    console.log('Total templates:', count);
    console.log('Active templates:', active);
    console.log('Templates data:', JSON.stringify(templates, null, 2));
  } catch (e) {
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}
check();
