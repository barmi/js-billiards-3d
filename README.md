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
| **SPACE 누름·유지** | 파워 차지 (게이지 충전, 큐 스틱 풀백) |
| **SPACE 떼기** | 큐볼에 임펄스 적용 (샷 발사) |
| New Game 버튼 (게임 종료 후) | 리셋 |

## 규칙 (간략)

- 표준 8볼 풀. 2인 로컬 교대.
- 브레이크 이후 첫 비-파울 객체구 포켓의 그룹이 슈터의 그룹(솔리드/스트라이프). 상대는 자동으로 반대 그룹.
- 합법적 샷: 자기 그룹의 공을 먼저 치고, 공이 포켓되거나 콘택트 후 어떤 공이라도 쿠션에 닿아야 함.
- 파울 종류: 스크래치(큐볼 포켓), 노콘택트, 잘못된 그룹 우선타격, 노레일+노포켓 등.
- 자기 그룹 클리어 후 8볼을 합법적으로 포켓하면 승리. 조기/파울 8볼 포켓은 패배.
- 스크래치 시 큐볼은 헤드 스팟에 자동 재배치.

## 기술 스택

- **렌더링**: [three.js](https://threejs.org/) r184 (ESM, unpkg CDN)
- **물리**: [cannon-es](https://github.com/pmndrs/cannon-es) 0.20.0
- **모듈**: 브라우저 네이티브 ES Modules + `<script type="importmap">`
- **빌드**: 없음. `src/`를 그대로 배포.
- **단위**: SI (m, kg, s). WPA 9피트 풀 표준 치수.

## 디렉토리 구조

```
js-billiards-3d/
├── README.md
├── doc/                     문서
│   ├── PLAN.md             마스터 계획
│   └── stages/             단계별 작업 기록 (stage-1 ~ stage-7)
└── src/                     정적 배포 루트
    ├── index.html          importmap + #app / #hud
    ├── css/style.css
    └── js/
        ├── main.js          부트스트랩
        ├── config.js        SI 단위 상수
        ├── scene/           Stage(렌더러+카메라+조명+컨트롤)
        ├── physics/         PhysicsWorld(cannon-es 래퍼)
        ├── objects/         Table, Ball, CueStick, AimLine, rack
        ├── controls/        ShotController(스페이스바 차지)
        ├── game/            Game(상태머신, 규칙, 턴)
        └── ui/              GameHUD
```

## 알려진 제한 / 이연 항목

다음은 향후 이터레이션 대상입니다 ([doc/stages/stage-7-deploy.md](doc/stages/stage-7-deploy.md) 참조):

- 스핀(잉글리시) 미구현 — 직선 타격만.
- 공 번호 텍스처 없음 — 색상/흰 띠로만 식별.
- Ball-in-hand 자유 배치 미지원 — 스크래치 시 헤드 스팟에 자동 배치.
- 사운드 효과 없음.
- 모바일 터치 컨트롤 미최적화.
- AI 단일 플레이 미지원.

## 문서

- [마스터 계획](doc/PLAN.md)
- [단계별 작업 기록](doc/stages/)
