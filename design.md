<!-- deno-fmt-ignore-file -->

## Usage

```bash
lepo
lepo init
lepo ls
lepo do
lepo do --cd {path}
lepo do --save-to {relative path}
lepo do --new
lepo do --tail {Bubb ID}
lepo do --retry
lepo do --show-past
lepo do --show-all
```
### Global Options

이게 등장하면 다른 걸 다 무시함

`(v)ersion`:   버전명 출력
`(h)elp`:      사용법 출력

### Sub-command `init`

`.lepo/_insts.toml` 을 준비함

### Sub-command `ls`

가능한 Tail Bubb 을 내림차순으로 출력

`ULID (Height): First 12 chars ... Last 12 chars of user bubb` 형식을
하고 줄바꿈으로 구분

### Sub-command `do`

`do` 는 기본 Sub-command 이고 생략해도 됨

여러 옵션을 함께 사용할 수 있음
순서 상관 없음
단 `new` 와 `tail` 은 함께 사용할 수 없음

`(c)d`:        Working Directory 를 지정하고자 할 때
`(s)ave-to`:   기본 저장 공간 경로인 `.lepo` 대신 다른 디렉토리를 쓰고자 할 때
             - Working Directory 를 기준으로 상대 경로를 해소함
             - 절대 경로를 사용할 수 없음
             - 있으면 그냥 사용하고 없으면 만듦
             - `.lepo/foo` 처럼 쓰면 유용할 수 있음
`(n)ew`:       Conv 를 새로 시작하고자 할 때
`(t)ail`:      특정 Bubb 부터 시작하고자 할 때
`(r)etry`:     숨지 않은 마지막 User Bubb 부터 시작하고자 할 때
`show-(p)ast`: 지난 Bubb 도 다시 보고자 할 때
`show-(a)ll`:  숨은 Bubb 까지 다 보고 싶을 때
             - `retry` 의 Bubb 을 고르는데 영향을 끼치지 않음

## Conv

`cd` 옵션이 주어진 경우 그 경로로 `cd` 해서 `lepo` 를 새로 실행함
<- 단순함을 유지하기 위함
(안 그러면 커맨드 실행시 항상 앞단에서 cd 를 해야 하는데 불필요하게 복잡함)

`.lepo` 디렉토리에 상태를 저장 (없다면 만듦)
`.lepo` 를 형상에서 제외한다는 전제를 함
`save-to` 옵션이 주어진 경우 그 경로를 씀

저장된 사용 내역이 없거나 `new` 옵션이 넘어왔다면 새 Root Bubb 을 만듦

Bubb: 말풍선(Bubble)이라는 뜻
하나의 Bubb 은 하나의 파일에 대응

파일 이름: `{ULID}-{kind}{isHidden}-{PREV_ULID}.md`
파일 내용: 아무 형식 제약이 없는 단순 텍스트

Root Bubb (Base Bubb): `{ULID}-{kind}{isHidden}-head.md`

예를 들어
`ARST-s1-head.md` Root Bubb (kind 가 System 인)
`NEIO-a0-ARST.md` Assi Bubb
`QWFP-u0-NEIO.md` User Bubb
`ZXCV-s1-QWFP.md` Syst Bubb (사용자에게 안 보여줌)
`RSTD-s0-ZXCV.md` Syst Bubb (사용자에게 보여줌)

가장 최근 Bubb 부터 그 Prev 를 따라 Root 까지 가면
그게 하나의 Conv 가 되는 방식

## Flow

Lepo 의 핵심 기능은 Repository 루트에서 CLI 프로그램을 자유롭게 사용하고 그
입출력을 LLM 에게 넘겨주는 것이다.

그러기 위해 요청마다 앞단에서 어떤 Tool 이 필요한지 판단하는 쿼리를 한 번 해야 함
즉 이런 플로우를 타야 함

stdin 읽기 ->
User Bubb 저장 ->
loop start
  전체 Conv 를 Tool Chooser 에게 보냄 ->
  Syst Bubb 저장 ->
  if 만약 Command 실행이 필요하다면 then
    전체 Conv 를 Command Writer 에게 보냄 ->
    Syst Bubb 저장 ->
    Parse & Execute ->
    Syst Bubb 저장 ->
  else
    break loop
  end
loop end
전체 Conv 를 General 에게 보냄 ->
Assi Bubb 저장, stdout 쓰기 ->
반복

## Inst

`.lepo/_insts.toml` 파일에 Inst 를 써 놓자.

```toml
general = '...'
toolChooser = '...'
commandWriter = '...'
```

## MVP

최소한의 기능을 빠르게 구현하기 위해
- 서브 커맨드, 옵션은 나중에 생각하자
- 일단 무조건 Current Working Directory 기준으로만 하자
