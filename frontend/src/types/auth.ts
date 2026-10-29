export type Role = 'TEACHER' | 'REVIEWER' | 'ADMIN';

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: Role;
}

export interface LoginResponse {
  access_token: string;
  user: User;
}