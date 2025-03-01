import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import {
  ApiBody,
  ApiCookieAuth,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiResponse,
} from '@nestjs/swagger';
import { Request } from 'express';
import { UpdateUserThemeResponse } from './dto/userTheme.response';
import { UserService } from './user.service';
import { User } from '@/user/domain/user.entity';
import {
  ChangeNicknameRequest,
  ChangeThemeRequest,
  UserThemeResponse,
} from '@/user/dto/user.request';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  @ApiOperation({
    summary: '유저 닉네임과 서브 닉네임으로 유저 조회 API',
    description: '유저 닉네임과 서브 닉네임으로 유저를 조회합니다.',
  })
  @ApiQuery({ name: 'nickname', type: 'string', description: '유저 닉네임' })
  @ApiQuery({
    name: 'subName',
    type: 'string',
    description: '유저 서브네임',
    required: false,
  })
  async searchUser(
    @Query('nickname') nickname: string,
    @Query('subName') subName: string,
  ) {
    return await this.userService.searchUserByNicknameAndSubName(
      nickname,
      subName,
    );
  }

  @Get('info')
  @ApiOperation({
    summary: '유저 정보를 조회한다.',
    description: '유저 정보를 조회한다.',
  })
  async getUserInfo(@Req() request: Request) {
    if (!request.user) {
      throw new ForbiddenException('Forbidden access to user info');
    }
    const user = request.user as User;
    return await this.userService.getUserInfo(user.id);
  }

  @Post('info')
  @ApiOperation({
    summary: '유저 닉네임을 변경한다.',
    description: '유저 닉네임을 변경한다.',
  })
  @ApiOkResponse({
    description: '닉네임 변경 완료',
    example: { message: '닉네임 변경 완료', date: new Date() },
  })
  async updateNickname(
    @Req() request: Request,
    @Body() body: ChangeNicknameRequest,
  ) {
    if (!request.user) {
      throw new ForbiddenException('Forbidden access to change nickname');
    }
    const user = request.user as User;
    await this.userService.updateNickname(user.id, body.nickname);
    return { message: '닉네임 변경 완료', date: new Date() };
  }

  @Patch('theme')
  @HttpCode(HttpStatus.OK)
  @ApiCookieAuth()
  @ApiOperation({
    summary: '유저 테마 변경 API',
    description: '유저 테마를 라이트모드인지 다크모드인지 변경합니다.',
  })
  @ApiBody({
    type: ChangeThemeRequest,
  })
  @ApiResponse({ status: 400, description: 'isLight property is required' })
  @ApiResponse({ status: 403, description: 'Forbidden access to update theme' })
  @ApiResponse({
    status: 200,
    description: 'User theme updated successfully',
    type: UpdateUserThemeResponse,
  })
  async updateTheme(
    @Req() request: Request,
    @Body() changeThemeRequest: ChangeThemeRequest,
  ): Promise<UpdateUserThemeResponse> {
    if (!request.user) {
      throw new ForbiddenException('Forbidden access to update theme');
    }
    const id = (request.user as User).id;
    const isLight = changeThemeRequest.theme === 'light';
    const updatedUser = await this.userService.updateUserTheme(id, isLight);

    return {
      theme: updatedUser.isLight ? 'light' : 'dark',
      updatedAt: updatedUser.date.updatedAt,
    };
  }

  @Get('theme')
  @ApiOperation({
    summary: 'Get user theme mode',
    description:
      'Retrieve the current theme mode (light or dark) for a specific user',
  })
  @ApiResponse({
    status: 200,
    description: 'User theme retrieved successfully',
    type: UserThemeResponse,
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getTheme(@Req() request: Request): Promise<UserThemeResponse> {
    if (!request.user) {
      return { theme: 'light' };
    }
    const id = (request.user as User).id;
    const isLight = await this.userService.getUserTheme(id);
    return { theme: isLight ? 'light' : 'dark' };
  }
}
