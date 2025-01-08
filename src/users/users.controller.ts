import { Body, Controller, Param, Post, Put } from '@nestjs/common';
import { UsersService } from './UserService';
import { UpdatePasswordDto } from './dto/UpdatePasswordDto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('bulk-insert')
  async bulkInsertUsers() {
    await this.usersService.bulkInsertUsers();
    return { message: 'Inserción masiva iniciada' };
  }

  @Put(':username/password')
  async updatePassword(
    @Param('username') username: string,
    @Body() updatePasswordDto: UpdatePasswordDto,
  ) {
    return await this.usersService.updatePasswordByUsername(username, updatePasswordDto.password);
  }

  @Post('create-user')
  async createUser(@Body() userData: any) {    
    return this.usersService.createUser(userData);
  }

}