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

git init --initial-branch repo_0
git add .
git commit --message init

git -C repo_1 init --initial-branch repo_1
git -C repo_1 add .
git -C repo_1 commit --message init

git -C sub/repo_2 init --initial-branch repo_2
git -C sub/repo_2 add .
git -C sub/repo_2 commit --message init
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
      assertEquals(
        r0.status.output,
        "On branch repo_0\nnothing to commit, working tree clean\n",
      );
      assertEquals(
        r0.files.output,
        ".gitignore\na.txt\nnot_a_repo/e.txt\nsub/c.txt\n",
      );

      assertEquals(r1.path, join(testdir, "repo_1"));
      assertEquals(
        r1.status.output,
        "On branch repo_1\nnothing to commit, working tree clean\n",
      );
      assertEquals(r1.files.output, "b.txt\n");

      assert(fdOutput.trim().split("\n").length === 11);
    } finally {
      Deno.mkdirSync(testdir, { recursive: true });
      Deno.removeSync(testdir, { recursive: true });
    }
  },
});
