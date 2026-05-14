# Stage 1 — 기반 구축

목표: 빈 저장소에서 브라우저에서 동작하는 기본 three.js 씬까지 도달.

## Phase 1.1 — 디렉토리, 계획, 문서

### 결정사항
- 디렉토리 최상위: `doc/`, `src/`. `src/`가 그대로 정적 배포 루트가 되도록 설계.
- 모듈 로딩: `<script type="importmap">` + ESM CDN(esm.sh). 빌드 도구 도입하지 않음.
- 물리 엔진: **cannon-es** 채택 ([PLAN.md §2](../PLAN.md) 참조).
- 단위: SI(미터, 킬로그램, 초). 시뮬레이션에 사용. three.js 렌더 단위도 동일.
- 표준 치수: WPA 9피트 풀 테이블 (플레이 표면 2.54 × 1.27 m, 공 지름 57.15 mm).
- commit 단위: Phase 단위로 진행.

### 변경 요약
- 디렉토리 트리 생성 (`doc/`, `doc/stages/`, `src/{css,js,assets,...}`)
- [doc/PLAN.md](../PLAN.md) 작성 — 마스터 계획.
- [README.md](../../README.md) 갱신 — 실행 방법, 기술 스택.
- [doc/stages/stage-1-foundation.md](stage-1-foundation.md) (이 문서) 신설.

### 진입 조건 (다음 Phase로)
- [x] 디렉토리 구조 확정.
- [x] 마스터 계획 문서 존재.
- [x] 단계 문서 양식 확립.

→ Phase 1.2 진입 가능.

---

## Phase 1.2 — HTML/CSS/JS 스캐폴드 + three.js 로드

### 결정사항
- three.js **r184**, cannon-es **0.20.0** 핀. importmap을 통해 unpkg에서 직접 ESM 로드.
- 정적 서버는 `python3 -m http.server 8080 --directory src` 사용 (의존성 없음). `.claude/launch.json`에 등록.
- HUD는 별도 DOM 레이어(`#hud`)로 분리 — 캔버스와 독립적으로 패널을 띄움.

### 변경 요약
- [src/index.html](../../src/index.html): importmap (three / three/addons / cannon-es), `#app`, `#hud` 컨테이너.
- [src/css/style.css](../../src/css/style.css): 풀스크린 리셋, HUD 패널 스타일.
- [src/js/config.js](../../src/js/config.js): WPA 9피트 풀 테이블·공 상수, 물리/렌더 파라미터.
- [src/js/main.js](../../src/js/main.js): three.js·cannon-es import, 렌더러/씬/카메라 생성, 단일 프레임 렌더 + 리사이즈, 버전 표시 HUD.
- [.claude/launch.json](../../.claude/launch.json): 로컬 정적 서버 설정.

### 검증
- 브라우저 콘솔: `[boot] three.js 184 · cannon-es loaded: true`.
- HUD에 버전 패널 표시, 캔버스가 `SCENE.BACKGROUND` 색으로 채워짐.

→ Phase 1.3 진입 가능.

---

## Phase 1.3 — 기본 3D 씬

### 계획
- 원근 카메라, 방향광 + 환경광, 그림자.
- 임시 바닥(평면)과 큐브 1개로 정상 렌더 확인.
- `OrbitControls`로 카메라 회전/줌 가능하게.
- `requestAnimationFrame` 루프 + 리사이즈 핸들러.

### 진입 조건
- 브라우저에서 회전 가능한 3D 씬, 그림자가 떨어지는 큐브가 보여야 함. 이후 Stage 2에서 이 큐브를 물리 객체로 교체.
