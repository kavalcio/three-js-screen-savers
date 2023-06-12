#define USE_MAP true;
precision mediump float;

uniform float uTime;
varying vec2 vUv;
// uniform sampler2D texture1;
uniform sampler2D uMap;
uniform mat4 uThresholdMap;

float random(vec2 uv)
{
  return fract(sin(dot(uv, vec2(12.9898, 78.233))) * 43758.5453);
}


mat4 M = mat4(
  vec4(0.0 / 16.0, 8.0 / 16.0, 2.0 / 16.0, 10.0 / 16.0),
  vec4(12.0 / 16.0, 4.0 / 16.0, 14.0 / 16.0, 6.0 / 16.0),
  vec4(3.0 / 16.0, 11.0 / 16.0, 1.0 / 16.0, 9.0 / 16.0),
  vec4(15.0 / 16.0, 7.0 / 16.0, 13.0 / 16.0, 5.0 / 16.0)
);


void main()
{
  vec4 color = texture2D(uMap, vUv);
  // float brightness = sqrt(pow(color.r, 2.) + pow(color.g, 2.) + pow(color.b, 2.));
  float brightness = (0.2126 * color.r + 0.7152 * color.g + 0.0722 * color.b);
 
  // float thresholdValue = 0.5;
  // float thresholdValue = uThresholdMap[int(mod(gl_FragCoord.x, 4.))][int(mod(gl_FragCoord.y, 4.))];
  float thresholdValue = M[int(mod(gl_FragCoord.x, 4.))][int(mod(gl_FragCoord.y, 4.))];

  // color = (brightness + random(vUv) - 0.5) > 0.5 ? vec4(0.8, 0.8, 0.8, 1.) : vec4(0.1, 0.15, 0.1, 1.);
  color = (brightness) > thresholdValue ? vec4(0.85, 0.9, 0.85, 1.) : vec4(0.1, 0.15, 0.1, 1.);

  gl_FragColor = color;
  // gl_FragColor = vec4(floor(mod(gl_FragCoord.x / 16., 8.)) / 8., 0., 0., 1.);
  // gl_FragColor = vec4(1., 0., 0., 1.);
}
