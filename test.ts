import { stringify } from "@libs/xml/stringify";

const str = stringify({
  ["execution-request"]: {
    cmd: "git",
    args: [{ arg: "ls-files" }],
    description: "저장소를 구성하는 파일을 확인하는 명령",
  },
});

console.info(str);

const td = new TextDecoder();
const lsCommand = new Deno.Command("git", { args: ["ls-files"] });
const str2 = stringify({
  ["execution-response"]: {
    stdout: td.decode(lsCommand.outputSync().stdout),
  },
});
console.info(str2);
