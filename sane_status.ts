import { join } from "jsr:@std/path/join";

export type Exec = {
  readonly command: string;
  readonly output: string;
};

export type GitRepo = {
  readonly path: string;
  readonly status: Exec;
  readonly files: Exec;
};

export type SaneStatus = {
  readonly ["git-repositories"]: {
    readonly ["git-repository"]: ReadonlyArray<GitRepo>;
  };
  readonly ["current-files"]: Exec;
};

const td = new TextDecoder();

export const saneStatus = (cwd: string): SaneStatus => {
  const repoPaths: string[] = [];

  outer: for (const { name, isDirectory } of Deno.readDirSync(cwd)) {
    if (!isDirectory) continue;

    if (name === ".git") {
      repoPaths.push(join(cwd, "."));
      continue;
    }

    const child = join(cwd, name);

    for (const { name: nm, isDirectory: isDir } of Deno.readDirSync(child)) {
      if (!isDir) continue;

      if (nm === ".git") {
        repoPaths.push(child);
        continue outer;
      }
    }
  }

  const gitRepos = repoPaths
    .map((path): Readonly<[string, Exec]> | false => {
      const { success, stdout } = new Deno.Command("git", {
        args: [
          "-C",
          path,
          "--git-dir",
          ".git",
          "-c",
          "core.quotepath=false",
          "status",
        ],
      }).outputSync();

      if (!success) return false;

      return [
        path,
        {
          command:
            `git -C "${path}" --git-dir .git -c core.quotepath=false status`,
          output: td.decode(stdout),
        },
      ];
    })
    .filter((item): item is Readonly<[string, Exec]> => item as boolean)
    .map(([path, status]): GitRepo | false => {
      const { success, stdout } = new Deno.Command("git", {
        args: [
          "-C",
          path,
          "--git-dir",
          ".git",
          "-c",
          "core.quotepath=false",
          "ls-files",
        ],
      }).outputSync();

      if (!success) return false;

      return {
        path,
        status,
        files: {
          command:
            `git -C "${path}" --git-dir .git -c core.quotepath=false ls-files`,
          output: td.decode(stdout),
        },
      };
    })
    .filter((item): item is GitRepo => item as boolean)
    .toSorted(({ path: a }, { path: b }) => a.localeCompare(b, "en-US"));

  const { success, stdout } = new Deno.Command("fd", {
    args: [
      "--unrestricted",
      "--exclude",
      "**/.git/*",
      "--max-depth",
      "2",
      "--absolute-path",
      ".*",
      cwd,
    ],
  }).outputSync();

  if (!success) throw new Error();

  return {
    ["git-repositories"]: { ["git-repository"]: gitRepos },
    ["current-files"]: {
      command:
        `fd --unrestricted --exclude '**/.git/*' --max-depth 2 --absolute-path '.*' "${cwd}"`,
      output: td.decode(stdout),
    },
  };
};
