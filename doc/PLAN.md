# 3D 당구 게임 — 마스터 계획

## 1. 프로젝트 개요

- **목표**: three.js를 이용한 웹 기반 3D 8볼 당구 게임
- **배포 형태**: 정적 HTML + JS + CSS (서버리스, 빌드 도구 없이 브라우저에서 직접 실행 가능)
- **타깃 브라우저**: 최신 Chromium / Firefox / Safari (ES modules, WebGL2 지원)
- **모듈 로딩**: `<script type="importmap">`을 통한 CDN ESM 직접 임포트 (esm.sh / unpkg)

## 2. 기술 스택 결정

| 분야 | 선택 | 근거 |
|---|---|---|
| 렌더링 | **three.js** (r161+) | 요구사항. ESM 빌드 사용 |
| 물리 엔진 | **cannon-es** | 검토 결과 아래 참고 |
| 모듈 시스템 | 브라우저 네이티브 ESM + importmap | 빌드 도구 불필요, 배포 단순 |
| 스타일 | 순수 CSS | 의존성 최소화 |

### 물리 엔진 비교

| 엔진 | 장점 | 단점 | 적합도 |
|---|---|---|---|
| **cannon-es** | 순수 JS, 가벼움(~150KB), ESM, 활발한 유지보수, 구 충돌·마찰 안정적 | Bullet/Rapier 대비 성능 낮음 | **★ 채택** |
| Rapier.js | Rust/WASM, 매우 빠름, 결정론적 | WASM 로딩, API 학습 필요 | 차선 |
| Ammo.js | Bullet 포팅, 강력 | 용량 큼(~1MB+), API 복잡 | 부적합 |
| Oimo.js | 매우 가벼움 | 유지보수 정체 | 부적합 |

**결정**: `cannon-es` 채택. 당구는 구체-평면, 구체-구체, 구체-실린더 충돌이 대부분이라 cannon-es 처리 범위에 충분히 들어옴. 16개 공 시뮬레이션은 60fps 무리 없음.

## 3. 디렉토리 구조

```
js-billiards-3d/
├── README.md                # 프로젝트 소개
├── doc/                     # 문서
│   ├── PLAN.md             # 이 문서 (마스터 계획)
│   └── stages/             # 단계별 작업 기록
│       ├── stage-1-foundation.md
│       ├── stage-2-physics.md
│       └── ...
└── src/                     # 소스 코드 (정적 배포 루트)
    ├── index.html          # 진입점
    ├── css/
    │   └── style.css
    ├── js/
    │   ├── main.js         # 부트스트랩
    │   ├── config.js       # 상수 (테이블 크기, 공 크기 등)
    │   ├── scene/          # three.js 씬 구성 (조명, 카메라, 렌더러)
    │   ├── physics/        # cannon-es 물리 세계 및 동기화
    │   ├── objects/        # 테이블, 공, 큐 스틱 등 3D 객체
    │   ├── controls/       # 입력 처리 (마우스, 키보드, 카메라)
    │   ├── game/           # 게임 로직 (턴, 규칙, 상태 머신)
    │   ├── ui/             # HUD, 메뉴 등 DOM UI
    │   └── utils/          # 공용 유틸리티
    └── assets/
        ├── textures/       # 펠트, 나무, 공 텍스처
        └── models/         # (선택) 외부 모델
```

## 4. 실세계 스펙 (시뮬레이션 대상)

WPA(World Pool-Billiard Association) 표준 9피트 풀 테이블 기준.

| 항목 | 값 | 비고 |
|---|---|---|
| 플레이 표면(가로 × 세로) | 2.54 m × 1.27 m | 정확히 2:1 비율 (100" × 50") |
| 쿠션 높이 (베드 위) | ~37 mm | 공 반지름의 약 1.4배 |
| 공 지름 | 57.15 mm | 2.25 인치 |
| 공 무게 | 165–170 g | |
| 포켓 (코너) | ~114 mm 입구 | 공 지름의 약 2배 |
| 펠트 마찰 계수 | 동마찰 ~0.2 | 구체 굴림 마찰 별도 |

