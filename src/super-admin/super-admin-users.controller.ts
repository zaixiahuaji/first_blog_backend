import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
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
import { SuperAdminUsersService } from './super-admin-users.service';
import { CreateManagedUserDto } from './dto/create-managed-user.dto';
import { UpdateManagedUserRoleDto } from './dto/update-managed-user-role.dto';

type RequestUser = { userId?: string };

@ApiTags('super-admin.users')
@ApiBearerAuth('BearerAuth')
@ApiUnauthorizedResponse({ description: '未登录或 token 无效' })
@Roles('super_admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('super-admin/users')
export class SuperAdminUsersController {
  constructor(private readonly usersService: SuperAdminUsersService) {}

  @Get()
  @ApiOperation({ summary: 'super_admin：获取所有 user/admin 账号' })
  @ApiOkResponse({ description: '账号列表' })
  findAll() {
    return this.usersService.findAll();
  }

  @Post()
  @ApiOperation({ summary: 'super_admin：创建 user/admin 账号' })
  create(@Body() dto: CreateManagedUserDto) {
    return this.usersService.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'super_admin：修改账号角色（仅 user/admin）' })
  @ApiParam({ name: 'id', description: 'User UUID' })
  updateRole(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateManagedUserRoleDto,
  ) {
    return this.usersService.updateRole(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'super_admin：删除 user/admin 账号' })
  @ApiParam({ name: 'id', description: 'User UUID' })
  async remove(@Param('id', new ParseUUIDPipe()) id: string, @Req() req: { user?: RequestUser }) {
    const currentUserId = req.user?.userId ?? '';
    await this.usersService.remove(id, currentUserId);
  }
}
