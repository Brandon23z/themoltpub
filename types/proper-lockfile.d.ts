declare module 'proper-lockfile' {
  export interface LockOptions {
    retries?: {
      retries?: number;
      minTimeout?: number;
      maxTimeout?: number;
    };
    realpath?: boolean;
    stale?: number;
    update?: number;
  }

  export function lock(
    file: string,
    options?: LockOptions
  ): Promise<() => Promise<void>>;

  export function unlock(file: string): Promise<void>;
}
