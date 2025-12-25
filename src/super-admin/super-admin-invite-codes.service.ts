import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InviteCode } from '../auth/invite-code.entity';
import { ensureInviteCodeFormat, generateInviteCode } from '../auth/invite-code.utils';
import { CreateInviteCodeDto } from './dto/create-invite-code.dto';

const MANAGED_ROLES = ['user', 'admin'] as const;
type ManagedRole = (typeof MANAGED_ROLES)[number];

@Injectable()
export class SuperAdminInviteCodesService {
  constructor(
    @InjectRepository(InviteCode)
    private readonly inviteRepository: Repository<InviteCode>,
  ) {}

  async list(role: ManagedRole): Promise<InviteCode[]> {
    return this.inviteRepository.find({
      where: { role },
      order: { code: 'ASC' },
    });
  }

  async create(dto: CreateInviteCodeDto): Promise<InviteCode> {
    const role = dto.role as ManagedRole;
    if (!MANAGED_ROLES.includes(role)) {
      throw new BadRequestException('Invite role must be user/admin');
    }

    let code = dto.code;
    if (code) {
      ensureInviteCodeFormat(code);
      const existing = await this.inviteRepository.findOne({ where: { code } });
      if (existing) throw new BadRequestException('Invite code already exists');
    } else {
      for (let i = 0; i < 5; i += 1) {
        const candidate = generateInviteCode();
        const existing = await this.inviteRepository.findOne({ where: { code: candidate } });
        if (!existing) {
          code = candidate;
          break;
        }
      }
      if (!code) {
        throw new BadRequestException('Failed to generate invite code');
      }
    }

    const invite = this.inviteRepository.create({
      code,
      role,
      enabled: dto.enabled ?? true,
    });
    return this.inviteRepository.save(invite);
  }

  async update(code: string, enabled: boolean): Promise<InviteCode> {
    ensureInviteCodeFormat(code);
    const invite = await this.inviteRepository.findOne({ where: { code } });
    if (!invite) throw new NotFoundException('Invite code not found');

    invite.enabled = enabled;
    return this.inviteRepository.save(invite);
  }

  async remove(code: string): Promise<void> {
    ensureInviteCodeFormat(code);
    const result = await this.inviteRepository.delete({ code });
    if (!result.affected) {
      throw new NotFoundException('Invite code not found');
    }
  }
}
