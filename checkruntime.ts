export const CMDS = [
  "fd",
  "rg",
  "perl",
  "jq",
  "git",
  "ssh",
  "curl",
  "elinks",
] as const;

export const checkruntime = (): Promise<void> =>
  Promise.all(
    CMDS
      .map((cmd) =>
        new Deno.Command("bash", { args: ["-c", `command -v ${cmd}`] })
      )
      .map((command) => command.output()),
  )
    .then((outs: ReadonlyArray<Deno.CommandOutput>): void => {
      const arr: string[] = [];
      for (let i = 0; i < CMDS.length; ++i) {
        if (!outs[i].success) arr.push(CMDS[i]);
      }
      if (arr.length > 0) {
        throw new Error(`command ${arr.join(", ")} not found`);
      }
    });
