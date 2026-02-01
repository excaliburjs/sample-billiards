import { Actor, CollisionType, Color, DefaultLoader, Engine, ExcaliburGraphicsContext, Random, Scene, SceneActivationContext, vec } from "excalibur";
import { Ball } from "./ball";
import { Config } from "./config";

export class MyLevel extends Scene {
  random = new Random(1337);
  override onInitialize(engine: Engine): void {
    // https://www.dimensions.com/element/billiard-balls
    // american ball 2.25 in diameter
    //
    // bar size 79x39 in
    // home size 88x44 in 
    // regulation size 100x50 in

    const tableOrigin = vec(100, 0);
    const tableWidth = Config.TableWidth
    const tableHeight = Config.TableHeight;
    const ballRadius = Config.BallRadius;
    const bumperThickness = Config.BumperThickness;
    const bounciness = .9;

    const background = new Actor({
      pos: tableOrigin,
      anchor: vec(0, 0),
      width: tableWidth,
      height: tableHeight,
      color: Color.fromHex("#276b40"),
      collisionType: CollisionType.PreventCollision
    });
    this.add(background);

    const bumperLeft = new Actor({
      pos: tableOrigin,
      anchor: vec(0.5, 0),
      width: bumperThickness,
      height: tableHeight,
      color: Color.Black,
      collisionType: CollisionType.Fixed
    });
    bumperLeft.body.bounciness = bounciness;
    this.add(bumperLeft);

    const bumperRight = new Actor({
      pos: tableOrigin.add(vec(tableWidth, 0)),
      anchor: vec(.5, 0),
      width: bumperThickness,
      height: tableHeight,
      color: Color.Black,
      collisionType: CollisionType.Fixed
    });
    bumperRight.body.bounciness = bounciness;
    this.add(bumperRight);

    const bumperTop = new Actor({
      pos: tableOrigin,
      anchor: vec(0, .5),
      width: tableWidth,
      height: bumperThickness,
      color: Color.Black,
      collisionType: CollisionType.Fixed
    });
    bumperTop.body.bounciness = bounciness;
    this.add(bumperTop);


    const bumperBottom = new Actor({
      pos: tableOrigin.add(vec(0, tableHeight)),
      anchor: vec(0, .5),
      width: tableWidth,
      height: bumperThickness,
      color: Color.Black,
      collisionType: CollisionType.Fixed,
    });
    bumperBottom.body.bounciness = bounciness;
    this.add(bumperBottom);

    for (let ballNumber = 1; ballNumber < 15; ballNumber++) {
      const ball = new Ball(
        vec(
          this.random.floating(150, 250),
          this.random.floating(150, 250)),
        ballNumber
      );
      this.add(ball);
    }

    const cueBall = new Actor({
      radius: ballRadius,
      color: Color.White,
      collisionType: CollisionType.Active
    });

    cueBall.body.bounciness = bounciness;


    this.input.pointers.on('down', (evt) => {
      this.add(cueBall);
      cueBall.pos = evt.worldPos;
      cueBall.vel = vec(0, -800);
    });
  }

  override onPreLoad(loader: DefaultLoader): void {
    // Add any scene specific resources to load
  }

  override onActivate(context: SceneActivationContext<unknown>): void {
    // Called when Excalibur transitions to this scene
    // Only 1 scene is active at a time
  }

  override onDeactivate(context: SceneActivationContext): void {
    // Called when Excalibur transitions away from this scene
    // Only 1 scene is active at a time
  }

  override onPreUpdate(engine: Engine, elapsedMs: number): void {
    // Called before anything updates in the scene
  }

  override onPostUpdate(engine: Engine, elapsedMs: number): void {
    // Called after everything updates in the scene
  }

  override onPreDraw(ctx: ExcaliburGraphicsContext, elapsedMs: number): void {
    // Called before Excalibur draws to the screen
  }

  override onPostDraw(ctx: ExcaliburGraphicsContext, elapsedMs: number): void {
    // Called after Excalibur draws to the screen
  }
}
