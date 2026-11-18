export interface Page<T, C> {
  items: T[];
  nextCursor: C | null;
}

export interface PageParams<C> {
  cursor: C | null;
  limit: number;
}
