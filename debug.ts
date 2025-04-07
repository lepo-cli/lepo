export const debug: (...whatever: unknown[]) => void = Deno.env.get("DEV")
  ? (unk: unknown, ...rest: unknown[]): void => {
    if (rest.length > 0) {
      console.debug(unk, ...rest);
      return;
    }

    if (!(unk instanceof Function)) {
      console.debug(unk);
      return;
    }

    const a: unknown = unk();

    if (Array.isArray(a)) {
      console.debug(...a);
      return;
    }

    if (!(a instanceof Promise)) {
      console.debug(a);
      return;
    }

    a
      .then((arg: unknown): void => {
        if (Array.isArray(arg)) console.debug(...arg);
        else console.debug(arg);
      })
      .catch((e): void => {
        console.error("error while debugging:", e);
      });
  }
  : () => undefined;

if (import.meta.main) {
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

  setTimeout(() => {
    console.info("debug test end");
  });
}
