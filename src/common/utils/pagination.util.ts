/**
 * Utility functions for pagination
 */

export interface PaginationOptions {
  page: number;
  pageSize: number;
}

export interface PaginationResult {
  skip: number;
  take: number;
  totalPages: number;
}

/**
 * Calculate pagination parameters
 */
export function calculatePagination(
  page: number,
  pageSize: number,
  maxPageSize: number = 100,
): PaginationResult {
  const normalizedPage = Math.max(1, page);
  const normalizedPageSize = Math.min(Math.max(1, pageSize), maxPageSize);
  const skip = (normalizedPage - 1) * normalizedPageSize;
  const totalPages = 0; // Will be calculated based on total count

  return {
    skip,
    take: normalizedPageSize,
    totalPages,
  };
}

/**
 * Calculate total pages from total count and page size
 */
export function calculateTotalPages(total: number, pageSize: number): number {
  return Math.ceil(total / pageSize);
}
