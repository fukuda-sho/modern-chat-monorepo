import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { PrismaService } from '../prisma/prisma.service';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import * as bcrypt from 'bcrypt';

describe('UsersService', () => {
  let service: UsersService;
  let prisma: DeepMockProxy<PrismaService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: PrismaService,
          useValue: mockDeep<PrismaService>(),
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    prisma = module.get(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should hash the password and create a user', async () => {
      const userDto = {
        email: 'test@example.com',
        password: 'plainPassword',
        username: 'testuser',
      };

      prisma.user.create.mockResolvedValue({
        id: 1,
        ...userDto,
        password: 'hashedPassword', // Mock what DB returns
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      await service.create(userDto);

      expect(prisma.user.create).toHaveBeenCalled();

      // Check if the password passed to create was different from original (hashed)
      const createArgs = prisma.user.create.mock.calls[0][0];
      expect(createArgs.data.password).not.toEqual(userDto.password);
      
      // Verify it is a valid bcrypt hash of the original password
      const isMatch = await bcrypt.compare(userDto.password, createArgs.data.password);
      expect(isMatch).toBe(true);
    });
  });

  describe('findOne', () => {
    it('should return a user if found', async () => {
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        username: 'test',
        password: 'hashed',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      prisma.user.findUnique.mockResolvedValue(mockUser as any);

      const result = await service.findOne({ email: 'test@example.com' });
      expect(result).toEqual(mockUser);
    });

    it('should return null if not found', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      const result = await service.findOne({ email: 'notfound@example.com' });
      expect(result).toBeNull();
    });
  });
});
