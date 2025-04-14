import { parse } from "@libs/xml/parse";

const NIL = Symbol();

export type ExecRes = {
  readonly stdout?: string;
  readonly stderr?: string;
  readonly code?: number;
  readonly signal?: string;
};

export type ExecReq = {
  readonly cmd: string;
  readonly args: ReadonlyArray<string>;
};

export const convert = (text: string): ReadonlyArray<ExecReq> => {
  const p = (() => {
    try {
      return parse(`<model>${text}</model>`);
    } catch {
      return NIL;
    }
  })();

  if (p === NIL) return [];

  const model = p.model;

  if (!model) return [];

  if (typeof model !== "object") return [];

  const execReq =
    (model as { ["execution-request"]: unknown })["execution-request"];

  return [execReq]
    .flat()
    .filter((er: unknown): er is { cmd: string; args: unknown } =>
      (er as boolean) &&
      typeof er === "object" &&
      typeof (er as { cmd: unknown }).cmd === "string"
    )
    .map(({ cmd, args }: { cmd: string; args: unknown }): ExecReq => ({
      cmd,
      args: !args
        ? []
        : Array.isArray(args)
        ? []
        : typeof args !== "object"
        ? []
        : [(args as { arg: unknown }).arg]
          .flat()
          .filter((a: unknown): a is string => typeof a === "string"),
    }));
};
