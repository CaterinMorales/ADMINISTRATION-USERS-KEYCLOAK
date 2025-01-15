import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuthService } from '../auth/auth.service';
import { User } from './user.entity';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class UsersService {
  private keycloakUrl: string;
  private realm: string;

  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private authService: AuthService,
    private configService: ConfigService
  ) {
    this.keycloakUrl = this.configService.get<string>('KEYCLOAK_URL');
    this.realm = this.configService.get<string>('KEYCLOAK_REALM');
  }

  async createUser(userData: any): Promise<any> {
    const adminToken = await this.authService.getAdminToken();
    const url = `${this.keycloakUrl}/admin/realms/${this.realm}/users`;

    try {
      await axios.post(url, userData, {
        headers: {
          Authorization: `Bearer ${adminToken}`,
          'Content-Type': 'application/json',
        },
      });
      return { message: 'User created successfully' };
    } catch (error) {
      if (error.response && error.response.status === 409) {
        return { message: 'User already exists' };
      } else {
        console.error('Error creating user:', error.message);
        throw error;
      }
    }
  }

  async bulkInsertUsers(): Promise<void> {
    const users = await this.usersRepository.find();
    let adminToken = await this.authService.getAdminToken();
    console.log("token: ", adminToken);

    for (let i = 0; i < users.length; i++) {
      const user = users[i];
      console.log(`Processing user ${i + 1}/${users.length}: ${user.usuario}`);

      const userData = {
        username: user.usuario,
        email: user.correo,
        firstName: user.nombre,
        lastName: user.apellido,
        enabled: true,
        emailVerified: true,
        attributes: {
          typeDocument: user.typeDocument,
          nroDocument: user.nroDocument,
        },
        credentials: [
          {
            type: 'password',
            value: user.password,
            temporary: false,
          },
        ],
      };

      try {
        console.log(userData);

        
        const existingUser = await this.findUserByUsername(user.usuario, adminToken);

        if (existingUser) {
          console.log(`User ${user.usuario} already exists, updating...`);
          await this.updateUser(existingUser.id, userData, adminToken);
        } else {
          
          await this.createUserWithToken(userData, adminToken);
        }
      } catch (error) {
        if (error.response) {
          if (error.response.status === 401) {
            console.warn('Token expired. Generating a new token...');
            adminToken = await this.authService.getAdminToken();
            try {
              await this.createUserWithToken(userData, adminToken);
            } catch (retryError) {
              if (retryError.response && retryError.response.status === 401) {
                console.error('Invalid token after retry:', retryError.response.data);
                throw new UnauthorizedException('Invalid token after retry.');
              } else if (retryError.response && retryError.response.status === 404) {
                console.error('User not found after retry:', retryError.response.data);
                throw new NotFoundException('User not found in Keycloak after retry.');
              } else {
                console.error(`Error creating user ${user.usuario} after regenerating token:`, retryError.message);
                throw new Error(`Failed to create user ${user.usuario} after regenerating token.`);
              }
            }
          } else if (error.response.status === 404) {
            console.error('User not found:', error.response.data);
            throw new NotFoundException('User not found in Keycloak.');
          } else if (error.response.status === 401) {
            console.error('Invalid token:', error.response.data);
            throw new UnauthorizedException('Invalid token.');
          } else {
            console.error(`Error creating/updating user ${user.usuario}:`, error.response?.data || error.message);
            throw new Error(`Failed to create/update user ${user.usuario}.`);
          }
        } else {
          console.error(`Error creating/updating user ${user.usuario}:`, error.message);
          throw new Error(`Failed to create/update user ${user.usuario}.`);
        }
      }
    }
  }

  async updateUser(userId: string, userData: any, token: string): Promise<void> {
    try {
      const url = `${this.keycloakUrl}/admin/realms/${this.realm}/users/${userId}`;
      await axios.put(url, userData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      console.log(`User ${userData.username} updated successfully`);
    } catch (error) {
      if (error.response) {
        if (error.response.status === 404) {
          console.error('User not found:', error.response.data);
          throw new NotFoundException('User not found in Keycloak.');
        } else if (error.response.status === 401) {
          console.error('Invalid token:', error.response.data);
          throw new UnauthorizedException('Invalid token.');
        }
      }
      console.error(`Error updating user ${userData.username}:`, error.response?.data || error.message);
      throw new Error('Failed to update user');
    }
  }


  async updatePasswordByUsername(username: string, newPassword: string): Promise<any> {
    try {
      const adminToken = await this.authService.getAdminToken();

      const user = await this.findUserByUsername(username, adminToken);

      if (!user) {
        throw new Error(`User with username "${username}" not found`);
      }

      const userId = user.id;

      const url = `${this.keycloakUrl}/admin/realms/${this.realm}/users/${userId}/reset-password`;

      const data = {
        type: 'password',
        value: newPassword,
        temporary: false,
      };

      const response = await axios.put(url, data, {
        headers: {
          Authorization: `Bearer ${adminToken}`,
          'Content-Type': 'application/json',
        },
      });

      return { message: 'Password updated successfully', response: response.data };
    } catch (error) {
      if (error.response) {
        if (error.response.status === 404) {
          console.error('User not found:', error.response.data);
          throw new NotFoundException('User not found in Keycloak.');
        } else if (error.response.status === 401) {
          console.error('Invalid token:', error.response.data);
          throw new UnauthorizedException('Invalid token.');
        }
      }
      console.error('Error updating password:', error.response?.data || error.message);
      throw new Error('Failed to update password');
    }
  }

  async createUserWithToken(userData: any, token: string): Promise<any> {
    const url = `${this.keycloakUrl}/admin/realms/${this.realm}/users`;

    try {
      userData.attributes = {
        ...(userData.attributes || {}),
        type_document: userData.type_document,
        nro_document: userData.nro_document,
      };

      await axios.post(url, userData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      return { message: 'User created successfully' };
    } catch (error) {
      if (error.response && error.response.status === 409) {
        return { message: 'User already exists' };
      } else {
        console.error('Error creating user:', error.message);
        throw error;
      }
    }
  }

  async findUserByUsername(username: string, token: string): Promise<any> {
    try {
      const url = `${this.keycloakUrl}/admin/realms/${this.realm}/users?username=${username}`;
      const response = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data.length > 0 ? response.data[0] : null;
    } catch (error) {
      if (error.response) {
        if (error.response.status === 404) {
          console.error(`User not found: ${username}`, error.response.data);
          throw new NotFoundException(`User not found in Keycloak: ${username}`);
        } else if (error.response.status === 401) {
          console.error('Invalid token:', error.response.data);
          throw new UnauthorizedException('Invalid token.');
        }
      }
      console.error(`Error fetching user ${username}:`, error.response?.data || error.message);
      throw new Error(`Failed to fetch user ${username} from Keycloak.`);
    }
  }

  public async getUserDetails(userId: string): Promise<any> {
    try {
      const accessToken = await this.authService.getAdminToken();
      const response = await axios.get(`${this.keycloakUrl}/admin/realms/${this.realm}/users/${userId}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      const user = response.data;
      const rolesResponse = await axios.get(`${this.keycloakUrl}/admin/realms/${this.realm}/users/${userId}/role-mappings`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      const groupsResponse = await axios.get(`${this.keycloakUrl}/admin/realms/${this.realm}/users/${userId}/groups`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      return {
        ...user,
        roles: rolesResponse.data,
        groups: groupsResponse.data,
      };
    } catch (error) {
      if (error.response) {
        if (error.response.status === 404) {
          console.error('User not found:', error.response.data);
          throw new NotFoundException('User not found in Keycloak.');
        } else if (error.response.status === 401) {
          console.error('Invalid token:', error.response.data);
          throw new UnauthorizedException('Invalid token.');
        }
      }
      console.error('Error fetching user details:', error.response?.data || error.message);
      throw new Error('Failed to fetch user details from Keycloak.');
    }
  }

  public async isUserEnabled(userId: string): Promise<boolean> {
    try {
      let accessToken = await this.authService.getAdminToken();
      const response = await axios.get(`${this.keycloakUrl}/admin/realms/${this.realm}/users/${userId}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      return response.data.enabled;
    } catch (error) {
      if (error.response) {
        if (error.response.status === 404) {
          console.error('User not found:', error.response.data);
          throw new NotFoundException('User not found in Keycloak.');
        } else if (error.response.status === 401) {
          console.error('Invalid token:', error.response.data);
          throw new UnauthorizedException('Invalid token.');
        }
      }
      console.error('Error fetching user enabled status:', error.response?.data || error.message);
      throw new Error('Failed to fetch user enabled status from Keycloak.');
    }
  }

  public async updateUserEnabled(userId: string, enabled: boolean): Promise<void> {
    try {
      let accessToken = await this.authService.getAdminToken();
      await axios.put(
        `${this.keycloakUrl}/admin/realms/${this.realm}/users/${userId}`,
        { enabled },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        },
      );
    } catch (error) {
      if (error.response) {
        if (error.response.status === 404) {
          console.error('User not found:', error.response.data);
          throw new NotFoundException('User not found in Keycloak.');
        } else if (error.response.status === 401) {
          console.error('Invalid token:', error.response.data);
          throw new UnauthorizedException('Invalid token.');
        }
      }
      console.error('Error updating user enabled status:', error.response?.data || error.message);
      throw new Error('Failed to update user status in Keycloak.');
    }
  }










}

