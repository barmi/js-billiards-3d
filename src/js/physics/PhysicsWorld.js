import * as CANNON from 'cannon-es';

import { PHYSICS } from '../config.js';

// cannon-es 월드 + 머티리얼/접촉 + Body→Mesh 단방향 동기화.
// 사용:
//   const phys = new PhysicsWorld();
//   phys.addDynamic(ballBody, ballMesh);
//   stage.onUpdate(dt => phys.step(dt));
export class PhysicsWorld {
  constructor() {
    this.world = new CANNON.World({
      gravity: new CANNON.Vec3(0, PHYSICS.GRAVITY, 0),
    });

    this.world.broadphase = new CANNON.SAPBroadphase(this.world);
    this.world.allowSleep = true;
    this.world.solver.iterations = 12;

    this.materials = {
      ball: new CANNON.Material('ball'),
      felt: new CANNON.Material('felt'),
      cushion: new CANNON.Material('cushion'),
    };

    this.world.addContactMaterial(new CANNON.ContactMaterial(
      this.materials.ball, this.materials.felt,
      { friction: PHYSICS.FELT_FRICTION, restitution: 0.3 },
    ));
    this.world.addContactMaterial(new CANNON.ContactMaterial(
      this.materials.ball, this.materials.cushion,
      { friction: 0.1, restitution: PHYSICS.CUSHION_RESTITUTION },
    ));
    this.world.addContactMaterial(new CANNON.ContactMaterial(
      this.materials.ball, this.materials.ball,
      { friction: 0.05, restitution: PHYSICS.BALL_RESTITUTION },
    ));

    this._dynamic = [];
  }

  addStatic(body) {
    this.world.addBody(body);
    return body;
  }

  addDynamic(body, mesh) {
    this.world.addBody(body);
    this._dynamic.push({ body, mesh });
    mesh.position.copy(body.position);
    mesh.quaternion.copy(body.quaternion);
    return { body, mesh };
  }

  remove(body) {
    this.world.removeBody(body);
    const i = this._dynamic.findIndex((p) => p.body === body);
    if (i >= 0) this._dynamic.splice(i, 1);
  }

  step(dt) {
    this.world.step(PHYSICS.TIMESTEP, dt, PHYSICS.MAX_SUBSTEPS);
    const snapV2 = PHYSICS.REST_SNAP_VELOCITY * PHYSICS.REST_SNAP_VELOCITY;
    const snapW2 = PHYSICS.REST_SNAP_ANGULAR * PHYSICS.REST_SNAP_ANGULAR;
    for (const { body, mesh } of this._dynamic) {
      // 잔류 운동 컷: 매우 느리면 즉시 정지·sleep.
      if (body.sleepState !== CANNON.Body.SLEEPING &&
          body.velocity.lengthSquared() < snapV2 &&
          body.angularVelocity.lengthSquared() < snapW2) {
        body.velocity.set(0, 0, 0);
        body.angularVelocity.set(0, 0, 0);
        body.sleep();
      }
      mesh.position.copy(body.position);
      mesh.quaternion.copy(body.quaternion);
    }
  }

  // 모든 동적 바디가 사실상 정지했는지.
  isAllAtRest() {
    const vMax2 = PHYSICS.REST_VELOCITY * PHYSICS.REST_VELOCITY;
    const wMax2 = PHYSICS.REST_ANGULAR * PHYSICS.REST_ANGULAR;
    for (const { body } of this._dynamic) {
      if (body.sleepState !== CANNON.Body.SLEEPING) {
        if (body.velocity.lengthSquared() > vMax2) return false;
        if (body.angularVelocity.lengthSquared() > wMax2) return false;
      }
    }
    return true;
  }
}
