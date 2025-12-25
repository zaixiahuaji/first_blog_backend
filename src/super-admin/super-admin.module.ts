import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../auth/user.entity';
import { InviteCode } from '../auth/invite-code.entity';
import { SuperAdminUsersController } from './super-admin-users.controller';
import { SuperAdminInviteCodesController } from './super-admin-invite-codes.controller';
import { SuperAdminUsersService } from './super-admin-users.service';
import { SuperAdminInviteCodesService } from './super-admin-invite-codes.service';

@Module({
  imports: [TypeOrmModule.forFeature([User, InviteCode])],
  controllers: [SuperAdminUsersController, SuperAdminInviteCodesController],
  providers: [SuperAdminUsersService, SuperAdminInviteCodesService],
})
export class SuperAdminModule {}
