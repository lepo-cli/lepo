import { debug } from "./debug.ts";

Deno.test({
  name: "debug",
  permissions: { env: ["DEV"] },
  fn: () => {
    console.info("이 테스트는 겉으로는 무조건 성공합니다.");
    console.info("출력을 눈으로 보고 성공 여부를 판단해야 합니다.");
    console.info("DEV:", Deno.env.get("DEV"));

    debug("lite");
    debug();
    debug("lite:", "stuff");
    debug("lite:", "a", "b");
    debug(["a", "b"]);
    debug("arr:", ["a", "b"]);
    debug("a b:", ...["a", "b"]);
    debug(() => "heavy");
    debug(() => ["heavy:", "stuff"]);
    debug(() => ["heavy:", "a", "b"]);
    debug(() => Promise.resolve("async"));
    debug(() => Promise.all(["async:", Promise.resolve("stuff")]));
    debug(() =>
      Promise.all(["async:", Promise.resolve("a"), Promise.resolve("b")])
    );
    debug(() => {}, "<- function it self for some reason");
  },
});
