import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

describe('AuthService', () => {
  let service: AuthService;
  let usersService: Partial<UsersService>;
  let jwtService: Partial<JwtService>;

  beforeEach(async () => {
    // Mock UsersService
    const mockUsersService = {
      findOne: jest.fn(),
      create: jest.fn(),
    };
    // Mock JwtService
    const mockJwtService = {
      sign: jest.fn(() => 'test_token'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: mockUsersService },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get<UsersService>(UsersService);
    jwtService = module.get<JwtService>(JwtService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateUser', () => {
    it('should return null if user not found', async () => {
      (usersService.findOne as jest.Mock).mockResolvedValue(null);
      const result = await service.validateUser('test@test.com', 'pass');
      expect(result).toBeNull();
    });

    it('should return null if password does not match', async () => {
      const hashedPassword = await bcrypt.hash('password', 10);
      (usersService.findOne as jest.Mock).mockResolvedValue({
        id: 1,
        email: 'test@test.com',
        password: hashedPassword,
      });

      const result = await service.validateUser('test@test.com', 'wrongpass');
      expect(result).toBeNull();
    });

    it('should return user without password if password matches', async () => {
      const hashedPassword = await bcrypt.hash('password', 10);
      const user = {
        id: 1,
        email: 'test@test.com',
        password: hashedPassword,
        username: 'test',
      };
      (usersService.findOne as jest.Mock).mockResolvedValue(user);

      const result = await service.validateUser('test@test.com', 'password');
      expect(result).toBeDefined();
      expect(result).not.toHaveProperty('password');
      expect(result.email).toEqual(user.email);
    });
  });

  describe('login', () => {
    it('should return access_token', async () => {
      const hashedPassword = await bcrypt.hash('password', 10);
      const user = {
        id: 1,
        email: 'test@test.com',
        password: hashedPassword,
        username: 'test',
      };
      (usersService.findOne as jest.Mock).mockResolvedValue(user);

      const result = await service.login({
        email: 'test@test.com',
        password: 'password',
      });
      expect(result).toHaveProperty('access_token');
      expect(result.access_token).toEqual('test_token');
    });
  });
});
