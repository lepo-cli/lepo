const PREFIX = "\x1b[90m[DEBUG]\x1b[0m";

export const debug: (...whatever: unknown[]) => void = Deno.env.get("DEV")
  ? (unk: unknown, ...rest: unknown[]): void => {
    if (rest.length > 0) {
      console.debug(PREFIX, unk, ...rest);
      return;
    }

    if (!(unk instanceof Function)) {
      console.debug(PREFIX, unk);
      return;
    }

    const a: unknown = unk();

    if (Array.isArray(a)) {
      console.debug(PREFIX, ...a);
      return;
    }

    if (!(a instanceof Promise)) {
      console.debug(PREFIX, a);
      return;
    }

    a
      .then((arg: unknown): void => {
        if (Array.isArray(arg)) console.debug(PREFIX, ...arg);
        else console.debug(PREFIX, arg);
      })
      .catch((e): void => {
        console.error("error while debugging:", e);
      });
  }
  : () => undefined;
