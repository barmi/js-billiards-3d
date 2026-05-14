# CLAUDE.md

Claude Code가 이 저장소에서 작업할 때 자동으로 읽는 프로젝트 가이드.

## 프로젝트 개요

three.js + cannon-es 기반의 웹 3D 8볼 풀 게임.
- **정적 배포**: HTML/JS/CSS만으로 동작. 빌드 도구 없음.
- **모듈 로딩**: `<script type="importmap">` + unpkg CDN에서 ESM 직접 임포트
  (`three@0.184.0`, `cannon-es@0.20.0`).
- **로컬 실행**: `cd src && python3 -m http.server 8080` (또는 `.claude/launch.json`의
  `billiards` 프리뷰 서버).

## 커밋 정책 — 중요

- **`Co-Authored-By:` 트레일러를 절대 추가하지 말 것.** 사용자가 GitHub contributor에
  Claude가 표시되어 제거를 요청. 이전 글로벌 기본값(`Co-Authored-By: Claude Opus 4.7 ...`)을
  이 저장소에서는 무시.
- 커밋 메시지 prefix는 `Stage N Phase N.M: <설명>` 형식 유지.
- 메시지 본문은 한국어 (기존 문서·메시지 톤과 일치).
- Phase 단위 commit. 한 phase가 끝날 때마다: 문서 갱신 → 검증 → 단일 commit.

## 좌표계 & 단위

- 단위: **SI** (미터, 킬로그램, 초).
- `y = 0`이 베드(felt) 윗면.
- `x`축 = 긴 변 (`PLAY_WIDTH = 2.54 m`).
- `z`축 = 짧은 변 (`PLAY_HEIGHT = 1.27 m`).
- WPA 9피트 풀 표준 치수.
- **모든 상수는 [`src/js/config.js`](src/js/config.js)에 정의**. 매직 넘버 금지.

## 디렉토리 구조

```
js-billiards-3d/
├── README.md
├── CLAUDE.md                 ← 이 파일
├── doc/
│   ├── PLAN.md              ← 마스터 계획 (모든 Stage 요약)
│   └── stages/              ← phase별 작업 기록 (stage-1 ~ stage-12)
└── src/                      ← 정적 배포 루트
    ├── index.html           ← importmap + #app / #hud
    ├── css/style.css
    └── js/
        ├── main.js          ← 부트스트랩
        ├── config.js        ← SI 상수 (테이블/공/물리/씬)
        ├── audio/           ← SoundManager (Web Audio 절차적 합성)
        ├── scene/           ← Stage (renderer + camera + controls + 조명)
        ├── physics/         ← PhysicsWorld (cannon-es 래퍼, snap-to-rest)
        ├── objects/         ← Table, Ball, ballTexture, CueStick, AimLine, rack
        ├── controls/        ← ShotController (스페이스바 차지)
        ├── game/            ← Game (상태머신, 규칙, ball-in-hand)
        └── ui/              ← GameHUD, ImpactPicker
```

## 코딩 원칙

- **외부 에셋 파일 추가 금지**. 사운드는 Web Audio 절차적 합성, 텍스처는 Canvas → CanvasTexture.
  (HTML/JS/CSS 정적 배포 요건 유지)
- 빌드 단계 도입 금지. 모든 코드는 브라우저가 importmap+ESM으로 직접 실행 가능해야 함.
- `import { ... } from './config.js'`로 상수 참조. 새 상수는 우선 `config.js`에 추가.
- 각 phase 작업 전 [`doc/stages/`](doc/stages/) 해당 문서에 결정사항·계획 기록.

## 커밋 전 검증

- 브라우저 콘솔: 에러 0. (deprecated 경고는 추적하되 허용)
- 시각 변경: 프리뷰 서버에서 스크린샷 확인.
- 물리 변경: `window.__demo`로 헤드리스 시뮬레이션 후 측정값 비교
  (공 위치, 정지 시간, 속도 등).
- ES 모듈은 브라우저가 적극적으로 캐시함. 변경이 반영 안 보이면 preview_stop → preview_start
  로 캐시 우회.

## 디버그 핸들

`window.__demo`에 다음이 노출됨 (개발용):

| 키 | 설명 |
|---|---|
| `cueBall`, `balls` | 공 인스턴스. `body.position`, `velocity` 등 직접 조작 가능 |
| `physics` | PhysicsWorld. `isAllAtRest()`, `_dynamic` |
| `stage` | three.js Stage. `camera`, `controls`, `scene` |
| `cueStick`, `shot`, `impactPicker` | 입력/시각 |
| `game` | Game 상태머신. `state`, `currentPlayer`, `playerGroups` |
| `sound` | SoundManager. `ctx`, `buffers` |

## 단계 이력

`doc/PLAN.md`의 §5에 Stage 1~12 완료 상태와 이연 항목 정리. 자세한 phase별 결정사항·검증은
`doc/stages/stage-N-*.md`.

## 남은 이연 항목

- 모바일 터치 컨트롤 (현재는 데스크톱 OrbitControls + 키보드)
- 단일 플레이용 AI
- 큐 스틱이 타격점 오프셋을 시각적으로 반영
