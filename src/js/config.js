// 시뮬레이션 상수. 모든 단위는 SI (미터, 킬로그램, 초).
// 출처: WPA(World Pool-Billiard Association) 9피트 풀 테이블 표준, 표준 2.25" 풀볼.

export const TABLE = {
  PLAY_WIDTH: 2.54,           // 플레이 표면 긴 변, x축 (m)
  PLAY_HEIGHT: 1.27,          // 플레이 표면 짧은 변, z축 (m)
  CUSHION_NOSE_HEIGHT: 0.037, // 베드 위 쿠션 윗면 (m)
  CUSHION_DEPTH: 0.04,        // 쿠션 깊이, 안쪽 방향 돌출 (m)
  RAIL_WIDTH: 0.12,           // 레일 폭 (m)
  RAIL_HEIGHT: 0.06,          // 베드 위 레일 높이 (m, 쿠션보다 높음)
  POCKET_CORNER_CUT: 0.085,   // 코너에서 쿠션 끝까지 거리 (m)
  POCKET_SIDE_CUT: 0.075,     // 사이드 포켓에서 쿠션 끝까지 (m)
  BED_THICKNESS: 0.025,       // 베드 두께 (m, 시각화용)
  BED_HEIGHT: 0.78,           // 바닥에서 베드 윗면까지 (m, 시각화용)
};

export const BALL = {
  RADIUS: 0.05715 / 2,        // 공 반지름 (m), 지름 57.15mm
  MASS: 0.170,                // 공 무게 (kg)
};

export const POCKET = {
  CORNER_RADIUS: 0.058,       // 코너 포켓 반경 (m)
  SIDE_RADIUS: 0.064,         // 사이드 포켓 반경 (m)
};

export const PHYSICS = {
  GRAVITY: -9.81,             // m/s^2
  // 240Hz 고정 스텝. 풀파워 8m/s 공이 한 스텝에 0.033m → 쿠션 두께 미만이므로 터널링 방지.
  TIMESTEP: 1 / 240,
  MAX_SUBSTEPS: 8,
  FELT_FRICTION: 0.2,
  CUSHION_RESTITUTION: 0.85,
  BALL_RESTITUTION: 0.95,
  REST_VELOCITY: 0.03,         // 정지 판정 임계 (m/s).
  REST_ANGULAR: 1.0,           // 각속도 정지 판정 (rad/s).
  REST_SNAP_VELOCITY: 0.15,    // 이 미만이면 강제 v=0 + sleep (잔류 운동 컷).
  REST_SNAP_ANGULAR: 2.0,      // 이 미만이면 강제 ω=0 + sleep.
  BALL_LINEAR_DAMPING: 0.70,
  BALL_ANGULAR_DAMPING: 0.70,
  // 콜라이더 두께(외측 방향) — 시각 메시는 CUSHION_DEPTH 그대로, 콜라이더만 두껍게.
  CUSHION_COLLIDER_DEPTH: 0.30,
  CCD_SPEED_THRESHOLD: 0.5,
  // 샷 해결 안전 타임아웃 (s). 자연 정지가 안 끝나면 강제 resolve.
  SHOT_SAFETY_TIMEOUT: 4.0,
};

export const SCENE = {
  BACKGROUND: 0x0a0d10,
  AMBIENT_INTENSITY: 0.45,
  KEY_LIGHT_INTENSITY: 1.1,
};

export const CAMERA = {
  FOV: 55,
  NEAR: 0.01,
  FAR: 100,
};
