// filepath: src/users/user.entity.ts
import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  nombre: string;

  @Column()
  apellido: string;

  @Column()
  correo: string;

  @Column()
  usuario: string;

  @Column()
  password: string;

  @Column()
  typeDocument: string;

  @Column('bigint')
  nroDocument: number;
}