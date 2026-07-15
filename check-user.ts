import prisma from './src/config/database';
import { comparePassword } from './src/utils/password';

async function main() {
  const user = await prisma.user.findUnique({
    where: { email: 'sinchan@gmail.com' },
    select: { id: true, email: true, password: true },
  });
  if (!user) { console.log('NOT FOUND'); return; }
  
  const match = await comparePassword('123456', user.password);
  console.log('Password "123456" matches:', match);
  
  const match2 = await comparePassword('doctor123', user.password);
  console.log('Password "doctor123" matches:', match2);
  
  await prisma.$disconnect();
}

main();
