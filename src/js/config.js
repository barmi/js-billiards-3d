// 시뮬레이션 상수. 모든 단위는 SI (미터, 킬로그램, 초).
// 출처: WPA(World Pool-Billiard Association) 9피트 풀 테이블 표준, 표준 2.25" 풀볼.

export const TABLE = {
  PLAY_WIDTH: 2.54,           // 플레이 표면 긴 변 (m)
  PLAY_HEIGHT: 1.27,          // 플레이 표면 짧은 변 (m)
  CUSHION_NOSE_HEIGHT: 0.037, // 베드 위 쿠션 노즈 높이 (m)
  RAIL_WIDTH: 0.12,           // 레일 폭 (m, 시각화용 근사)
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
  TIMESTEP: 1 / 60,           // 60Hz 고정 스텝
  MAX_SUBSTEPS: 4,
  FELT_FRICTION: 0.2,         // 공-펠트 동마찰
  CUSHION_RESTITUTION: 0.85,  // 쿠션 반발
  BALL_RESTITUTION: 0.95,     // 공-공 반발
  REST_VELOCITY: 0.01,        // 이 속도 미만이면 정지로 간주 (m/s)
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
