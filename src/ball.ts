import { Actor, Circle, Text, CollisionType, Color, GraphicsGroup, Rectangle, vec, Vector, Font, TextAlign, Engine, Label, BaseAlign, Material, clamp, Canvas, ImageSource, DegreeOfFreedom } from "excalibur";
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
  billardsMat!: Material;
  textImage: ImageSource;
  originalPos: Vector;
  constructor(pos: Vector, public number: number) {
    super({
      pos,
      radius: Config.BallRadius,
      color: ballColors[number - 1],
      collisionType: CollisionType.Active
    });
    this.body.bounciness = Config.Bounciness;
    this.body.limitDegreeOfFreedom.push(DegreeOfFreedom.Rotation);
    this.graphics.color = ballColors[number - 1];

    this.originalPos = pos.clone();

    const font = new Font({
      family: 'sans-serif',
      size: 16,
      bold: true,
      textAlign: TextAlign.Center,
      baseAlign: BaseAlign.Middle
    });

    const canvas = new Canvas({
      width: Config.BallRadius * 2,
      height: Config.BallRadius * 2,
      draw: (ctx) => {
        ctx.save();
        ctx.textAlign = font.textAlign;
        ctx.textBaseline = font.baseAlign;
        ctx.font = '24px sans-serif';//font.fontString;
        ctx.fillStyle = 'black';
        // ctx.fillText("TEST", 0, 0);
        ctx.fillRect(5, 5, 5, 5);
        ctx.restore();
      }
    });
    canvas.flagDirty();
    this.textImage = ImageSource.fromHtmlCanvasElement(canvas._bitmap);

  }

   onInitialize(engine: Engine): void {

    const glsl = (x: any) => x[0];
    console.log(this.graphics.color);
    this.billardsMat = this.graphics.material = engine.graphicsContext.createMaterial({
      name: 'billiards',
      fragmentSource:
        glsl`#version 300 es
        precision mediump float;

        uniform vec4 color;
        uniform float number;
        uniform sampler2D u_graphic;
        uniform sampler2D text;
        uniform vec2 roll;
        uniform float u_time_ms;

        in vec2 v_uv;

        out vec4 fragColor;

        void main(){
          vec2 uv = v_uv;
          vec2 scroll; 
          scroll.x = uv.x - roll.x;
          scroll.y = uv.y - roll.y;

          uv.x = mod(scroll.x, 1.);
          uv.y = mod(scroll.y, 1.);

          float dist = 1.0 - length(uv * 2.0 - 1.0);
          float fade = fwidth(dot(v_uv, v_uv));

          fragColor = color;

          // "Stripe" pattern for number 9 to 15
          if (number > 8.) {
            fragColor.rgb = mix(vec3(1.), fragColor.rgb, smoothstep(0.15 - fade / 2., 0.15 + fade / 2., uv.y));
            fragColor.rgb = mix(fragColor.rgb, vec3(1.), smoothstep(0.85 - fade / 2., 0.85 + fade / 2., uv.y));
          }

          // Circle for Text
          fragColor.rgb = mix(fragColor.rgb, vec3(1.), smoothstep(.45 - fade / 2., .45 + fade / 2., dist));

          // Text
          // vec4 textcolor = texture(text, uv);
          // fragColor.rgb = textcolor.rgb;// mix(fragColor.rgb, textcolor.rgb, textcolor.a);

          // Outer edge
          fragColor.a = texture(u_graphic, v_uv).a;


          // premult alpha
          fragColor.rgb *= fragColor.a;
        }
      `,
      uniforms: {
        color: this.graphics.color!,
        number: this.number,
        roll: vec(0, 0)
      }
    });

    // this.textImage.ready.then(() => {
    //   // this.billardsMat.addImageSource('text', this.textImage);
    //   document.body.appendChild(this.textImage.image);
    //   this.billardsMat.update(shader => {
    //     shader.addImageSource('text', this.textImage);
    //   });
    // });

  }

  _rolling: Vector = vec(0, 0);
  onPreUpdate(engine: Engine, elapsed: number): void {
    this._rolling = this.pos.sub(this.originalPos).scale(1 / (2 * Config.BallRadius));
    this.billardsMat.uniforms.roll = this._rolling;

  }
}
