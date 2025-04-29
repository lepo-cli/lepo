import { main } from "./main_loop.ts";
import { parseArgs } from "jsr:@std/cli/parse-args";
import { join } from "jsr:@std/path/join";

const DEFAULT = Symbol();

const handlers: ReadonlyMap<
  typeof DEFAULT | string,
  (...args: ReadonlyArray<string>) => void
> = new Map()
  .set(DEFAULT, (_tail?: string, ...rest: ReadonlyArray<string>) => {
    if (rest.length > 0) {
      console.error("too many args:", rest);
      console.info("--help to get help");
      Deno.exit(1);
    }

    // TODO:
    main({});
  })
  .set("new", (...args: ReadonlyArray<string>) => {
    if (args.length > 0) {
      console.error("too many args:", args);
      console.info("--help to get help");
      Deno.exit(1);
    }

    // TODO:
    main({});
  })
  .set("init", (path?: string, ...rest: ReadonlyArray<string>) => {
    if (rest.length > 0) {
      console.error("too many args:", rest);
      console.info("--help to get help");
      Deno.exit(1);
    }

    const dir = join(path ?? ".", ".lepo");
    Deno.mkdirSync(dir, { recursive: true });
    console.info(`"${dir}" created`);
  })
  .set("ls", (...args: ReadonlyArray<string>) => {
    if (args.length > 0) {
      console.error("too many args:", args);
      console.info("--help to get help");
      Deno.exit(1);
    }

    // TODO:
  })
  .set("cat", (..._ids: ReadonlyArray<string>) => {
    // TODO:
  });

if (import.meta.main) {
  if (!import.meta.dirname) {
    throw new Error("https://docs.deno.com/api/web/~/ImportMeta.dirname");
  }

  const {
    help,
    version,
    "_": [subcmd, ...left],
    "--": right,
  } = parseArgs(Deno.args, {
    "--": true,
    boolean: ["help", "version"],
    alias: { h: "help", v: "version" },
    unknown: (arg, key) => {
      if (!key) return true;
      console.error("bad usage:", arg);
      console.info("--help to get help");
      Deno.exit(1);
    },
  });

  if (help) {
    Deno.stdout.writeSync(Deno.readFileSync(join(
      import.meta.dirname as string,
      "help.txt",
    )));
    Deno.exit(0);
  }

  if (version) {
    console.info("0.1.0");
    Deno.exit(0);
  }

  const handler = handlers.get(subcmd || subcmd === 0 ? `${subcmd}` : DEFAULT);

  if (!handler) {
    console.error("unknown subcommand:", subcmd);
    console.info("--help to get help");
    Deno.exit(1);
  }

  handler(...left.concat(right).map((v) => `${v}`));
}
