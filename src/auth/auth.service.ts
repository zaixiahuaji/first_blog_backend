import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';
import { User } from './user.entity';
import { InviteCode } from './invite-code.entity';
import { ensurePasswordRules, ensureUsernameRules } from './auth.validation';
import { ensureInviteCodeFormat } from './invite-code.utils';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    @InjectRepository(InviteCode)
    private readonly inviteRepository: Repository<InviteCode>,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  /**
   * 开发期：确保至少有一个可登录的 super_admin，避免“先做管理端但没法登录”的死锁。
   * 可通过环境变量覆盖：
   * - SUPER_ADMIN_USERNAME / SUPER_ADMIN_PASSWORD
   * - 兼容：ADMIN_USERNAME / ADMIN_PASSWORD
   */
  async ensureDevSuperAdmin(): Promise<void> {
    const username =
      this.config.get<string>('SUPER_ADMIN_USERNAME') ??
      this.config.get<string>('ADMIN_USERNAME', 'admin');
    const password =
      this.config.get<string>('SUPER_ADMIN_PASSWORD') ??
      this.config.get<string>('ADMIN_PASSWORD', 'admin123');

    ensureUsernameRules(username);
    ensurePasswordRules(password);

    const existingSuper = await this.userRepository.findOne({
      where: { role: 'super_admin' },
    });
    if (existingSuper) return;

    const existingByUsername = await this.userRepository.findOne({
      where: { username },
    });
    if (existingByUsername) {
      existingByUsername.role = 'super_admin';
      await this.userRepository.save(existingByUsername);
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = this.userRepository.create({
      username,
      passwordHash,
      role: 'super_admin',
    });
    await this.userRepository.save(user);
  }

  async validateUser(username: string, password: string): Promise<User> {
    if (!username) {
      throw new BadRequestException('Username is required');
    }

    const user = await this.userRepository.findOne({
      where: { username },
    });
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) throw new UnauthorizedException('Invalid credentials');
    return user;
  }

  async login(username: string, password: string): Promise<{ access_token: string }> {
    const user = await this.validateUser(username, password);
    const payload = {
      sub: user.id,
      role: user.role,
      username: user.username,
    };
    return { access_token: await this.jwtService.signAsync(payload) };
  }

  async register(
    username: string,
    password: string,
    inviteCode: string,
  ): Promise<Pick<User, 'id' | 'role' | 'username'>> {
    ensureUsernameRules(username);
    ensurePasswordRules(password);
    ensureInviteCodeFormat(inviteCode);

    return this.inviteRepository.manager.transaction(async (manager) => {
      const userRepo = manager.getRepository(User);
      const inviteRepo = manager.getRepository(InviteCode);

      const existingUsername = await userRepo.findOne({
        where: { username },
      });
      if (existingUsername) {
        throw new BadRequestException('Username already registered');
      }

      const invite = await inviteRepo.findOne({
        where: { code: inviteCode, enabled: true },
        lock: { mode: 'pessimistic_write' },
      });
      if (!invite) {
        throw new BadRequestException('Invite code is invalid or disabled');
      }
      if (invite.role !== 'user' && invite.role !== 'admin') {
        throw new BadRequestException('Invite code role is not supported');
      }

      const passwordHash = await bcrypt.hash(password, 10);
      const user = userRepo.create({
        username,
        passwordHash,
        role: invite.role,
      });
      const saved = await userRepo.save(user);

      invite.enabled = false;
      await inviteRepo.save(invite);

      return {
        id: saved.id,
        role: saved.role,
        username: saved.username,
      };
    });
  }
}
