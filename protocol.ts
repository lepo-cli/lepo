import { parse } from "@libs/xml/parse";

const NIL = Symbol();

export type Exec = {
  readonly cmd: string;
  readonly args: Readonly<string[]>;
};

export const convert = (text: string): Readonly<Exec[]> => {
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
    .filter((er: unknown) => er && typeof er === "object")
    .map((er: unknown): object => er as object)
    .filter((er: object) => typeof (er as { cmd: unknown }).cmd === "string")
    .map((er: object): Exec => ({
      cmd: (er as { cmd: string }).cmd,
      args: Array.isArray((er as { args: unknown }).args)
        ? []
        : !(er as { args: unknown }).args
        ? []
        : typeof (er as { args: unknown }).args !== "object"
        ? []
        : [(er as { args: { arg: unknown } }).args.arg]
          .flat()
          .filter((a: unknown) => typeof a === "string")
          .map((a: unknown): string => a as string),
    }));
};

if (import.meta.main) {
  const empty = "";
  console.info("empty:", convert(empty));

  const weird = `weird`;
  console.info("weird:", convert(weird));

  const plain = `
    <plain-text>
      안녕하세요.
    </plain-text>
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
    <plain-text>
      파일 리스팅
    </plain-text>
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
    <plain-text>
      이어서
    </plain-text>
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
