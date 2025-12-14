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

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  private ensureUsernameRules(username: string) {
    if (!/^[\p{L}\p{N}_]+$/u.test(username) || username.length > 12) {
      throw new BadRequestException(
        'Username must be 1-12 chars, only letters/numbers/underscore.',
      );
    }
  }

  private ensurePasswordRules(password: string) {
    if (!/^[A-Za-z0-9]{1,10}$/.test(password)) {
      throw new BadRequestException(
        'Password must be 1-10 chars, letters/numbers only.',
      );
    }
  }

  /**
   * 开发期：确保至少有一个可登录的管理员账号，避免“先做管理端但没法登录”的死锁。
   * 可通过环境变量覆盖：
   * - ADMIN_EMAIL
   * - ADMIN_PASSWORD
   */
  async ensureDevAdmin(): Promise<void> {
    const email = this.config.get<string>('ADMIN_EMAIL', 'admin@example.com');
    const password = this.config.get<string>('ADMIN_PASSWORD', 'admin123');
    const username = this.config.get<string>('ADMIN_USERNAME', 'admin');

    const existing = await this.userRepository.findOne({
      where: [{ email }, { username }],
    });
    if (existing) return;

    const passwordHash = await bcrypt.hash(password, 10);
    const user = this.userRepository.create({
      username,
      email,
      passwordHash,
      role: 'admin',
    });
    await this.userRepository.save(user);
  }

  async validateUser(
    identifier: { email?: string; username?: string },
    password: string,
  ): Promise<User> {
    if (!identifier.email && !identifier.username) {
      throw new BadRequestException('Email or username is required');
    }

    const user = await this.userRepository.findOne({
      where: identifier.email
        ? { email: identifier.email }
        : { username: identifier.username },
    });
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) throw new UnauthorizedException('Invalid credentials');
    return user;
  }

  async login(
    identifier: { email?: string; username?: string },
    password: string,
  ): Promise<{ access_token: string }> {
    const user = await this.validateUser(identifier, password);
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      username: user.username,
    };
    return { access_token: await this.jwtService.signAsync(payload) };
  }

  async register(
    username: string,
    email: string,
    password: string,
  ): Promise<Pick<User, 'id' | 'email' | 'role' | 'username'>> {
    const existingEmail = await this.userRepository.findOne({ where: { email } });
    if (existingEmail) {
      throw new BadRequestException('Email already registered');
    }

    const existingUsername = await this.userRepository.findOne({
      where: { username },
    });
    if (existingUsername) {
      throw new BadRequestException('Username already registered');
    }

    this.ensureUsernameRules(username);
    this.ensurePasswordRules(password);

    const passwordHash = await bcrypt.hash(password, 10);
    const user = this.userRepository.create({
      username,
      email,
      passwordHash,
      role: 'user',
    });
    const saved = await this.userRepository.save(user);
    return {
      id: saved.id,
      email: saved.email,
      role: saved.role,
      username: saved.username,
    };
  }
}
