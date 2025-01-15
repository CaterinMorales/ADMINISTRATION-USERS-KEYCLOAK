import { BadRequestException, forwardRef, Inject, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import axios from 'axios';
import { AuthService } from 'src/auth/auth.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ConfigRealmService {
  private keycloakUrl: string;
  private realm: string;


  constructor(
    @Inject(forwardRef(() => AuthService)) private authService: AuthService,
    private configService: ConfigService,
  ) {
    this.keycloakUrl = this.configService.get<string>('KEYCLOAK_URL');
    this.realm = this.configService.get<string>('KEYCLOAK_REALM');
  }


  public async updateBruteForceSettings(settings: any): Promise<any> {
    const token = await this.authService.getAdminToken();
    const url = `${this.keycloakUrl}/admin/realms/${this.realm}`;

    try {
      const response = await axios.put(url, settings, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      return response.data;
    } catch (error) {
      if (error.response) {
        switch (error.response.status) {
          case 404:
            console.error('Realm not found:', error.response.data);
            throw new NotFoundException('Realm not found in Keycloak.');
          case 401:
            console.error('Invalid token:', error.response.data);
            throw new UnauthorizedException('Invalid token.');
          case 400:
            console.error('Bad request:', error.response.data);
            throw new BadRequestException('Bad request.');
          default:
            console.error('Unexpected response error:', error.response.data);
            throw new Error('Unexpected error while updating brute force settings.');
        }
      } else {
        console.error('Error updating brute force settings:', error.message);
        throw new Error('Failed to update brute force settings in Keycloak.');
      }
    }
  }


  


}
