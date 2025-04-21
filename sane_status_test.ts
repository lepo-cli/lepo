import { saneStatus } from "./sane_status.ts";
import { assert, assertEquals, assertFalse } from "jsr:@std/assert";
import { join } from "jsr:@std/path/join";

const BATCH = `
echo 'repo_1
repo_2' > .gitignore
echo a > a.txt

mkdir -p repo_1 sub/repo_2 not_a_repo

echo b > repo_1/b.txt
echo c > sub/c.txt
echo d > sub/repo_2/d.txt
echo e > not_a_repo/e.txt

git -c user.name=test -c user.email=t@e.st               init -b repo_0
git -c user.name=test -c user.email=t@e.st               add .
git -c user.name=test -c user.email=t@e.st               commit --message init

git -c user.name=test -c user.email=t@e.st -C repo_1     init -b repo_1
git -c user.name=test -c user.email=t@e.st -C repo_1     add .
git -c user.name=test -c user.email=t@e.st -C repo_1     commit --message init

git -c user.name=test -c user.email=t@e.st -C sub/repo_2 init -b repo_2
git -c user.name=test -c user.email=t@e.st -C sub/repo_2 add .
git -c user.name=test -c user.email=t@e.st -C sub/repo_2 commit --message init
`;

Deno.test({
  name: "saneStatus",
  permissions: {
    read: true,
    write: true,
    run: true,
  },
  fn: () => {
    const testdir = join(
      import.meta.dirname as string,
      "_lepo_testspace_",
      "sane_status",
    );

    Deno.mkdirSync(testdir, { recursive: true });
    Deno.removeSync(testdir, { recursive: true });
    Deno.mkdirSync(testdir, { recursive: true });

    try {
      Deno.chdir(testdir);
      assertEquals(Deno.cwd(), testdir);

      assert(
        new Deno.Command("bash", { args: ["-c", BATCH] }).outputSync().success,
      );

      const {
        ["git-repositories"]: { ["git-repository"]: [r0, r1, na] },
        ["current-files"]: { output: fdOutput },
      } = saneStatus(testdir);

      assertFalse(na);

      assertEquals(r0.path, testdir);
      assertEquals(r0.status.output, "");
      assertEquals(
        r0.files.output,
        ".gitignore\na.txt\nnot_a_repo/e.txt\nsub/c.txt\n",
      );

      assertEquals(r1.path, join(testdir, "repo_1"));
      assertEquals(r1.status.output, "");
      assertEquals(r1.files.output, "b.txt\n");

      assert(fdOutput.trim().split("\n").length === 11);
    } finally {
      Deno.mkdirSync(testdir, { recursive: true });
      Deno.removeSync(testdir, { recursive: true });
    }
  },
});
