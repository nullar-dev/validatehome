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
  return {
    data,
    total,
    page: options.page,
    limit: options.limit,
    totalPages: Math.ceil(total / options.limit),
  };
}
