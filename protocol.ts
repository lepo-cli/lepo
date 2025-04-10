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

if (import.meta.main) {
  const empty = "";
  console.info("empty:", convert(empty));

  const plain = `
    안녕하세요.
  `;
  console.info("plain:", convert(plain));

  const cmdOnly = `
    <execution-request>
      <cmd>ls</cmd>
    </execution-request>
  `;
  console.info("cmdOnly:", convert(cmdOnly));

  const singleArg = `
    <execution-request>
      <cmd>git</cmd>
      <args>
        <arg>status</arg>
      </args>
    </execution-request>
  `;
  console.info("singleArg:", convert(singleArg));

  const multiArgs = `
    <execution-request>
      <cmd>diff</cmd>
      <args>
        <arg>a.txt</arg>
        <arg>b.txt</arg>
      </args>
    </execution-request>
  `;
  console.info("multiArgs:", convert(multiArgs));

  const desc = `
    <execution-request>
      <cmd>ls</cmd>
      <description>파일 리스팅</description>
    </execution-request>
  `;
  console.info("desc:", convert(desc));

  const mixed = `
    파일 리스팅
    <execution-request>
      <cmd>ls</cmd>
    </execution-request>
  `;
  console.info("mixed:", convert(mixed));

  const chaos = `
    <execution-request>
      <cmd>hello</cmd>
      <args></args>
    </execution-request>
    이어서
    <execution-request>
      <cmd>ls</cmd>
      <args>
        <arg></arg>
      </args>
    </execution-request>
    <description>
      안녕 혼돈
    </description>
  `;
  console.info("chaos:", convert(chaos));
}
