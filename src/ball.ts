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
    // this.body.limitDegreeOfFreedom.push(DegreeOfFreedom.Rotation);
    this.graphics.color = ballColors[number - 1];
    this.graphics.use(new Rectangle({
      width: Config.BallRadius * 4,
      height: Config.BallRadius * 4,
      color: ballColors[number - 1]
    }));

    this.originalPos = pos.clone();

    const font = new Font({
      family: 'sans-serif',
      size: 12,
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
        ctx.font = font.fontString;
        ctx.fillStyle = 'black';
        ctx.fillText(this.number.toString(), Config.BallRadius, Config.BallRadius + 1);
        ctx.restore();
      }
    });
    canvas.rasterize();
    this.textImage = ImageSource.fromHtmlCanvasElement(canvas._bitmap);
  }

  onInitialize(engine: Engine): void {
    const glsl = (x: any) => x[0]; // this is just for syntax highlighting

    this.billardsMat = this.graphics.material = engine.graphicsContext.createMaterial({
      name: 'billiards',
      fragmentSource:
        glsl`#version 300 es

        #define PI 3.141592653
        precision mediump float;

        uniform vec4 color;
        uniform float number;
        uniform sampler2D u_graphic;
        uniform sampler2D text;
        uniform vec2 roll;
        uniform float u_time_ms;
        uniform float rotation;

        in vec2 v_uv;

        out vec4 fragColor;

        mat3 rotateZ(float angle) {
            float s = sin(angle);
            float c = cos(angle);
            return mat3(
                c, -s, 0.,
                s, c,  0.,
                0., 0., 1.
            );
        }


        mat2 rotate2d(float angle) {
            float s = sin(angle);
            float c = cos(angle);
            return mat2(
                c, -s,
                s, c
            );
        }



        vec2 sphereUV(vec2 uv, float radius, float rotation) {
            // Center the coordinates
            vec2 p = uv - 0.5;
            
            // Calculate distance from center
            float dist = length(p);
            
            // Only warp inside the sphere
            if (dist < radius) {
                float z = sqrt(radius * radius - dist * dist);
                vec3 spherePos = rotateZ(rotation) * vec3(p.x, p.y, z);
                
                // Normalize to get the normal
                vec3 normal = normalize(spherePos);
                
                // Convert to spherical coordinates for UV mapping
                vec2 sphereUV;
                sphereUV.x = atan(normal.x, normal.z) / (2.0 * PI) + 0.5;
                sphereUV.y = asin(normal.y) / PI + 0.5;
                
                return sphereUV;
            }
            
            // Outside the sphere - return original UV (will be discarded by alpha)
            return uv;
        }

        void main(){
          float fade = fwidth(dot(v_uv, v_uv));
          // Calculate distance from center for sphere masking
          vec2 centered = v_uv - 0.5;
          float sphereDist = length(centered);
          float sphereRadius = 0.25;

          // Apply spherical mapping
          vec2 uv = sphereUV(v_uv, sphereRadius, rotation);

          // Apply roll after sphere mapping
          uv.x -= roll.x;
          uv.y -= roll.y;

          uv = mod(uv, 1.);

          // Un warp the uv
          vec2 scaledUv = uv;
          scaledUv.x *= 2.;
          scaledUv.x -= .5;
          float dist = 1.0 - length(scaledUv - .5);

          float adist = 1.0 - sphereDist * 2.0; // Use sphere distance for outer edge

          fragColor = color;

          // "Stripe" pattern for number 9 to 15
          float stripeStart = 0.15;
          float stripeEnd = 0.85;

          if (number > 8.) {
            fragColor.rgb = mix(vec3(1.), fragColor.rgb, smoothstep(stripeStart - fade / 2., stripeStart + fade / 2., uv.y));
            fragColor.rgb = mix(fragColor.rgb, vec3(1.), smoothstep(stripeEnd   - fade / 2., stripeEnd   + fade / 2., uv.y));
          }

          // Circle for Text
          float circleEnd = .76;
          fragColor.rgb = mix(fragColor.rgb, vec3(1.), smoothstep(circleEnd - fade / 2., circleEnd + fade / 2., dist));

          // Text
          vec4 textcolor = texture(text, scaledUv);
          fragColor.rgb = mix(fragColor.rgb, textcolor.rgb, textcolor.a);

          // Outer edge - use sphere boundary
          fragColor.a = smoothstep(sphereRadius, sphereRadius - fade /2., sphereDist);

          // lighting
          if (sphereDist < sphereRadius) {
              float z = sqrt(sphereRadius * sphereRadius - sphereDist * sphereDist);
              vec3 normal = normalize(vec3(centered.x, centered.y, z));
              vec3 lightDir = normalize(vec3(0.5, 0.5, 1.0));
              float lighting = max(dot(normal, lightDir), 0.5); // 0.3 = ambient light
              fragColor.rgb *= lighting;
          }

          // premult alpha
          fragColor.rgb *= fragColor.a;
        }
      `,
      uniforms: {
        color: this.graphics.color!,
        number: this.number,
        roll: vec(0, 0),
        rotation: this.rotation
      }
    });

    this.textImage.ready.then(() => {
      this.billardsMat.update(shader => {
        shader.addImageSource('text', this.textImage);
      });
    });
  }

  _rolling: Vector = vec(0, 0);
  onPreUpdate(engine: Engine, elapsed: number): void {
    this._rolling = this.pos.sub(this.originalPos).scale(1 / (2 * Config.BallRadius * Math.PI));
    this.billardsMat.uniforms.rotation = this.rotation;
    this.billardsMat.uniforms.roll = this._rolling;

    // friction
    if (this.vel.squareDistance() > .01) {
      this.vel = this.vel.add(this.vel.negate().scale(.01));
    }
    if (Math.abs(this.angularVelocity) > .01) {
      this.angularVelocity = this.angularVelocity - this.angularVelocity * .01;
    }
  }
}
