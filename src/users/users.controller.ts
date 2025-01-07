// filepath: src/users/users.controller.ts
import { Controller, Post } from '@nestjs/common';
import { UsersService } from './UserService';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('bulk-insert')
  async bulkInsertUsers() {
    await this.usersService.bulkInsertUsers();
    return { message: 'Inserción masiva iniciada' };
  }
}