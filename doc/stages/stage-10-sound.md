# Stage 10 — 사운드 효과 (사실감)

> 사용자 요구: "사운드 효과를 사실감 있게 넣기"

## Phase 분해

- **Phase 10.1**: Web Audio API 절차적 사운드 + 이벤트 와이어업.

## 정책

- 외부 오디오 파일 없음 (HTML/JS/CSS만으로 배포 요구사항 유지).
- Web Audio API로 절차적 합성. AudioBuffer를 미리 빌드해 두고 collision 시점에 재생(저지연).
- 자동 재생 정책 회피: 첫 사용자 입력(클릭/키)에서 AudioContext resume.

## 사운드 종류

| 이벤트 | 음향 특징 | 합성 방식 |
|---|---|---|
| 공-공 충돌 | 짧고 날카로운 "tock" (~80ms) | 짧은 노이즈 버스트 + 800Hz 부근 공명 필터, 빠른 감쇠 |
| 공-쿠션 | 둔탁한 "thud" (~150ms) | 200Hz 사인 + 노이즈, 중간 Q 밴드패스, 부드러운 감쇠 |
| 공-포켓 진입 | "plop" + 짧은 트레일 | 100Hz 하행 슬라이드 + 짧은 노이즈 |
| 큐 임팩트 | "tap" (~50ms) | 600Hz 짧은 임펄스 + 미세 노이즈 |

볼륨은 충돌 속도에 비례 (clamp [0.05, 1.0]).

## 모듈

- 신규: [src/js/audio/SoundManager.js](../../src/js/audio/SoundManager.js).
  - `init()`: AudioContext 생성, 4종 AudioBuffer 사전 합성.
  - `resume()`: 사용자 입력 시 호출.
  - `playBallBall(velocity)`, `playBallCushion(velocity)`, `playPocket()`, `playCueImpact(power)`.

## 이벤트 와이어업

- `physics.world.addEventListener('beginContact', e)`에서 bodyA/B 종류 판별:
  - 공-공 → ballBall (속도 차로 강도)
  - 공-쿠션 → ballCushion (공 속도로 강도)
- 포켓 진입 (handlePocketing에서 `sink()` 시) → playPocket.
- 샷 발사 (`onFire`) → playCueImpact(power).

## 검증

- 사용자가 첫 키 입력 시 AudioContext resume 정상.
- 풀파워 브레이크 시: 큐 임팩트 → 다수의 공-공 사운드 → 쿠션·포켓 사운드.
- 무한 반복 같은 버그 없음.
- 모바일/사운드 차단 환경에서 에러 없이 무음으로 동작.
