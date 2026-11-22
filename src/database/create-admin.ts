import 'dotenv/config';
import * as bcrypt from 'bcrypt';
import { Role } from '../users/role';
import { User } from '../users/user.entity';
import dataSource from './data-source';

async function createAdmin() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) {
    throw new Error('В .env нужно задать ADMIN_EMAIL и ADMIN_PASSWORD');
  }

  await dataSource.initialize();
  const usersRepository = dataSource.getRepository(User);

  const existingUser = await usersRepository.findOneBy({ email });
  if (existingUser) {
    await usersRepository.update(existingUser.id, { role: Role.Admin });
    console.log(`Пользователь ${email} теперь администратор`);
  } else {
    const passwordHash = await bcrypt.hash(password, 10);
    await usersRepository.save({ email, passwordHash, role: Role.Admin });
    console.log(`Создан администратор ${email}`);
  }

  await dataSource.destroy();
}

void createAdmin();
