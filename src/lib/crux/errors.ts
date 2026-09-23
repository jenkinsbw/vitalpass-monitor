export class CruxError extends Error {
  readonly status: number | undefined;

  constructor(message: string, status?: number) {
    super(message);
    this.name = "CruxError";
    this.status = status;
  }
}
