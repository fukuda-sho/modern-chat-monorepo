import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { mockDeep } from 'jest-mock-extended';
import * as bcrypt from 'bcrypt';

describe('AuthController (e2e)', () => {
  let app: INestApplication;
  let prismaService: any;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(mockDeep<PrismaService>())
      .compile();

    app = moduleFixture.createNestApplication();
    prismaService = moduleFixture.get(PrismaService);
    await app.init();
  });

  it('/auth/signup (POST)', async () => {
    const signupDto = {
      email: 'test@example.com',
      password: 'password123',
      username: 'testuser',
    };

    // Mock Prisma behavior
    prismaService.user.create.mockResolvedValue({
      id: 1,
      ...signupDto,
      password: 'hashed_password',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const response = await request(app.getHttpServer())
      .post('/auth/signup')
      .send(signupDto)
      .expect(201);

    expect(response.body).toHaveProperty('email', signupDto.email);
    expect(response.body).not.toHaveProperty('password');
  });

  it('/auth/login (POST)', async () => {
    const loginDto = {
      email: 'test@example.com',
      password: 'password123',
    };

    const hashedPassword = await bcrypt.hash(loginDto.password, 10);

    prismaService.user.findUnique.mockResolvedValue({
      id: 1,
      email: loginDto.email,
      username: 'testuser',
      password: hashedPassword,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send(loginDto)
      .expect(200);

    expect(response.body).toHaveProperty('access_token');
  });

  it('/users/me (GET) - Unauthorized', () => {
    return request(app.getHttpServer())
      .get('/users/me')
      .expect(401);
  });
});

