import { Actor, Circle, Text, CollisionType, Color, GraphicsGroup, Rectangle, vec, Vector, Font, TextAlign, Engine, Label, BaseAlign, Material, clamp, Canvas, ImageSource, DegreeOfFreedom } from "excalibur";
import { Config } from "./config";

const ballColors = [
  // first is cue ball
  "#FFFFFF",

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
      color: ballColors[number],
      collisionType: CollisionType.Active
    });
    this.body.bounciness = Config.Bounciness;
    this.graphics.color = ballColors[number];

    this.originalPos = pos.clone();

    const font = new Font({
      family: 'sans-serif',
      size: 26,
      bold: true,
      textAlign: TextAlign.Center,
      baseAlign: BaseAlign.Middle
    });

    const canvas = new Canvas({
      width: 2 * Math.PI * Config.BallRadius,
      height: 2 * Math.PI * Config.BallRadius,
      draw: (ctx) => {

        if (this.number > 8) {
          ctx.save();
          ctx.fillStyle = 'white';
          ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height / 3 - 5);
          ctx.restore();

          ctx.save();
          ctx.fillStyle = 'white';
           ctx.fillRect(0, 2 * ctx.canvas.height / 3 + 5, ctx.canvas.width, ctx.canvas.height / 3);
          ctx.restore();
        }

        ctx.save();
        ctx.beginPath();
        ctx.fillStyle = 'white';
        ctx.arc(Config.BallRadius * Math.PI, Config.BallRadius * Math.PI, Config.BallRadius, 0, 2 * Math.PI);
        ctx.closePath();
        ctx.fill();
        ctx.restore();

        ctx.save();
        ctx.textAlign = font.textAlign;
        ctx.textBaseline = font.baseAlign;
        ctx.font = font.fontString;
        ctx.fillStyle = 'black';
        ctx.fillText(this.number.toString(), Config.BallRadius * Math.PI, Config.BallRadius * Math.PI + 1);
        ctx.restore();
      }
    });
    canvas.rasterize();
    this.textImage = ImageSource.fromHtmlCanvasElement(canvas._bitmap);
  }

  onInitialize(engine: Engine): void {
    const glsl = (x: any) => x[0]; // this is just for syntax highlighting
    this.oldPos = this.originalPos;

    this.billardsMat = this.graphics.material = engine.graphicsContext.createMaterial({
      name: 'billiards',
      fragmentSource:
        glsl`#version 300 es

        #define PI 3.141592653
        precision mediump float;

        uniform vec2 accumulatedRotation;
        uniform float ballRadius;
        uniform vec4 color;
        uniform float number;
        uniform sampler2D text;
        uniform float rotation;

        in vec2 v_uv;

        out vec4 fragColor;


        // Convert 2D circle UV to 3D sphere normal
        vec3 uvToSphereNormal(vec2 uv, out float alpha) {
            // Convert UV to -1 to 1 range centered at origin
            vec2 pos = (uv - 0.5) * 2.0;
            float dist = length(pos);

            float edgeWidth = fwidth(dist) * 2.0;
            alpha = 1.0 - smoothstep(1.0 - edgeWidth, 1.0, dist);

            float z = sqrt(max(0.0, 1.0 - dist * dist));
            return normalize(vec3(pos.x, pos.y, z));
        }

        // Rotate a point around an axis
        vec3 rotateAroundAxis(vec3 p, vec3 axis, float angle) {
            axis = normalize(axis);
            float s = sin(angle);
            float c = cos(angle);
            float oc = 1.0 - c;

            mat3 rot = mat3(
                oc * axis.x * axis.x + c,           oc * axis.x * axis.y - axis.z * s,  oc * axis.z * axis.x + axis.y * s,
                oc * axis.x * axis.y + axis.z * s,  oc * axis.y * axis.y + c,           oc * axis.y * axis.z - axis.x * s,
                oc * axis.z * axis.x - axis.y * s,  oc * axis.y * axis.z + axis.x * s,  oc * axis.z * axis.z + c
            );

            return rot * p;
        }

        void main(){
          float alpha;
          vec3 worldNormal = uvToSphereNormal(v_uv, alpha);
          worldNormal = rotateAroundAxis(worldNormal, vec3(0.0, 0.0, 1.0), -rotation);

          vec3 lightDir = normalize(vec3(0.5, 0.5, 1.0));
          float lighting = max(dot(worldNormal, lightDir), 0.5);

          float fade = fwidth(dot(v_uv, v_uv));

          vec3 textureNormal = uvToSphereNormal(v_uv, alpha);

          // Apply accumulated rolling rotations
          textureNormal = rotateAroundAxis(textureNormal, vec3(0.0, 1.0, 0.0), -accumulatedRotation.y);
          textureNormal = rotateAroundAxis(textureNormal, vec3(1.0, 0.0, 0.0), accumulatedRotation.x);
          textureNormal = rotateAroundAxis(textureNormal, vec3(0.0, 0.0, 1.0), rotation);

          // Convert sphere normal to texture UV coordinates
          // Using spherical mapping
          vec2 texUV;
          texUV.x = 0.5 + atan(textureNormal.x, textureNormal.z) / (1.0 * PI);
          texUV.y = 0.5 + asin(textureNormal.y) / PI;

          fragColor = color;

          // Sample the texture
          if (number > 0.) {
            vec4 textcolor = texture(text, texUV);
            fragColor.rgb = mix(fragColor.rgb, textcolor.rgb, textcolor.a);
          }
          fragColor.rgb *= lighting;
          fragColor.a = alpha;

          // premult
          fragColor.rgb *= fragColor.a;
        }
      `,
      uniforms: {
        ballRadius: Config.BallRadius,
        accumulatedRotation: this._accum,
        color: this.graphics.color!,
        number: this.number,
        rotation: this.rotation
      }
    });

    if (this.number > 0) {
      this.textImage.ready.then(() => {
        this.billardsMat.update(shader => {
          shader.addImageSource('text', this.textImage);
        });
      });
    }
  }

  _accum: Vector = vec(0, 0);
  onPreUpdate(engine: Engine, elapsed: number): void {
    let deltaX = this.pos.x - this.oldPos.x;
    let deltaY = this.pos.y - this.oldPos.y;

    // Accumulate rotation angles
    if (Math.abs(deltaX) > .01) {
      this._accum.x -= deltaX / Config.BallRadius; // Y movement rotates around X axis
    }
    if (Math.abs(deltaY) > .01) {
      this._accum.y -= deltaY / Config.BallRadius; // X movement rotates around Y axis
    }

    this.billardsMat.uniforms.accumulatedRotation = this._accum;
    this.billardsMat.uniforms.rotation = this.rotation;

    // friction
    if (this.vel.squareDistance() > .01) {
      this.vel = this.vel.add(this.vel.negate().scale(.01));
    }
    if (Math.abs(this.angularVelocity) > .01) {
      this.angularVelocity = this.angularVelocity - this.angularVelocity * .01;
    }
  }
}
