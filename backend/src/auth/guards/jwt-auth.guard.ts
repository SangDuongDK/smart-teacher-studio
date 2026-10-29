import { ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator'; // Trỏ đúng đường dẫn vừa tạo ở Bước 2.1

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    // Kiểm tra xem method hoặc controller có gắn metadata @Public() không
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // Nếu có @Public(), cho phép đi qua luôn không cần check token
    if (isPublic) {
      return true;
    }

    // Nếu không, thực hiện xác thực JWT như bình thường
    return super.canActivate(context);
  }
}