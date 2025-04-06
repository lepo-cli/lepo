export const DIR = ".lepo";

export type Role = "user" | "lepo" | "meta";

export type BubbMeta = {
  readonly prev?: string;
  readonly role: Role;
  readonly isHidden: boolean;
  readonly path: string;
};

export type BubbName = {
  readonly id: string;
  readonly meta: BubbMeta;
};