코드에서는 [src/js/config.js](src/js/config.js)에 상수로 정의 예정. 단위는 SI (미터, 킬로그램, 초).

## 5. 단계 및 phase 분해 — 실행 결과

각 단계 종료 시: 계획 평가 → 확인 → 단계 문서 마무리 → git commit.

> 표기: ✅ 완료 · 🟡 단순화/축약 완료 · ⏭️ 이연.
> 진행 중 phase가 분해/합쳐진 경우 단계 문서에 명시.

### Stage 1 — 기반 구축 ✅
- ✅ Phase 1.1: 디렉토리, 마스터 계획 문서, README
- ✅ Phase 1.2: HTML/CSS/JS 스캐폴드 + importmap으로 three.js + cannon-es 로드
- ✅ Phase 1.3: 기본 3D 씬 (Stage 클래스: 렌더러, 카메라, 조명, OrbitControls, 애니메이션 루프)

### Stage 2 — 물리 엔진 통합 ✅
- ✅ Phase 2.1: PhysicsWorld 모듈 + Body→Mesh 동기화 (2.1과 2.2를 통합)
- ✅ Phase 2.2: 구체 낙하/충돌 검증 데모

### Stage 3 — 당구대 및 공 ✅
- ✅ Phase 3.1: 표준 치수 당구대 시각 모델 (베드, 레일, 6 쿠션, 6 포켓 마커)
- ✅ Phase 3.2: 베드+쿠션 콜라이더 + 포켓 진입 판정
- ✅ Phase 3.3: 16개 공 + 표준 8볼 랙 + 스트라이프 흰 띠

### Stage 4 — 게임 메커닉 🟡
- ✅ Phase 4.1: CueStick + 카메라 기반 조준
- ✅ Phase 4.2: 스페이스바 차지/릴리스 + 파워 게이지 + 큐 스틱 풀백
- ⏭️ Phase 4.3: 스핀 — Stage 7로 이연 (현재는 직선 타격만)

### Stage 5 — 8볼 규칙 ✅
- ✅ Phase 5.1: 게임 상태 머신 + 턴 관리 + 큐볼 스크래치 재배치
- ✅ Phase 5.2: 콘택트 추적, 그룹 할당, 합법 샷 판정, 파울 사유 표시
- ✅ Phase 5.3: 8볼 승/패, Game Over 오버레이 + New Game

### Stage 6 — UI/UX 🟡
- ✅ Phase 6.1: 조준 어시스트 라인 (공·쿠션 첫 충돌까지)
- ⏭️ Phase 6.2: 탑뷰 카메라 토글 — 향후 폴리시

### Stage 7 — 마무리 및 배포 ✅
- ✅ Phase 7.1: 최종 QA, README 완성, 정적 배포 검증

## 6.5. 이연 항목 (향후 이터레이션)

- 스핀(잉글리시) 입력 + 공 회전 처리
- 탑뷰 카메라 토글
- 공 번호 텍스처
- 사운드 효과
- Ball-in-hand 자유 배치
- 모바일 터치 컨트롤
- 단일 플레이용 AI

## 6. 작업 원칙

1. **Phase 단위 commit**: 각 Phase 종료 시 평가 → 확인 → 단계 문서 갱신 → commit.
2. **각 Stage 문서화**: [doc/stages/stage-N-*.md](doc/stages/)에 Phase별 결정사항, 변경 요약, 진입 조건 기록.
3. **유닛은 SI**: 거리는 미터, 시간은 초. 시각화에서만 필요 시 스케일링.
4. **상수는 config.js**: 매직 넘버 금지, 모든 치수·파라미터는 한 곳에서 관리.
5. **빌드 도구 없음**: 모든 모듈은 브라우저가 직접 실행 가능해야 함 (importmap + ESM).

## 7. 진척 추적

전체 진행 상태는 본 문서 하단 체크리스트로 관리하지 않고, TodoWrite와 단계 문서로 추적. 이 문서는 계획·결정의 영구 기록.
