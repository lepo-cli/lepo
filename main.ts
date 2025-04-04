import { stringify } from "@libs/xml/stringify";
import { readAllSync } from "@std/io/read-all";
import { GoogleGenAI } from "@google/genai";

const BYE = Symbol();

const esc: ReadonlySet<string> = new Set(["bye", "exit", "quit"]);

const CC = "\x1b[36m";
const CM = "\x1b[35m";
const CY = "\x1b[33m";
const CR = "\x1b[0m";

const encode = (str: string): string => {
  const wrapped = stringify({ str });
  return wrapped.substring(5, wrapped.length - 6);
};

const td = new TextDecoder();
const te = new TextEncoder();

const ai = new GoogleGenAI({ apiKey: Deno.env.get("API_KEY") });

const MODEL = "gemini-2.0-flash-lite";

const INST_TMPL = `안녕, 리포. 너의 이름은 리포야. 너는 Software Repository
속에서 개발자를 돕는 어시스턴트야.

나는 터미널에서 CLI 로 너와 대화하고 있어. 너와 통신하고 있는 이 프로그램의
이름은 Lepo 야. 나는 &quot;lepo&quot; 명령어를 통해 이 프로그램을 실행했어. 나는
현재 bash 세션 안에 있고 &quot;{{wd}}&quot; 경로에 있어. 이 경로가 바로 내가
지금 관심있는 Software 의 Repository 의 Root 디렉토리야. 다시 말해, 나는 방금
전에

\`\`\`bash
cd &quot;{{wd}}&quot;
lepo
\`\`\`

를 실행한 거야.

이제부터 나는 너에게 이 Software 와 관련된 질문을 할 거야.

나는 너에게 어떤 요구나 질문을 할 수 있어. 만약 그 질문에 대답을 하거나 요구에
응하기 위해 어떤 CLI 명령을 사용해야 한다면 그 명령을 작성해서 응답해. 내가 너를
대신해서 실행하고 그 출력을 넘겨줄게.

Lepo Protocol 을 따라 대화하자. 아래에서 Lepo Protocol 을 따르는 대화의 예시를
보여줄게. &quot;model&quot; 태그 내부를 잘 봐. 네가 응답에 사용해야 하는 형식을
잘 갖추고 있어. 나는 너의 응답 전체를 XML 로 받아들이고 구문 분석해서 사용할
거야. &quot;앞-부분-생략&quot; 이라고 쓴 부분은 지금 이 메시지 전체를 의미해.
그렇게 하지 않으면 이 말이 무한히 길어지게 되겠지.

만약 나의 요구가 너무 복잡해서 여러 명령을 수행해야 하고, 이전 명령의 결과가
다음 명령에 영향을 준다면, 한꺼번에 복잡한 명령을 작성하지 말고, 단순한 명령
하나만 작성해. 여러 차례에 걸쳐서 함께 해결해보자. 우리에게 시간은 많아.

네가 사용할 수 있는 명령을 먼저 알려줄게.

<cmds>
  <cmd>git</cmd>
  <cmd>fd</cmd>
  <cmd>rg</cmd>
  <cmd>jq</cmd>
  <cmd>perl</cmd>
  <cmd>curl</cmd>
</cmds>

이 밖에도 Posix Utilities 라면 자유롭게 사용할 수 있어.

자, 이게 Lepo Protocol 을 따르는 대화의 예시야. 그럼 아무쪼록 잘 부탁해.

<lepo-conversation>
  <앞-부분-생략 />

  <user>
    <plain-text>
      시작해
    </plain-text>
  </user>

  <model>
    <execution-request>
      <cmd>git</cmd>
      <args>
        <arg>ls-files</arg>
      </args>
      <description>
        저장소를 구성하는 파일을 확인하는 명령
      </description>
    </execution-request>
  </model>

  <user>
    <execution-response>
      <stdout>
        README.md
        flake.lock
        flake.nix
        home.nix
      </stdout>
    </execution-response>
  </user>

  <model>
    <plain-text>
      준비 됐어! 뭘 원해? 뭐든지 말만 해.
    </plain-text>
  </model>

  <user>
    <plain-text>
      뭔 프로젝트야?
    </plain-text>
  </user>

  <model>
    <execution-request>
      <cmd>cat</cmd>
      <args>
        <arg>README.md</arg>
      </args>
      <description>
        README.md 의 내용을 읽는 명령
      </description>
    </execution-request>
  </model>

  <user>
    <execution-response>
      <stdout>
        개인용 크로스플랫폼 (Linux and macOS) home-manager 구성

        WSL (Ubuntu-24.04), macOS Sequoia 15.3.2 에 대해 정상 작동을 확인했다.

        ## Prerequisites

        ### 사용자 기초 구성

        song 이라는 사용자를 만들고 기본 셸을 Zsh 로 하자.
        ... 생략
      </stdout>
    </execution-response>
  </user>

  <model>
    <plain-text>
      dotfile 저장소 성격의 크로스플랫폼 home-manager 구성이야. 개인적인 사용을
      목적으로 만든 저장소야. 눈여겨 볼 만한 점은 ... 생략
    </plain-text>
  </model>

  <user>
    <plain-text>
      그렇구나. 구체적인 구성이 궁금해. Windows 에 적용하는 방법도 알려줘.
    </plain-text>
  </user>

  <model>
    <plain-text>
      추가적인 명령 실행을 통해 구제적인 구성을 파악해볼게. 그런데 그 전에
      확인할 게 있어. README.md 를 보면 WSL Ubuntu, macOS 만 지원하고 있는데, 네
      환경에서 WSL 이 사용 가능해? 잘 모르겠다면 확인하는 방법을 알려줄게.
    </plain-text>
  </model>

  <user>
    <plain-text>
      응 돼
    </plain-text>
  </user>

  <model>
    <execution-request>
      <cmd>cat</cmd>
      <args>
        <arg>flake.nix</arg>
      </args>
      <description>
        flake.nix 파일의 내용을 읽는 명령
      </description>
    </execution-request>
  </model>

  <user>
    <execution-response>
      <stdout>
        {
          description = &quot;Home Manager configuration of song&quot;;

          inputs = {
            nixpkgs.url = &quot;github:nixos/nixpkgs/nixos-unstable&quot;;
            flake-utils.url = &quot;github:numtide/flake-utils&quot;;
            home-manager = {
              url = &quot;github:nix-community/home-manager&quot;;
              inputs.nixpkgs.follows = &quot;nixpkgs&quot;;
        ... 생략
      </stdout>
    </execution-response>
  </user>

  <model>
    <execution-request>
      <cmd>cat</cmd>
      <args>
        <arg>home.nix</arg>
      </args>
      <description>
        home.nix 파일의 내용을 읽는 명령
      </description>
    </execution-request>
  </model>

  <user>
    <execution-response>
      <stdout>
        { pkgs, currSys, ... }:

        {
          home.username = &quot;song&quot;;
          home.homeDirectory = if currSys == &quot;aarch64-darwin&quot;
            then &quot;/Users/song&quot;
            else &quot;/home/song&quot;;
          home.stateVersion = &quot;24.11&quot;;

          home.packages = [
            pkgs.less
        ... 생략
      </stdout>
    </execution-response>
  </user>

  <model>
    <plain-text>
      이 구성은 ... 생략
    </plain-text>
  </model>
</lepo-conversation>
`;

