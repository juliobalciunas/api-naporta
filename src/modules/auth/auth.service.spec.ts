import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcryptjs';
import { UsersService } from '../users/users.service';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let usersService: any;
  let jwtService: any;

  beforeEach(async () => {
    usersService = {
      findByEmail: jest.fn(),
      create: jest.fn(),
    };
    jwtService = {
      sign: jest.fn().mockReturnValue('mocked-jwt-token'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: usersService },
        { provide: JwtService, useValue: jwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('deve realizar login com sucesso para credenciais válidas', async () => {
    const hashedPassword = await bcrypt.hash('senha123', 10);
    usersService.findByEmail.mockResolvedValue({
      id: 'user-id-1',
      name: 'Julio Silva',
      email: 'julio@naporta.com.br',
      password: hashedPassword,
      role: 'ADMIN',
    });

    const result = await service.login({
      email: 'julio@naporta.com.br',
      password: 'senha123',
    });

    expect(result.accessToken).toBe('mocked-jwt-token');
    expect(result.user.email).toBe('julio@naporta.com.br');
  });

  it('deve lançar UnauthorizedException se o usuário não for encontrado', async () => {
    usersService.findByEmail.mockResolvedValue(null);

    await expect(
      service.login({ email: 'inexistente@naporta.com.br', password: 'senha' }),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('deve lançar UnauthorizedException se a senha estiver incorreta', async () => {
    const hashedPassword = await bcrypt.hash('senha-correta', 10);
    usersService.findByEmail.mockResolvedValue({
      id: 'user-id-1',
      email: 'julio@naporta.com.br',
      password: hashedPassword,
    });

    await expect(
      service.login({ email: 'julio@naporta.com.br', password: 'senha-errada' }),
    ).rejects.toThrow(UnauthorizedException);
  });
});
