import { debug } from "./debug.ts";

export const checkRuntime = (cmds: ReadonlyArray<string>): Promise<void> =>
  Promise.all(
    cmds
      .map((cmd) =>
        new Deno.Command("bash", { args: ["-c", `command -v ${cmd}`] })
      )
      .map((command) => command.output()),
  )
    .then((outs: ReadonlyArray<Deno.CommandOutput>): void => {
      const arr: string[] = [];
      for (let i = 0; i < cmds.length; ++i) {
        if (!outs[i].success) arr.push(cmds[i]);
      }
      if (arr.length > 0) {
        throw new Error(`command ${arr.join(", ")} not found`);
      }
    })
    .then((): void => debug("runtime checked:", cmds));