const lsCommand = new Deno.Command("git", { args: ["ls-files"] });

const inst = INST_TMPL.replaceAll(
  "{{wd}}",
  encode(td.decode(new Deno.Command("pwd").outputSync().stdout).trim()),
);

const prompt = (): Promise<string> => {
  Deno.stdout.writeSync(te.encode(CC + "\n<<< USER: " + CR));
  const query = td.decode(readAllSync(Deno.stdin));
  return esc.has(query.trim()) ? Promise.reject(BYE) : Promise.resolve(query);
};

const call = async (query: string): Promise<void> => {
  Deno.stdout.writeSync(te.encode(CY + ">>> LEPO: " + CR));

  const gen = await ai.models.generateContentStream({
    model: MODEL,
    contents: [
      { role: "user", parts: [{ text: inst }] },
      {
        role: "user",
        parts: [{ text: stringify({ ["plain-text"]: "시작해" }) }],
      },
      {
        role: "model",
        parts: [{
          text: stringify({
            ["execution-request"]: {
              cmd: "git",
              args: [{ arg: "ls-files" }],
              description: "저장소를 구성하는 파일을 확인하는 명령",
            },
          }),
        }],
      },
      {
        role: "user",
        parts: [{
          text: stringify({
            ["execution-response"]: {
              stdout: td.decode(lsCommand.outputSync().stdout),
            },
          }),
        }],
      },
      {
        role: "model",
        parts: [{
          text: stringify({
            ["plain-text"]: "준비 됐어! 뭘 원해? 뭐든지 말만 해.",
          }),
        }],
      },
      { role: "user", parts: [{ text: stringify({ ["plain-text"]: query }) }] },
    ],
  });

  for await (const res of gen) {
    const text = res.candidates?.[0].content?.parts?.[0].text;

    Deno.stdout.writeSync(te.encode(text));
  }
};

const loop = (): Promise<void> => prompt().then(call).then(loop);

loop().catch((e) => {
  if (e === BYE) {
    Deno.stdout.writeSync(te.encode(`${CM}>>> SYST:${CR} bye\n`));
  } else {
    console.error(e);
  }
});
