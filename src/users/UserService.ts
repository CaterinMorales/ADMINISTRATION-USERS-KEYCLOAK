// filepath: src/users/users.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuthService } from '../auth/auth.service';
import { User } from './user.entty';

@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(User)
        private usersRepository: Repository<User>,
        private authService: AuthService,
    ) { }

    async bulkInsertUsers(): Promise<void> {
        const users = await this.usersRepository.find();
        let adminToken = await this.authService.getAdminToken();

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
                credentials: [
                    {
                        type: 'password',
                        value: user.password,
                        temporary: false,
                    },
                ],
            };

            try {
                await this.authService.createUserWithToken(userData, adminToken);
            } catch (error) {
                if (error.response && error.response.status === 401) {
                    console.warn(`Token expirado. Generando un nuevo token...`);
                    // Regenera el token y reintenta
                    adminToken = await this.authService.getAdminToken();
                    try {
                        await this.authService.createUserWithToken(userData, adminToken);
                    } catch (retryError) {
                        console.error(`Error al crear usuario ${user.usuario} tras regenerar el token:`, retryError.message);
                    }
                } else {
                    console.error(`Error al crear usuario ${user.usuario}:`, error.message);
                }
            }
        }
    }

}

