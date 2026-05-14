# js-billiards-3d

three.js + cannon-es 기반의 웹 3D 8볼 당구 게임. 빌드 도구 없이 정적 호스팅 가능.

## 실행

`src/`만 정적 서버로 서빙하면 됩니다.

```bash
cd src
python3 -m http.server 8080
# → http://localhost:8080
```

`file://` 직접 열기는 ES Modules CORS 제약으로 동작하지 않습니다.

## 조작

| 입력 | 동작 |
|---|---|
| 마우스 드래그 | 카메라 회전 (= 조준 방향 변경) |
| 마우스 휠 | 줌 |
| **SPACE** 누름·유지 | 파워 차지 (게이지 충전 + 큐 스틱 풀백) |
| **SPACE** 떼기 | 큐볼에 임펄스 적용 (샷 발사) |
| 좌하단 **SPIN 위젯** 클릭/드래그 | 큐볼 타격점 선택 (톱·백·잉글리시) |
| **R** | 타격점 중심 리셋 |
| **V** | 탑뷰 ↔ 자유 시점 토글 |
| 마우스 클릭 (Ball-in-hand 상태) | 큐볼 자유 배치 확정 |
| New Game 버튼 (게임 종료 후) | 리셋 |

## 규칙 (간략)

- 표준 8볼 풀. 2인 로컬 교대.
- 브레이크 이후 첫 비-파울 객체구 포켓의 그룹이 슈터의 그룹(솔리드/스트라이프). 상대는 자동으로 반대 그룹.
- 합법적 샷: 자기 그룹의 공을 먼저 치고, 공이 포켓되거나 콘택트 후 어떤 공이라도 쿠션에 닿아야 함.
- 파울 종류: 스크래치(큐볼 포켓), 노콘택트, 잘못된 그룹 우선타격, 노레일+노포켓 등.
- 자기 그룹 클리어 후 8볼을 합법적으로 포켓하면 승리. 조기/파울 8볼 포켓은 패배.
- **파울 발생 시 ball-in-hand**: 상대가 큐볼을 마우스로 자유 배치(클릭으로 확정).

## 스핀(타격점) 시스템

- 좌하단 SPIN 위젯의 원 안에서 타격 지점을 선택.
- **위쪽 클릭 → 톱스핀 (follow)**: 충돌 후 큐볼이 앞으로 따라감.
- **아래쪽 → 백스핀 (draw)**: 충돌 후 큐볼이 뒤로 후진.
- **좌/우 → 잉글리시**: 쿠션 반사 후 진행 각도 휨.

각속도 = `offset · (v_linear / R) · gain` 으로 부여하며, 펠트의 동마찰이 톱/백을 굴림 방향으로 누적·전환.

## 사운드

Web Audio API 절차적 합성. 외부 파일 없음.

- 공-공 충돌: 짧고 날카로운 톤
- 공-쿠션: 둔탁한 thud
- 포켓 진입: 하강 plop
- 큐 임팩트: 짧은 tap

볼륨은 충돌 속도에 비례. 자동 재생 정책 회피를 위해 첫 사용자 입력에서 AudioContext가 초기화/resume.

## 기술 스택

- **렌더링**: [three.js](https://threejs.org/) r184 (ESM, unpkg CDN)
- **물리**: [cannon-es](https://github.com/pmndrs/cannon-es) 0.20.0
  - timestep 1/240, maxSubSteps 8 (터널링 방지)
  - 쿠션 콜라이더 외측 0.3m + 안전망 (3중 방어)
  - 댐핑 0.7 + 잔류 운동 강제 스냅 (정지 < 4초)
- **모듈**: 브라우저 네이티브 ES Modules + `<script type="importmap">`
- **빌드**: 없음. `src/`를 그대로 배포.
- **단위**: SI (m, kg, s). WPA 9피트 풀 표준 치수.

## 디렉토리 구조

```
js-billiards-3d/
├── README.md
├── doc/                     문서
│   ├── PLAN.md             마스터 계획
│   └── stages/             단계별 작업 기록 (stage-1 ~ stage-12)
└── src/                     정적 배포 루트
    ├── index.html          importmap + #app / #hud
    ├── css/style.css
    └── js/
        ├── main.js          부트스트랩
        ├── config.js        SI 단위 상수
        ├── audio/           SoundManager (절차적 합성)
        ├── scene/           Stage (렌더러+카메라+조명+컨트롤)
        ├── physics/         PhysicsWorld (cannon-es 래퍼, snap-to-rest)
        ├── objects/         Table, Ball, ballTexture, CueStick, AimLine, rack
        ├── controls/        ShotController (스페이스바 차지)
        ├── game/            Game (상태머신, 규칙, 턴, ball-in-hand)
        └── ui/              GameHUD, ImpactPicker
```

## 주요 단계 (Phase별 커밋 이력)

- **Stage 1**: 기반 (importmap, three.js scene)
- **Stage 2**: 물리 통합 (cannon-es)
- **Stage 3**: 테이블 + 16개 공
- **Stage 4**: 큐 스틱 + 샷 (스페이스바)
- **Stage 5**: 8볼 규칙 (그룹, 파울, 승/패)
- **Stage 6**: 조준 어시스트 라인
- **Stage 7**: 1차 마무리/배포
- **Stage 8**: 터널링 수정 + 즉응성 (CCD, 두꺼운 콜라이더, 댐핑·스냅)
- **Stage 9**: 타격점 위젯 + 스핀 물리
- **Stage 10**: 사운드 (절차적 합성)
- **Stage 11**: 탑뷰 토글, ball-in-hand, 공 번호 텍스처
- **Stage 12**: 최종 QA

각 단계의 상세는 [doc/stages/](doc/stages/) 참조.

## 문서

- [마스터 계획](doc/PLAN.md)
- [단계별 작업 기록](doc/stages/)
