import { Test, TestingModule } from '@nestjs/testing';
import { OrganosService } from './organos.service';

describe('OrganosService', () => {
  let service: OrganosService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [OrganosService],
    }).compile();

    service = module.get<OrganosService>(OrganosService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
