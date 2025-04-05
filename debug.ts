export const debug: typeof console.debug = Deno.env.get("DEV")
  ? console.debug
  : () => undefined;
