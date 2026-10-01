import { jest } from '@jest/globals';

import { PermissionsEntity } from '../modules/permissions/entity/permissions.entity';
import { RolesEntity } from '../modules/roles/entity/roles.entity';
import {
  DefaultAdminSeedService,
  readDefaultAdminSeedInput,
} from './default-admin.seed.service';

const insertQuery = () => {
  const query = {
    insert: jest.fn(),
    into: jest.fn(),
    values: jest.fn(),
    orIgnore: jest.fn(),
    execute: jest.fn(),
  };
  query.insert.mockReturnValue(query);
  query.into.mockReturnValue(query);
  query.values.mockReturnValue(query);
  query.orIgnore.mockReturnValue(query);
  query.execute.mockResolvedValue(undefined);
  return query;
};

describe('DefaultAdminSeedService', () => {
  it('creates ADMIN and DEVELOPER with every persisted permission', async () => {
    const permissionQuery = insertQuery();
    const roleQuery = insertQuery();
    const permissions = [{ id: 'permission-1' }, { id: 'permission-2' }];
    const roles = [
      { id: 'role-admin', name: 'ADMIN', deletedAt: null },
      { id: 'role-developer', name: 'DEVELOPER', deletedAt: null },
    ];
    const permissionRepository = {
      createQueryBuilder: jest.fn(() => permissionQuery),
      find: jest.fn().mockResolvedValue(permissions),
    };
    const roleRepository = {
      createQueryBuilder: jest.fn(() => roleQuery),
      find: jest.fn().mockResolvedValue(roles),
      recover: jest.fn(),
      save: jest.fn().mockResolvedValue(roles),
    };
    const userRepository = {
      find: jest.fn().mockResolvedValue([]),
      create: jest.fn((value: unknown) => value),
      save: jest.fn(),
    };
    const manager = {
      getRepository: (entity: unknown) =>
        entity === PermissionsEntity
          ? permissionRepository
          : entity === RolesEntity
            ? roleRepository
            : userRepository,
    };
    const dataSource = {
      transaction: jest.fn(
        (work: (transactionManager: typeof manager) => unknown) =>
          work(manager),
      ),
    };
    const passwords = {
      hash: jest.fn().mockResolvedValue('argon2id-hash'),
    };
    const service = new DefaultAdminSeedService(
      dataSource as never,
      passwords as never,
    );

    await service.run({
      firstname: 'Admin',
      lastname: 'User',
      username: 'admin',
      email: 'admin@example.com',
      password: 'a-long-password',
    });

    expect(roles).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: 'ADMIN', permissions }),
        expect.objectContaining({ name: 'DEVELOPER', permissions }),
      ]),
    );
    expect(roleRepository.save).toHaveBeenCalledWith(roles);
    expect(userRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        emailVerifiedAt: expect.any(Date),
        password: 'argon2id-hash',
        roles,
      }),
    );
  });

  it('requires a password rather than storing a default credential', () => {
    expect(() =>
      readDefaultAdminSeedInput({ DEFAULT_ADMIN_EMAIL: 'admin@example.com' }),
    ).toThrow('DEFAULT_ADMIN_PASSWORD is required');
  });
});
