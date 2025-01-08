## Description

This project is a NestJS application that allows user management and its integration with Keycloak.

## Project setup

```bash
$ npm install
```

## Compile and run the project
```bash
# development
$ npm run start

# watch mode (hot reload)
$ npm run start:dev
```

## Available Endpoints
### Auth Endpoints
* POST /auth/login

  Sign in with the provided credentials.
  Body:
     ```json
     {
        "username": "string",
        "password": "string"
     }
     ```

## Users Endpointsç

* POST /users/bulk-insert

  Massively insert users from the database to Keycloak. Does not require a body.

* POST /users

  Create a new user in Keycloak.
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


* PUT /users/:username/password

  Updates the password of an existing user.
  Body:
    ```json
    {
      "password": "string"
    }
    ```
