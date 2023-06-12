#define USE_MAP true;
precision mediump float;

uniform float uTime;
varying vec2 vUv;
uniform sampler2D uMap;
uniform float[256] uThresholdArray;
uniform int uThresholdMatrixWidth;

float random(vec2 uv)
{
  return fract(sin(dot(uv, vec2(12.9898, 78.233))) * 43758.5453);
}

void main()
{
  vec4 color = texture2D(uMap, vUv);
  // float brightness = sqrt(pow(color.r, 2.) + pow(color.g, 2.) + pow(color.b, 2.));

  // https://en.wikipedia.org/wiki/Relative_luminance
  float brightness = (0.2126 * color.r + 0.7152 * color.g + 0.0722 * color.b);
 
  // float thresholdValue = 0.5;
  
  int thresholdArrayIndex = int(mod(gl_FragCoord.x, float(uThresholdMatrixWidth))) * uThresholdMatrixWidth + int(mod(gl_FragCoord.y, float(uThresholdMatrixWidth)));
  float thresholdValue = uThresholdArray[thresholdArrayIndex];

  // color = (brightness + random(vUv) - 0.5) > 0.5 ? vec4(0.8, 0.8, 0.8, 1.) : vec4(0.1, 0.15, 0.1, 1.);
  color = (brightness) > 1. - thresholdValue ? vec4(0.85, 0.9, 0.85, 1.) : vec4(0.1, 0.15, 0.1, 1.);

  gl_FragColor = color;
  // gl_FragColor = vec4(floor(mod(gl_FragCoord.x / 16., 8.)) / 8., 0., 0., 1.);
  // gl_FragColor = vec4(1., 0., 0., 1.);
}
