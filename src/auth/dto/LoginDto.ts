import { IsString, IsNotEmpty } from 'class-validator';

export class LoginDto {
  @IsString()
  @IsNotEmpty({ message: 'The username is required.' })
  username: string;

  @IsString()
  @IsNotEmpty({ message: 'The password is required.' })
  password: string;
}
