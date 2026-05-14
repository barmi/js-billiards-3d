# Stage 3 — 당구대 및 16개 공

목표: 실제 9피트 풀 표준 치수의 당구대를 시각·물리 양쪽에서 구현하고, 8볼 랙 셋업에 필요한 16개 공을 생성.

## Phase 분해

- **Phase 3.1**: 당구대 시각 모델 — 베드(펠트), 4 레일(나무), 4 쿠션(고무), 6 포켓 마커. `Table` 객체로 캡슐화.
- **Phase 3.2**: 물리 콜라이더 — 베드 평면 + 쿠션 벽(box) + 포켓 센서. 임시 바닥 제거.
- **Phase 3.3**: 16개 공(큐볼 + 1~15) 생성, 표준 랙 위치, 공 색·번호 마킹, 댐핑/마찰 파라미터 튜닝.

## 좌표계 약속

- **xy 평면**: 베드 표면. 베드 윗면이 **y = 0**.
- **x축**: 테이블 긴 변 (length, PLAY_WIDTH).
- **z축**: 테이블 짧은 변 (height/width, PLAY_HEIGHT).
- **y축**: 위쪽. 공은 y = `BALL.RADIUS`에 안착.
- 카메라는 일반적으로 (+x, +y, +z) 방향에서 원점을 봄.

---

## Phase 3.1 — 당구대 시각 모델

### 결정사항
- 좌표계: 베드 윗면이 y=0, 긴 변이 x, 짧은 변이 z. 모든 후속 단계가 이 약속을 따름.
- 모듈: [src/js/objects/Table.js](../../src/js/objects/Table.js)의 `Table` 클래스가 `group`(Three.js Group)을 노출. 외부에서 `stage.add(table.group)`.
- 레이아웃 (안쪽→바깥쪽): 베드 → 쿠션(`CUSHION_DEPTH`) → 레일(`RAIL_WIDTH`). 외곽 크기 = `(W + 2(CD+RW)) × (H + 2(CD+RW))`.
- 레일: 4개 박스. 높이 `RAIL_HEIGHT` (= 0.06m, 쿠션보다 높음).
- 쿠션: 긴 변 2조각씩 × 2면 + 짧은 변 1조각 × 2면 = 6 조각. 코너/사이드 포켓 컷(`POCKET_CORNER_CUT`, `POCKET_SIDE_CUT`)으로 잘림.
- 포켓 마커: 6개 검은 원판 (`y=0.001`로 베드 위에 띄움, z-fight 방지). 코너 4 + 사이드 2.
- `table.pocketCenters: Vector3[6]` 노출 — Phase 3.2 콜라이더, Phase 3.3 랙 셋업에 재사용.
- config.js에 `CUSHION_DEPTH`, `RAIL_HEIGHT`, `POCKET_CORNER_CUT`, `POCKET_SIDE_CUT` 추가.

### 변경 요약
- 신규: [src/js/objects/Table.js](../../src/js/objects/Table.js).
- [src/js/config.js](../../src/js/config.js): TABLE 상수 확장.
- [src/js/main.js](../../src/js/main.js): 임시 큐브/단일 색 평면 → `Table` 사용. 카메라를 (2.4, 1.6, 2.4)로 후퇴해 전체 테이블 가시화. 임시 공 2개(흰색 + 노랑) 배치.

### 검증
- 브라우저에서 펠트 그린 베드, 마호가니 레일, 6개 포켓(코너 4 + 사이드 2) 모두 인식 가능.
- 공 두 개가 베드 표면에 정상 안착.
- 콘솔 에러 없음.

→ Phase 3.2 진입.

---

## Phase 3.2 — 물리 콜라이더 + 포켓 진입 판정

### 결정사항
- 쿠션 세그먼트 데이터를 `Table._cushionSegments()`로 한 곳에 모아 시각·물리가 공유. 메시 6개와 콜라이더 6개가 같은 형상/위치를 사용.
- 베드는 `CANNON.Plane` (무한 평면) 그대로 — 포켓 컷아웃을 베드에 만들 필요 없음. 공이 포켓 반경 안으로 들어오면 코드로 "포켓됨" 처리하기 때문.
- 포켓 검출: 매 스텝 `table.isInPocket(body.position)`을 호출. 진입 시 속도 (0,-0.8,0) + angularVelocity=0, 350ms 뒤 body/mesh 제거. 센서 바디 + beginContact 이벤트 대비 단순.
- 사이즈 정합: 콜라이더 박스 half-extent는 메시 BoxGeometry의 절반. `CUSHION_DEPTH`/`POCKET_CORNER_CUT`/`POCKET_SIDE_CUT` 한 곳에서 관리.

### 변경 요약
- [src/js/objects/Table.js](../../src/js/objects/Table.js): `addPhysics(physics)` 추가 — 베드 평면 + 6 쿠션 박스를 물리 월드에 등록. `isInPocket(position)` 헬퍼.
- [src/js/main.js](../../src/js/main.js):
  - 임시 ground 평면 제거, 대신 `table.addPhysics(physics)` 호출.
  - 데모용 표적구 4개 추가, 큐볼에 초기 속도(3.5, 0, 0.1) 부여.
  - `handlePocketing()` 루프 — 포켓 진입 시 가라앉히고 350ms 뒤 제거.

### 검증
- 공이 쿠션에 부딪혀 반사 (이전 평면 시점에는 끝없이 굴러나갔음).
- 콘솔 에러 없음. 60fps 유지.

→ Phase 3.3 진입 — 임시 공을 정식 16개 랙으로 교체.

---

## Phase 3.3 — 16개 공 + 랙 (예정)

### 계획
- `Ball` 클래스 (메시+바디+번호+그룹). 솔리드/스트라이프/큐/8볼 구분.
- 표준 8볼 랙 위치 계산.
- 공 색상/번호: 텍스처는 Phase 7에 미루고, 우선 단색 + 번호용 작은 흰 원 디스크로 식별.
