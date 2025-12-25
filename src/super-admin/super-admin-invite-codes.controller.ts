import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { SuperAdminInviteCodesService } from './super-admin-invite-codes.service';
import { CreateInviteCodeDto } from './dto/create-invite-code.dto';
import { UpdateInviteCodeDto } from './dto/update-invite-code.dto';
import { ListInviteCodesQueryDto } from './dto/list-invite-codes.query.dto';

@ApiTags('super-admin.invite-codes')
@ApiBearerAuth('BearerAuth')
@ApiUnauthorizedResponse({ description: '未登录或 token 无效' })
@Roles('super_admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('super-admin/invite-codes')
export class SuperAdminInviteCodesController {
  constructor(private readonly inviteCodesService: SuperAdminInviteCodesService) {}

  @Get()
  @ApiOperation({ summary: 'super_admin：获取邀请码列表（按角色）' })
  @ApiOkResponse({ description: '邀请码列表' })
  list(@Query() query: ListInviteCodesQueryDto) {
    return this.inviteCodesService.list(query.role);
  }

  @Post()
  @ApiOperation({ summary: 'super_admin：创建邀请码（user/admin）' })
  create(@Body() dto: CreateInviteCodeDto) {
    return this.inviteCodesService.create(dto);
  }

  @Patch(':code')
  @ApiOperation({ summary: 'super_admin：更新邀请码启用状态' })
  @ApiParam({ name: 'code', description: 'Invite code (XXXX-XXXX)' })
  update(@Param('code') code: string, @Body() dto: UpdateInviteCodeDto) {
    return this.inviteCodesService.update(code, dto.enabled);
  }

  @Delete(':code')
  @ApiOperation({ summary: 'super_admin：删除邀请码' })
  @ApiParam({ name: 'code', description: 'Invite code (XXXX-XXXX)' })
  async remove(@Param('code') code: string) {
    await this.inviteCodesService.remove(code);
  }
}
