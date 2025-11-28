/**
 * @fileoverview AuthService 単体テスト
 */

import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';

// bcrypt をモック
jest.mock('bcrypt');

describe('AuthService', () => {
  let service: AuthService;
  let prisma: PrismaService;
  let jwtService: JwtService;

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  };

  const mockJwtService = {
    sign: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prisma = module.get<PrismaService>(PrismaService);
    jwtService = module.get<JwtService>(JwtService);

    // 各テスト前にモックをリセット
    jest.clearAllMocks();
  });

  describe('signup', () => {
    const signupDto = {
      email: 'test@example.com',
      password: 'password123',
      username: 'testuser',
    };

    it('新規ユーザーを正常に登録できる', async () => {
      const hashedPassword = 'hashedPassword123';
      const createdUser = {
        id: 1,
        email: signupDto.email,
        username: signupDto.username,
        password: hashedPassword,
        createdAt: new Date(),
      };

      mockPrismaService.user.findUnique.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);
      mockPrismaService.user.create.mockResolvedValue(createdUser);

      const result = await service.signup(signupDto);

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: signupDto.email },
      });
      expect(bcrypt.hash).toHaveBeenCalledWith(signupDto.password, 10);
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: {
          email: signupDto.email,
          username: signupDto.username,
          password: hashedPassword,
        },
      });
      expect(result).toEqual({
        id: 1,
        email: signupDto.email,
        username: signupDto.username,
        createdAt: createdUser.createdAt,
      });
      // パスワードが含まれていないことを確認
      expect(result).not.toHaveProperty('password');
    });

    it('メールアドレスが既に存在する場合は ConflictException をスローする', async () => {
      mockPrismaService.user.findUnique.mockResolvedValueOnce({
        id: 1,
        email: signupDto.email,
      });

      await expect(service.signup(signupDto)).rejects.toThrow(
        new ConflictException('Email already exists'),
      );
    });

    it('ユーザー名が既に存在する場合は ConflictException をスローする', async () => {
      // email チェックは null を返す
      mockPrismaService.user.findUnique.mockResolvedValueOnce(null);
      // username チェックで既存ユーザーを返す
      mockPrismaService.user.findUnique.mockResolvedValueOnce({
        id: 2,
        username: signupDto.username,
      });

      await expect(service.signup(signupDto)).rejects.toThrow(
        new ConflictException('Username already exists'),
      );
    });
  });

  describe('login', () => {
    const loginDto = {
      email: 'test@example.com',
      password: 'password123',
    };

    const existingUser = {
      id: 1,
      email: loginDto.email,
      username: 'testuser',
      password: 'hashedPassword123',
      createdAt: new Date(),
    };

    it('正しい認証情報でログインできる', async () => {
      const accessToken = 'jwt-token-123';

      mockPrismaService.user.findUnique.mockResolvedValue(existingUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      mockJwtService.sign.mockReturnValue(accessToken);

      const result = await service.login(loginDto);

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: loginDto.email },
      });
      expect(bcrypt.compare).toHaveBeenCalledWith(loginDto.password, existingUser.password);
      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: existingUser.id,
        email: existingUser.email,
      });
      expect(result).toEqual({ accessToken });
    });

    it('存在しないメールアドレスの場合は UnauthorizedException をスローする', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(
        new UnauthorizedException('Invalid credentials'),
      );
    });

    it('パスワードが一致しない場合は UnauthorizedException をスローする', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(existingUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.login(loginDto)).rejects.toThrow(
        new UnauthorizedException('Invalid credentials'),
      );
    });
  });
});
