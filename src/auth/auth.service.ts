import { ForbiddenException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
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

    constructor(
        private configService: ConfigService,
    ) {
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
        const userDetailsUrl = `${this.keycloakUrl}/admin/realms/${this.realm}/users?username=${username}`;
        const tokenUrl = `${this.keycloakUrl}/realms/${this.realm}/protocol/openid-connect/token`;
    
        try {
            const adminToken = await this.getAdminToken();
    
            const userDetailsResponse = await axios.get(userDetailsUrl, {
                headers: {
                    Authorization: `Bearer ${adminToken}`,
                },
            });
    
            if (userDetailsResponse.data.length === 0) {
                throw new NotFoundException('User not found.');
            }
    
            const user = userDetailsResponse.data[0];
            if (!user.enabled) {
                throw new UnauthorizedException('User is disabled.');
            }
    
            const params = new URLSearchParams();
            params.append('client_id', this.clientId);
            params.append('client_secret', this.clientSecret);
            params.append('username', username);
            params.append('password', password);
            params.append('grant_type', 'password');
    
            try {
                const response = await axios.post(tokenUrl, params);
                return response.data.access_token;
            } catch (authError) {
                if (
                    authError.response &&
                    authError.response.data.error === 'invalid_grant' &&
                    authError.response.data.error_description.includes('temporarily disabled')
                ) {
                    throw new ForbiddenException({
                        message: 'User is temporarily locked due to too many failed attempts.',
                        details: 'Please try again after the lockout period expires.',
                    });
                }
                throw authError; 
            }
        } catch (error) {
            if (error.response && error.response.status === 401) {
                throw new UnauthorizedException('Invalid credentials.');
            } else if (error.response && error.response.status === 404) {
                throw new NotFoundException('User not found.');
            }
            console.error('Error during login:', error.message);
            throw error;
        }
    }
    
    



    public async getMaxLoginAttempts() {
        const url = `${this.keycloakUrl}/admin/realms/${this.realm}`;
        const token = await this.getAdminToken();
        const response = await axios.get(url, {
            headers: { Authorization: `Bearer ${token}` },
        });

        return response.data.bruteForceProtected ? response.data.failureFactor : 0;
    }

    public getTimeUntilUnlock(user: any) {
        const lastFailedLogin = new Date(user.attributes['lastFailedLogin'][0]);
        const waitTime = 60 * 5;
        const elapsedTime = (Date.now() - lastFailedLogin.getTime()) / 1000;
        return Math.max(0, waitTime - elapsedTime);
    }


    public async getUserDetailsByUsername(username: string, token: string) {
        const url = `${this.keycloakUrl}/admin/realms/${this.realm}/users?username=${username}`;
        const response = await axios.get(url, {
          headers: { Authorization: `Bearer ${token}` },
        });
    
        if (response.data.length > 0) {
          return response.data[0];
        }
        throw new NotFoundException('User not found.');
      }



}
