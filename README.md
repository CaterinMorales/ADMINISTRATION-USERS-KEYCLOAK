<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

# NestJS Project

## Description

Este proyecto es una aplicación NestJS que permite la gestión de usuarios y su integración con Keycloak.

## Project setup

```bash
$ npm install
```
## Compile and run the project

# development
$ npm run start

# watch mode (hot reload)
$ npm run start:dev

## Available Endpoints
### Auth Endpoints
POST /auth/login

Descripción: Inicia sesión con las credenciales proporcionadas.
Body:
   ```json
   {
      "username": "string",
      "password": "string"
    }
   ```

## Users Endpointsç

POST /users/bulk-insert

Descripción: Inserta masivamente usuarios desde la base de datos a Keycloak.
Body: No requiere cuerpo.

POST /users

Descripción: Crea un nuevo usuario en Keycloak.
Body:
```json
   {
  "username": "string",
  "email": "string",
  "firstName": "string",
  "lastName": "string",
  "password": "string"
}
   ```

PUT /users/:username/password

Descripción: Actualiza la contraseña de un usuario existente.
Body:
```json
{
  "password": "string"
}
```