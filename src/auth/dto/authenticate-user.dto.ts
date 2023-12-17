import { IsNotEmpty, IsEmail } from 'class-validator';

export class AuthenticateUserDto {
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  password: string;
}
