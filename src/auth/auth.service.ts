import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  private keycloakUrl: string;
  private realm: string;
  private clientId: string;
  private clientSecret: string;
  private username: string;
  private password: string;

  constructor(private configService: ConfigService) {
    this.keycloakUrl = this.configService.get<string>('KEYCLOAK_URL');
    this.realm = this.configService.get<string>('KEYCLOAK_REALM');
    this.clientId = this.configService.get<string>('KEYCLOAK_CLIENT_ID');
    this.clientSecret = this.configService.get<string>('KEYCLOAK_CLIENT_SECRET');
    this.username = this.configService.get<string>('KEYCLOAK_USERNAME');
    this.password = this.configService.get<string>('KEYCLOAK_PASSWORD');
  }

  async validateToken(token: string): Promise<boolean> {
    const url = `${this.keycloakUrl}/realms/${this.realm}/protocol/openid-connect/token/introspect`;

    const params = new URLSearchParams();
    params.append('client_id', this.clientId);
    params.append('client_secret', this.clientSecret);
    params.append('token', token);

    const response = await axios.post(url, params);
    return response.data.active;
  }


  async getAdminToken(): Promise<string> {
    const url = `${this.keycloakUrl}/realms/master/protocol/openid-connect/token`;

    const params = new URLSearchParams();
    params.append('client_id', 'admin-cli');
    params.append('username', this.username);
    params.append('password', this.password);
    params.append('grant_type', 'password');

    try {
      const response = await axios.post(url, params);
      return response.data.access_token;
    } catch (error) {
      console.error('Error al obtener el token de administrador:', error.message);
      throw error;
    }
  }

  async loginUser(username: string, password: string): Promise<string> {
    const url = `${this.keycloakUrl}/realms/${this.realm}/protocol/openid-connect/token`;
  
    const params = new URLSearchParams();
    params.append('client_id', this.clientId);
    params.append('client_secret', this.clientSecret);
    params.append('username', username);
    params.append('password', password);
    params.append('grant_type', 'password');
  
    try {
      const response = await axios.post(url, params);
      return response.data.access_token;
    } catch (error) {
      throw error;
    }
  }

}
