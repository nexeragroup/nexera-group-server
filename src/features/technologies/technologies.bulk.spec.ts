import { jest } from '@jest/globals';
import { Repository } from 'typeorm';
import { TechnologiesService } from './technologies.service';
import { TechnologiesEntity } from './entity/technologies.entity';
import { CreateTechnologyDto } from './dto/technology.dto';

describe('Technologies bulk creation', () => {
  afterEach(() => jest.restoreAllMocks());
  it('returns created items in request order within one transaction', async () => {
    const transaction = jest.fn(async (callback) =>
      callback({ getRepository: jest.fn(() => ({})) }),
    );
    const service = new TechnologiesService({
      manager: { transaction },
    } as unknown as Repository<TechnologiesEntity>);
    jest
      .spyOn(TechnologiesService.prototype, 'create')
      .mockImplementation(
        async (dto) => ({ slug: dto.slug }) as TechnologiesEntity,
      );
    const items = [
      { slug: 'angular' },
      { slug: 'nestjs' },
    ] as CreateTechnologyDto[];
    await expect(service.createBulk(items)).resolves.toEqual([
      { slug: 'angular' },
      { slug: 'nestjs' },
    ]);
    expect(transaction).toHaveBeenCalledTimes(1);
  });
});
