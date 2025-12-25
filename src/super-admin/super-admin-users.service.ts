import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../auth/user.entity';
import { ensurePasswordRules, ensureUsernameRules } from '../auth/auth.validation';
import { CreateManagedUserDto } from './dto/create-managed-user.dto';
import { UpdateManagedUserRoleDto } from './dto/update-managed-user-role.dto';

const MANAGED_ROLES = ['user', 'admin'] as const;
type ManagedRole = (typeof MANAGED_ROLES)[number];

@Injectable()
export class SuperAdminUsersService {
  constructor(@InjectRepository(User) private readonly userRepository: Repository<User>) {}

  async findAll(): Promise<Array<Pick<User, 'id' | 'username' | 'role' | 'createdAt' | 'updatedAt'>>> {
    return this.userRepository.find({
      where: { role: In(MANAGED_ROLES) },
      order: { createdAt: 'DESC' },
      select: ['id', 'username', 'role', 'createdAt', 'updatedAt'],
    });
  }

  async create(dto: CreateManagedUserDto): Promise<Pick<User, 'id' | 'username' | 'role'>> {
    ensureUsernameRules(dto.username);
    ensurePasswordRules(dto.password);

    const existing = await this.userRepository.findOne({
      where: { username: dto.username },
    });
    if (existing) {
      throw new BadRequestException('Username already registered');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = this.userRepository.create({
      username: dto.username,
      passwordHash,
      role: dto.role as ManagedRole,
    });
    const saved = await this.userRepository.save(user);
    return { id: saved.id, username: saved.username, role: saved.role };
  }

  async updateRole(
    id: string,
    dto: UpdateManagedUserRoleDto,
  ): Promise<Pick<User, 'id' | 'username' | 'role'>> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    if (user.role === 'super_admin') {
      throw new BadRequestException('super_admin accounts are not editable');
    }

    user.role = dto.role;
    const saved = await this.userRepository.save(user);
    return { id: saved.id, username: saved.username, role: saved.role };
  }

  async remove(id: string, currentUserId: string): Promise<void> {
    if (id === currentUserId) {
      throw new BadRequestException('Cannot delete yourself');
    }

    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    if (user.role === 'super_admin') {
      throw new BadRequestException('super_admin accounts are not removable');
    }

    await this.userRepository.delete({ id });
  }
}
