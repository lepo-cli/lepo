export const CMDS = [
  "fd",
  "rg",
  "perl",
  "jq",
  "git",
  "curl",
  "elinks",
  "repomix",
] as const;

export const checkruntime = (): Promise<void> =>
  Promise.all(
    CMDS
      .map((cmd) =>
        new Deno.Command("bash", { args: ["-c", `command -v ${cmd}`] })
      )
      .map((command) => command.output()),
  )
    .then((outs: Deno.CommandOutput[]): void => {
      const na: string[] = [];
      for (let i = 0; i < CMDS.length; ++i) {
        if (!outs[i].success) na.push(CMDS[i]);
      }
      if (na.length > 0) {
        throw new Error(`command ${na.join(", ")} not found`);
      }
    });
