export const Paths = {
  cache: 'file:///cache',
  document: 'file:///documents',
};

export class Directory {
  readonly exists = false;
  readonly uri: string;

  constructor(...parts: unknown[]) {
    this.uri = parts.map(String).join('/');
  }

  create(): void {}

  list(): (Directory | File)[] {
    return [];
  }
}

export class File {
  readonly exists = false;
  readonly name: string;
  readonly uri: string;

  constructor(...parts: unknown[]) {
    this.uri = parts.map(String).join('/');
    this.name = String(parts.at(-1) ?? 'file');
  }

  create(): void {}

  delete(): void {}

  async bytes(): Promise<Uint8Array> {
    return new Uint8Array();
  }

  write(): void {}
}
