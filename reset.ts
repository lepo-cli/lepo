import { ulid } from "@std/ulid/ulid";

Deno.mkdirSync(".lepo", { recursive: true });
Deno.removeSync(".lepo", { recursive: true });
Deno.mkdirSync(".lepo", { recursive: true });

const e1 = [
  [ulid(150000), "s1"],
  [ulid(150001), "u0"],
  [ulid(150002), "s0"],
  [ulid(150003), "a0"],
];

e1
  .map(([curr, flag], i, arr) => `${curr}-${flag}-${arr[i - 1]?.[0] ?? "nil"}`)
  .forEach((name) => {
    Deno.writeTextFileSync(`.lepo/${name}.md`, "");
  });

const e2 = [
  [ulid(150004), "s1"],
  [ulid(150005), "u0"],
  [ulid(150006), "s0"],
  [ulid(150007), "a0"],
];

e2
  .map(([curr, flag], i, arr) => `${curr}-${flag}-${arr[i - 1]?.[0] ?? "nil"}`)
  .forEach((name) => {
    Deno.writeTextFileSync(`.lepo/${name}.md`, "");
  });

const e3 = [
  [ulid(150008), "s0"],
  [ulid(150009), "a0"],
];

e3
  .map(([curr, flag], i, arr) =>
    `${curr}-${flag}-${arr[i - 1]?.[0] ?? e1[1][0]}`
  )
  .forEach((name) => {
    Deno.writeTextFileSync(`.lepo/${name}.md`, "");
  });
