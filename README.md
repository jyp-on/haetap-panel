# Haetap Panel

여러 프로젝트의 shell 스크립트를 서비스 단위로 시작/중지하고, 각 자식 프로세스의 터미널을 한 데스크탑 앱에서 관리하는 macOS 도구.

`flutter run`의 `r`(hot reload) 같은 raw key 입력도 그대로 전달되며, 크롬 탭처럼 실행 중인 서비스들을 탭으로 전환하며 본다.

## 주요 기능

- 프로젝트(경로)와 그 안의 여러 shell 명령을 서비스로 등록
- Start/Stop, 프로젝트 일괄 시작/중지(멱등)
- 서비스 시작 시 탭 자동 추가 — 크롬 탭처럼 가로로 나열, X로 닫기
- xterm.js + portable-pty 기반 진짜 터미널 — 컬러, 커서 이동, raw key 입력
- 서비스 추가 시 프로젝트 cwd 하위의 `*.sh` 파일을 재귀 스캔해서 Autocomplete로 선택
- 프로젝트 cwd는 Finder 폴더 선택 다이얼로그로 입력 가능
- 메뉴바 트레이 상주 — 닫아도 자식 프로세스는 살아있음, Quit 시에만 SIGTERM(5초 후 SIGKILL)
- Obsidian 풍 다크 테마 (1440x900)

## 기술 스택

- **Desktop**: Tauri 2.x (Rust + WebView)
- **Frontend**: React 19 + TypeScript + Vite + MUI v9 + Zustand
- **Backend**: Rust + tokio + portable-pty + serde
- **Terminal**: xterm.js v6 + @xterm/addon-fit

## 개발 환경

- macOS (Apple Silicon)
- Rust toolchain (rustup) — `brew install rustup`
- Node.js + pnpm
- Xcode Command Line Tools

쉘에 cargo PATH 추가 (한 번만):

```bash
echo 'export PATH="/opt/homebrew/opt/rustup/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
```

## 실행

```bash
pnpm install
pnpm tauri dev   # 개발 모드 (Hot reload)
pnpm tauri build # 프로덕션 .app 빌드
```

첫 실행 시 Rust 의존성 컴파일에 5~10분 걸린다. 이후엔 빠르게 재실행됨.

## 디렉토리 구조

```
haetap-panel/
├── src-tauri/           Rust 백엔드
│   ├── src/
│   │   ├── main.rs      엔트리 (lib::run 호출)
│   │   ├── lib.rs       Tauri 빌더, 모듈 등록
│   │   ├── config.rs    config.json 모델 + 직렬화
│   │   ├── process.rs   ServiceManager (portable-pty spawn/kill, stdin/resize)
│   │   ├── ipc.rs       Tauri commands (load/save/start/stop/input/resize/list_scripts)
│   │   └── tray.rs      메뉴바 트레이 (Show / Quit)
│   ├── capabilities/    Tauri 2 권한 (default.json)
│   └── tauri.conf.json
├── src/                 React 프론트엔드
│   ├── App.tsx          최상위 레이아웃 + state listener 등록
│   ├── theme.ts         Obsidian 풍 MUI 테마
│   ├── store.ts         Zustand (projects/services/states/openTabIds)
│   ├── ipc.ts           Tauri command/event 래퍼
│   └── components/
│       ├── Sidebar.tsx           프로젝트 목록 + 추가/편집/삭제
│       ├── ServiceList.tsx       선택된 프로젝트의 서비스 카드
│       ├── ServiceCard.tsx       카드 (상태/Start·Stop/메뉴)
│       ├── ProjectFormModal.tsx  프로젝트 모달 (이름 + cwd Finder 선택)
│       ├── ServiceFormModal.tsx  서비스 모달 (이름 + 명령 + 스크립트 Autocomplete)
│       ├── TabbedTerminals.tsx   탭 바 + 활성 탭 영역
│       └── TerminalPane.tsx      xterm.js 인스턴스 (PTY 연결, fit, reset on start)
└── README.md
```

## 데이터 모델

```typescript
type Project = { id, name, cwd }
type Service = { id, projectId, name, command }   // cwd는 부모 프로젝트에서 상속
```

설정은 `~/Library/Application Support/com.haetap.panel/config.json`에 저장.

## 사용 흐름

1. 프로젝트 추가 — Finder로 cwd 선택 (예: `~/develop/haetap/incubody`)
2. 서비스 추가 — 이름 입력 + Autocomplete에서 `*.sh` 선택 (재귀 검색)
3. 카드의 Start → 자동으로 탭 생성 + 활성화 → 터미널에 실시간 출력
4. 터미널 클릭으로 포커스 → 키 입력은 자식 stdin으로 (예: `flutter run`의 `r`)
5. 다른 카드도 Start → 새 탭 추가, 탭 클릭으로 전환
6. 탭 X로 닫음 (서비스는 계속 실행). 카드의 Stop으로 종료
7. 윈도우 X로 닫으면 트레이로 들어감, Quit으로 완전 종료

## 라이센스

Personal project — license TBD.
