import { Controller, Post, Body, BadRequestException } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('create-user')
  async createUser(@Body() userData: any) {    
    return this.authService.createUser(userData);
  }

  @Post('login')
  async login(@Body() loginData: { username: string, password: string }) {
    try {
      const token = await this.authService.loginUser(loginData.username, loginData.password);
      return token;
    } catch (error) {
      console.log(error);
      
      throw new BadRequestException('Error al hacer login');
    }
  }

}
