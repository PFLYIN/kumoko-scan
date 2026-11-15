import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { paginate, toSkipTake } from './paginated';
import { PaginationQueryDto } from './pagination-query.dto';

describe('PaginationQueryDto', () => {
  it('aplica defaults page=1 e limit=12', () => {
    const dto = plainToInstance(PaginationQueryDto, {});
    expect(dto).toMatchObject({ page: 1, limit: 12 });
    expect(validateSync(dto)).toHaveLength(0);
  });

  it('converte strings da query e rejeita limit acima de 50', () => {
    const ok = plainToInstance(PaginationQueryDto, { page: '2', limit: '50' });
    expect(ok).toMatchObject({ page: 2, limit: 50 });
    expect(validateSync(ok)).toHaveLength(0);

    const tooBig = plainToInstance(PaginationQueryDto, { limit: '51' });
    expect(validateSync(tooBig)[0]?.property).toBe('limit');
  });
});

describe('paginate', () => {
  it('monta data + meta com totalPages', () => {
    expect(paginate(['a', 'b'], 25, { page: 2, limit: 12 })).toEqual({
      data: ['a', 'b'],
      meta: { page: 2, limit: 12, total: 25, totalPages: 3 },
    });
  });

  it('converte page/limit em skip/take', () => {
    expect(toSkipTake({ page: 3, limit: 12 })).toEqual({ skip: 24, take: 12 });
  });
});
