import { Actor, Circle, Text, CollisionType, Color, GraphicsGroup, Rectangle, vec, Vector, Font, TextAlign } from "excalibur";
import { Config } from "./config";

const ballColors = [
  // solid
  "#FCD116",
  "#003DA5",
  "#CE1126",
  "#660099",
  "#FF6600",
  "#007A3D",
  "#800020",
  "#000000",
  // striped balls
  "#FCD116",
  "#003DA5",
  "#CE1126",
  "#660099",
  "#FF6600",
  "#007A3D",
  "#800020"
].map(Color.fromHex);


export class Ball extends Actor {
  constructor(pos: Vector, number: number) {
    super({
      pos,
      radius: Config.BallRadius,
      color: ballColors[number - 1],
      collisionType: CollisionType.Active
    });

    const font = new Font({
      family: 'sans-serif',
      size: 16,
      bold: true,
      textAlign: TextAlign.Center
    });

    if (number > 8) { // striped
      this.graphics.use(
        new GraphicsGroup({
          members: [
            {
              // white
              offset: vec(-.5, -.5),
              graphic: new Circle({
                color: Color.White,
                strokeColor: ballColors[number - 1],
                lineWidth: 2,
                radius: Config.BallRadius
              })
            },
            {
              // stripe 1
              offset: vec(4, 10),
              graphic: new Rectangle({
                color: ballColors[number - 1],
                width: Config.BallRadius * 2 - 2,
                height: 20
              })
            },
            {
              // stripe 2
              offset: vec(2, 15),
              graphic: new Rectangle({
                color: ballColors[number - 1],
                width: Config.BallRadius * 2 + 2,
                height: 10
              })
            },
            {
              // number circle
              offset: vec(Config.BallRadius - Config.BallRadius / 2 - 2, Config.BallRadius - Config.BallRadius / 2 - 2),
              graphic: new Circle({
                color: Color.White,
                strokeColor: ballColors[number - 1],
                lineWidth: 2,
                radius: Config.BallRadius / 2 + 2
              })
            },
            {
              // number text
              useBounds: false,
              offset: vec(Config.BallRadius + 2, Config.BallRadius - 4.5),
              graphic: new Text({
                text: number.toString(),
                color: Color.Black,
                font
              })

            }
          ]
        }));
    } else {

      this.graphics.use(
        new GraphicsGroup({
          members: [
            {
              offset: vec(0, 0),
              graphic: new Circle({
                color: ballColors[number - 1],
                strokeColor: Color.White,
                lineWidth: 2,
                radius: Config.BallRadius
              })
            },

            {
              useBounds: false,
              offset: vec(Config.BallRadius + 2, Config.BallRadius - 4.5),
              graphic: new Text({
                text: number.toString(),
                color: Color.White,
                font
              })
            }
          ]
        }))
    }

    this.body.bounciness = Config.Bounciness;
  }
}
