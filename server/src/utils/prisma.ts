import { PrismaClient } from '@prisma/client';

// 创建Prisma客户端单例
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

// 处理连接错误
prisma.$connect()
  .then(() => {
    console.log('✅ Database connected successfully');
  })
  .catch((error) => {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  });

// 优雅关闭
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

export default prisma;



