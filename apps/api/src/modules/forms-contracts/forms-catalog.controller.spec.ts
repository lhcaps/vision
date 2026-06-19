import { IS_PUBLIC_KEY } from '../auth/public.decorator';
import { ResourceNotFoundError } from '../../common/application-error';
import { FormsCatalogController } from './forms-catalog.controller';

describe('FormsCatalogController', () => {
  it('is public so the runtime catalog can be health-checked', () => {
    expect(Reflect.getMetadata(IS_PUBLIC_KEY, FormsCatalogController)).toBe(
      true,
    );
  });

  it('throws a typed not-found error for an unknown contract', async () => {
    const catalog = {
      getContract: jest.fn().mockResolvedValue(null),
    };
    const controller = new FormsCatalogController(catalog as never);

    await expect(controller.getContract('BM-999')).rejects.toMatchObject({
      code: 'FORM_CONTRACT_NOT_FOUND',
      message: 'Contract not found: BM-999',
      status: 404,
    } satisfies Partial<ResourceNotFoundError>);
  });
});
