import { IPaginationOptions, IPaginationMeta, Pagination } from 'nestjs-typeorm-paginate';

export interface PaginationParams {
  page?: number;
  limit?: number;
  offset?: number;
}

export interface PaginationResponse<T> {
  items: T[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

export function createPaginationOptions(
  params: PaginationParams,
  defaultLimit = 20,
  maxLimit = 100,
): IPaginationOptions {
  // Ensure limits are within bounds
  const limit = Math.min(
    params.limit !== undefined ? Math.max(1, params.limit) : defaultLimit,
    maxLimit
  );

  // If offset is provided, convert to page
  if (params.offset !== undefined) {
    const offset = Math.max(0, params.offset);
    const page = Math.floor(offset / limit) + 1;
    return { limit, page };
  }

  // Otherwise use page directly
  const page = params.page !== undefined ? Math.max(1, params.page) : 1;
  return { page, limit };
}

export function mapPaginationToResponse<T>(
  pagination: Pagination<T, IPaginationMeta>,
): PaginationResponse<T> {
  const { items, meta } = pagination;
  const offset = (meta.currentPage - 1) * meta.itemsPerPage;

  return {
    items,
    pagination: {
      total: meta.totalItems ?? 0,
      limit: meta.itemsPerPage,
      offset,
      hasMore: offset + meta.itemsPerPage < (meta.totalItems ?? 0),
    },
  };
}
