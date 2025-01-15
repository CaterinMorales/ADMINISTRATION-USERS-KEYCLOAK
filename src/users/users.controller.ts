import { Body, Controller, Get, Param, Post, Put } from '@nestjs/common';
import { UsersService } from './UserService';
import { UpdatePasswordDto } from './dto/UpdatePasswordDto';
import { UpdateEnabledDto } from './dto/UpdateEnabledDto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('bulk')
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

  @Post()
  async createUser(@Body() userData: any) {    
    return this.usersService.createUser(userData);
  }

  @Get(':id')
  async getUserDetails(@Param('id') userId: string) {
    return await this.usersService.getUserDetails(userId);
  }

  @Get(':id/enabled')
  async isUserEnabled(@Param('id') userId: string): Promise<{ enabled: boolean }> {
    const isEnabled = await this.usersService.isUserEnabled(userId);
    return { enabled: isEnabled };
  }

  @Put(':id/enabled')
  async updateUserEnabled(@Param('id') userId: string, @Body() body: UpdateEnabledDto): Promise<{ message: string }> {
    await this.usersService.updateUserEnabled(userId, body.enabled);
    return { message: `updated` };
  }

}