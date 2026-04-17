import { Test, TestingModule } from '@nestjs/testing';
import { OrganosController } from './organos.controller';
import { OrganosService } from './organos.service';

describe('OrganosController', () => {
  let controller: OrganosController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OrganosController],
      providers: [OrganosService],
    }).compile();

    controller = module.get<OrganosController>(OrganosController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
