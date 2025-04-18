import { convert } from "./protocol.ts";
import { assertEquals } from "jsr:@std/assert@1.0.12";

Deno.test("convert", () => {
  const empty = "";
  assertEquals(convert(empty), []);

  const plain = `
    안녕하세요.
  `;
  assertEquals(convert(plain), []);

  const cmdOnly = `
    <execution-request>
      <cmd>ls</cmd>
    </execution-request>
  `;
  assertEquals(convert(cmdOnly), [{ cmd: "ls", args: [] }]);

  const singleArg = `
    <execution-request>
      <cmd>git</cmd>
      <args>
        <arg>status</arg>
      </args>
    </execution-request>
  `;
  assertEquals(convert(singleArg), [{ cmd: "git", args: ["status"] }]);

  const multiArgs = `
    <execution-request>
      <cmd>diff</cmd>
      <args>
        <arg>a.txt</arg>
        <arg>b.txt</arg>
      </args>
    </execution-request>
  `;
  assertEquals(convert(multiArgs), [{ cmd: "diff", args: ["a.txt", "b.txt"] }]);

  const desc = `
    <execution-request>
      <cmd>ls</cmd>
      <description>파일 리스팅</description>
    </execution-request>
  `;
  assertEquals(convert(desc), [{ cmd: "ls", args: [] }]);

  const mixed = `
    파일 리스팅
    <execution-request>
      <cmd>ls</cmd>
    </execution-request>
  `;
  assertEquals(convert(mixed), [{ cmd: "ls", args: [] }]);

  const chaos = `
    <execution-request>
      <cmd>hello</cmd>
      <args></args>
    </execution-request>
    이어서
    <execution-request>
      <cmd>ls</cmd>
      <args>
        <arg></arg>
      </args>
    </execution-request>
    <description>
      안녕 혼돈
    </description>
  `;
  assertEquals(convert(chaos), [
    { cmd: "hello", args: [] },
    { cmd: "ls", args: [] },
  ]);
});
