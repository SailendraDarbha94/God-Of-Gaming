import { describe, expect, it } from 'vitest';
import { describeCatalogRepository } from '../testing/catalog-contract';
import { FixtureCatalogRepository } from './fixture-catalog';

describeCatalogRepository('FixtureCatalogRepository', () => new FixtureCatalogRepository());

describe('FixtureCatalogRepository copies', () => {
  it('hands out copies, so a caller cannot alter the dataset', async () => {
    const repository = new FixtureCatalogRepository();
    const first = await repository.getCafe('pixel-den-koramangala');
    if (first === null) {
      throw new Error('Pixel Den is missing from the fixtures');
    }
    first.name = 'Changed';
    first.tiers.pop();
    const second = await repository.getCafe('pixel-den-koramangala');
    expect(second?.name).toBe('Pixel Den');
    expect(second?.tiers).toHaveLength(3);
  });
});
