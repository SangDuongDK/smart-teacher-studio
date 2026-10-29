import { IsEmail, IsEnum, IsNotEmpty, IsOptional, MinLength } from 'class-validator';
import { Role } from '@prisma/client';

export class RegisterDto {
  @IsNotEmpty({ message: 'Họ và tên không được để trống.' })
  fullName: string;

  @IsEmail({}, { message: 'Định dạng email không hợp lệ.' })
  @IsNotEmpty({ message: 'Email không được để trống.' })
  email: string;

  @IsNotEmpty({ message: 'Mật khẩu không được để trống.' })
  @MinLength(6, { message: 'Mật khẩu phải chứa ít nhất 6 ký tự.' })
  password: string;

  @IsOptional()
  @IsEnum(Role, { message: 'Vai trò phải là TEACHER, REVIEWER hoặc ADMIN.' })
  role?: Role;
}