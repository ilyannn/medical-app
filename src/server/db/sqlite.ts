export interface SqliteStatement<TResult = unknown> {
  run(...params: unknown[]): unknown;
  all(...params: unknown[]): TResult[];
}

export interface SqliteDatabase {
  exec(source: string): unknown;
  prepare<TResult = unknown>(source: string): SqliteStatement<TResult>;
  transaction<T extends (...args: never[]) => unknown>(fn: T): T;
  close(): void;
}
