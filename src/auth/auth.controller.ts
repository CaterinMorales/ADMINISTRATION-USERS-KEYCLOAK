import { Controller, Post, Body, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/LoginDto';
import { ConfigRealmService } from 'src/configRealm/config-realm.service';
import { ConfigService } from '@nestjs/config';

@Controller('auth')
export class AuthController {

  private keycloakUrl: string;
  private realm: string;
  
  constructor(private readonly authService: AuthService, private readonly configRealm: ConfigRealmService, private configService: ConfigService) { 
    this.keycloakUrl = this.configService.get<string>('KEYCLOAK_URL');
    this.realm = this.configService.get<string>('KEYCLOAK_REALM');

  }

  @Post('login')
  async login(@Body() body: LoginDto) {
    const { username, password } = body;

    try {
      // Intentar iniciar sesión con el servicio de autenticación
      const token = await this.authService.loginUser(username, password);

      return { message: 'Login successful', token };
    } catch (error) {
      if (error.response?.status === 401) {
        const adminToken = await this.authService.getAdminToken();
        const user = await this.authService.getUserDetailsByUsername(username, adminToken);

        if (user && user.attributes && user.attributes['loginAttempts']) {
          const loginAttempts = parseInt(user.attributes['loginAttempts'][0], 10);
          const maxLoginAttempts = await this.authService.getMaxLoginAttempts();

          if (loginAttempts >= maxLoginAttempts) {
            const timeRemaining = this.authService.getTimeUntilUnlock(user);
            throw new ForbiddenException({
              message: `User is temporarily locked due to too many failed attempts. Try again in ${timeRemaining} seconds.`,
            });
          }
        }
      }

      throw new UnauthorizedException('Invalid credentials.');
    }
  }

  

  


}
