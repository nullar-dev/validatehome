import type { Database } from "../index.js";

export type TransactionClient = Parameters<Parameters<Database["transaction"]>[0]>[0];

export type DbClient = Database | TransactionClient;

export interface PaginationOptions {
  page: number;
  limit: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export function paginate<T>(
  data: T[],
  total: number,
  options: PaginationOptions,
): PaginatedResult<T> {
  const normalizedLimit = options.limit > 0 ? options.limit : 1;
  return {
    data,
    total,
    page: options.page,
    limit: normalizedLimit,
    totalPages: Math.ceil(total / normalizedLimit),
  };
}
