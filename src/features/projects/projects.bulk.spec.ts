import { jest } from '@jest/globals';
import { Repository } from 'typeorm';
import { ProjectsService } from './projects.service';
import { ProjectsEntity } from './entity/projects.entity';
import { TechnologiesEntity } from '../technologies/entity/technologies.entity';
import { CreateProjectDto } from './dto/project.dto';

const item: CreateProjectDto = {
  slug: 'first',
  code: 'PR',
  name: 'Project',
  category: 'Business',
  headline: 'Headline',
  description: 'Description',
  technologyIds: [],
};
describe('Projects bulk creation', () => {
  afterEach(() => jest.restoreAllMocks());
  it('rejects duplicate slugs before opening a transaction', async () => {
    const transaction = jest.fn();
    const service = new ProjectsService(
      { manager: { transaction } } as unknown as Repository<ProjectsEntity>,
      {} as Repository<TechnologiesEntity>,
    );
    await expect(service.createBulk([item, item])).rejects.toThrow(
      'Duplicate slugs',
    );
    expect(transaction).not.toHaveBeenCalled();
  });
  it('uses transaction repositories and propagates a failed item to roll back', async () => {
    const projects = {};
    const technologies = {};
    const getRepository = jest.fn((entity) =>
      entity === ProjectsEntity ? projects : technologies,
    );
    const transaction = jest.fn(async (callback) =>
      callback({ getRepository }),
    );
    const service = new ProjectsService(
      { manager: { transaction } } as unknown as Repository<ProjectsEntity>,
      {} as Repository<TechnologiesEntity>,
    );
    const create = jest
      .spyOn(ProjectsService.prototype, 'create')
      .mockResolvedValueOnce({ id: '1' } as ProjectsEntity)
      .mockRejectedValueOnce(new Error('Invalid technology'));
    await expect(
      service.createBulk([item, { ...item, slug: 'second' }]),
    ).rejects.toThrow('Invalid technology');
    expect(getRepository).toHaveBeenCalledWith(ProjectsEntity);
    expect(getRepository).toHaveBeenCalledWith(TechnologiesEntity);
    expect(create).toHaveBeenCalledTimes(2);
  });
});
