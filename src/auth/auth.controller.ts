import { Body, Controller, Post } from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @ApiOperation({ summary: '登录（用户名），返回 access_token' })
  @ApiOkResponse({
    description:
      '登录成功返回 JWT access_token（用于 Authorization: Bearer <token>）',
  })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto.username, dto.password);
  }

  @Post('register')
  @ApiOperation({ summary: '注册账号（用户名+邀请码+密码，角色由邀请码决定）' })
  @ApiCreatedResponse({ description: '注册成功返回基本用户信息' })
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto.username, dto.password, dto.inviteCode);
  }
}
