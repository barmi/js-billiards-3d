// 스페이스바 차지·릴리스 입력 → 큐볼 속도 적용.
// 사용:
//   const shot = new ShotController({
//     canShoot:    () => boolean,
//     getAimDir:   () => THREE.Vector3,   // xz 정규화 조준 방향
//     onCharge:    (power) => {},         // power: 0..1
//     onFire:      (power) => {},         // 발사 시점, power=0..1
//   });
//   shot.attach(window);
//   shot.update(dt);
export class ShotController {
  constructor({ canShoot, getAimDir, onCharge, onFire, chargeSeconds = 1.5 }) {
    this.canShoot = canShoot;
    this.getAimDir = getAimDir;
    this.onCharge = onCharge;
    this.onFire = onFire;
    this.chargeRate = 1 / chargeSeconds;

    this.charging = false;
    this.power = 0;

    this._onKeyDown = (e) => {
      if (e.code !== 'Space' || e.repeat) return;
      if (!this.canShoot()) return;
      this.charging = true;
      this.power = 0;
      e.preventDefault();
    };
    this._onKeyUp = (e) => {
      if (e.code !== 'Space' || !this.charging) return;
      this.onFire(this.power);
      this.charging = false;
      this.power = 0;
      this.onCharge(0);
      e.preventDefault();
    };
  }

  attach(target = window) {
    this._target = target;
    target.addEventListener('keydown', this._onKeyDown);
    target.addEventListener('keyup', this._onKeyUp);
  }

  detach() {
    if (!this._target) return;
    this._target.removeEventListener('keydown', this._onKeyDown);
    this._target.removeEventListener('keyup', this._onKeyUp);
    this._target = null;
  }

  update(dt) {
    if (!this.charging) return;
    // 차지 중에 공이 움직이기 시작하면 취소.
    if (!this.canShoot()) {
      this.charging = false;
      this.power = 0;
      this.onCharge(0);
      return;
    }
    this.power = Math.min(1, this.power + dt * this.chargeRate);
    this.onCharge(this.power);
  }
}
