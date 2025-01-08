import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
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

  async bulkInsertUsers(): Promise<void> {
    const users = await this.usersRepository.find();
    let adminToken = await this.authService.getAdminToken();
    console.log("token: ", adminToken);

    for (let i = 0; i < users.length; i++) {
      const user = users[i];
      console.log(`Procesando usuario ${i + 1}/${users.length}: ${user.usuario}`);

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

        // Verificar si el usuario existe
        const existingUser = await this.authService.findUserByUsername(user.usuario, adminToken);

        if (existingUser) {
          console.log(`Usuario ${user.usuario} ya existe, actualizando...`);
          await this.updateUser(existingUser.id, userData, adminToken);
        } else {
          // Crear nuevo usuario si no existe
          await this.authService.createUserWithToken(userData, adminToken);
        }
      } catch (error) {
        if (error.response && error.response.status === 401) {
          console.warn('Token expirado. Generando un nuevo token...');
          adminToken = await this.authService.getAdminToken();
          try {
            await this.authService.createUserWithToken(userData, adminToken);
          } catch (retryError) {
            console.error(
              `Error al crear usuario ${user.usuario} tras regenerar el token:`,
              retryError.message
            );
          }
        } else {
          console.error(`Error al crear/actualizar usuario ${user.usuario}:`, error.message);
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
      console.log(`Usuario ${userData.username} actualizado con éxito`);
    } catch (error) {
      console.error(`Error al actualizar usuario ${userData.username}:`, error.message);
      throw error;
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
      console.error(`Error al buscar usuario ${username}:`, error.message);
      throw error;
    }
  }

  async updatePasswordByUsername(username: string, newPassword: string): Promise<any> {
    try {
      const adminToken = await this.authService.getAdminToken();
  
      const user = await this.findUserByUsername(username, adminToken);
  
      if (!user) {
        throw new Error(`Usuario con username "${username}" no encontrado`);
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
  
      return { message: 'Contraseña actualizada con éxito', response: response.data };
    } catch (error) {
      console.error('Error al actualizar la contraseña:', error.response?.data || error.message);
      throw new Error('No se pudo actualizar la contraseña');
    }
  }
  


}

