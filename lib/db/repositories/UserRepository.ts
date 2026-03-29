import { BaseRepository } from './BaseRepository';
import { User } from '@prisma/client';

export class UserRepository extends BaseRepository<User> {
  constructor() {
    super('user');
  }

  async findByEmail(email: string): Promise<User | null> {
    // Note: Email is unique globally, but we still check isDeleted
    return this.model.findFirst({
      where: { email, isDeleted: false },
    });
  }
}

export const userRepository = new UserRepository();
