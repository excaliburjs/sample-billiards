import { Actor, CollisionType, Color, DefaultLoader, easeInOutCubic, Engine, ExcaliburGraphicsContext, Random, Scene, SceneActivationContext, vec } from "excalibur";
import { Ball } from "./ball";
import { Config } from "./config";
import { Resources } from "./resources";

export class MyLevel extends Scene {
  random = new Random(1337);
  override onInitialize(engine: Engine): void {
    this.camera.pos.y += 300;
    this.camera.zoom = .5
    this.backgroundColor = Color.DarkGray;
    // https://www.dimensions.com/element/billiard-balls
    // american ball 2.25 in diameter
    //
    // bar size 79x39 in
    // home size 88x44 in 
    // regulation size 100x50 in

    const tableOrigin = vec(100, 0);
    const tableWidth = Config.TableWidth
    const tableHeight = Config.TableHeight;
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
    const tableSprite = Resources.Table.toSprite();
    tableSprite.destSize.width = tableWidth;
    tableSprite.destSize.height = tableHeight;
    background.graphics.use(tableSprite);
    this.add(background);

    const bumperLeft = new Actor({
      pos: tableOrigin,
      anchor: vec(0.5, 0),
      width: bumperThickness,
      height: tableHeight,
      color: Color.Brown.darken(.4),
      collisionType: CollisionType.Fixed
    });
    bumperLeft.body.bounciness = bounciness;
    this.add(bumperLeft);

    const bumperRight = new Actor({
      pos: tableOrigin.add(vec(tableWidth, 0)),
      anchor: vec(.5, 0),
      width: bumperThickness,
      height: tableHeight,
      color: Color.Brown.darken(.4),
      collisionType: CollisionType.Fixed
    });
    bumperRight.body.bounciness = bounciness;
    this.add(bumperRight);

    const bumperTop = new Actor({
      pos: tableOrigin,
      anchor: vec(0, .5),
      width: tableWidth,
      height: bumperThickness,
      color: Color.Brown.darken(.4),
      collisionType: CollisionType.Fixed
    });
    bumperTop.body.bounciness = bounciness;
    this.add(bumperTop);


    const bumperBottom = new Actor({
      pos: tableOrigin.add(vec(0, tableHeight)),
      anchor: vec(0, .5),
      width: tableWidth,
      height: bumperThickness,
      color: Color.Brown.darken(.4),
      collisionType: CollisionType.Fixed,
    });
    bumperBottom.body.bounciness = bounciness;
    this.add(bumperBottom);

    let ballNumber = 15;
    let ballDiameter = Config.BallRadius * 2;
    // centered on the table 
    let rackOrigin = tableOrigin.add(vec(tableWidth/2, 300));
    for (let y = 5; y > 0; y--) {
      for (let x = y - 1; x >= 0; x--) {
        const ball = new Ball(
          rackOrigin.add(vec(x * ballDiameter - y * Config.BallRadius, -y * ballDiameter)),
          ballNumber--
        );
        this.add(ball);
      }
    }

    const cueBall = new Ball(tableOrigin.add(vec(tableWidth/2, 800)), 0);
    cueBall.body.bounciness = bounciness;
    this.add(cueBall);
    this.camera.strategy.elasticToActor(cueBall, .6, .7);

    this.input.pointers.on('down', async (evt) => {
      this.add(cueBall);
      cueBall.pos = evt.worldPos;
      cueBall.vel = vec(0, -1800);
      await this.camera.zoomOverTime(1.5, 2000, easeInOutCubic);
      await this.camera.zoomOverTime(1, 1000, easeInOutCubic);
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
