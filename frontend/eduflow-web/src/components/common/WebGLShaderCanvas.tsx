import React, { useEffect, useRef } from 'react';
import { useTheme } from '../../context/ThemeContext';

// Vertex shader: Full-screen quad
const VS_SOURCE = `
  attribute vec2 a_position;
  void main() {
    gl_Position = vec4(a_position, 0.0, 1.0);
  }
`;

// Fragment shader: Mesmerizing Silky Aurora & Harmonic Fluid Mesh
const FS_SOURCE = `
  precision highp float;
  
  uniform vec2 u_resolution;
  uniform float u_time;
  uniform vec2 u_mouse;
  uniform float u_theme; // 0.0 = Morning (Light), 1.0 = Night (Dark)

  // Fast procedural noise & fluid harmonic rotation
  mat2 rot(float a) {
    float c = cos(a), s = sin(a);
    return mat2(c, -s, s, c);
  }

  void main() {
    vec2 st = gl_FragCoord.xy / u_resolution.xy;
    vec2 uv = (gl_FragCoord.xy * 2.0 - u_resolution.xy) / min(u_resolution.x, u_resolution.y);
    vec2 mouse = (u_mouse * 2.0 - u_resolution.xy) / min(u_resolution.x, u_resolution.y);
    
    // Interactive mouse cursor spotlight & soft fluid displacement
    float mouseDist = length(uv - mouse);
    float mouseSpotlight = exp(-mouseDist * 2.2);
    vec2 mouseDeflect = normalize(uv - mouse + 0.001) * mouseSpotlight * 0.22;
    vec2 p = uv - mouseDeflect;
    
    // Multi-octave silky harmonic waves
    float t = u_time * 0.35;
    vec2 p1 = p * rot(t * 0.15);
    vec2 p2 = p * rot(-t * 0.22);
    
    float wave1 = sin(p1.x * 1.5 + p1.y * 1.2 + t * 1.1);
    float wave2 = sin(p2.x * -1.8 + p2.y * 1.4 + t * 0.95 + wave1 * 0.55);
    float wave3 = cos(p1.x * 1.2 - p2.y * 2.1 + t * 1.25 + wave2 * 0.45);
    float wave4 = sin(length(p * 1.1) * 2.4 - t * 0.85 + wave3 * 0.5);
    
    // Composite silky field (smoothly contoured)
    float field = (wave1 + wave2 + wave3 + wave4) * 0.25 + 0.5;
    field = smoothstep(0.08, 0.92, field);

    // Luminous ripple ridges (silk sheen ribbons)
    float ripple = sin(field * 14.0 + t * 1.2) * 0.5 + 0.5;
    ripple = pow(ripple, 4.0);

    // ========================================================
    // NIGHT PALETTE: Obsidian Midnight, Cyber Sapphire & Radiant Aurora Cyan
    // ========================================================
    vec3 nightBg        = vec3(0.032, 0.048, 0.095); // Deep midnight obsidian
    vec3 nightSapphire  = vec3(0.060, 0.250, 0.720); // Royal sapphire blue (#0f40b8)
    vec3 nightIndigo    = vec3(0.320, 0.140, 0.780); // Electric twilight violet (#5224c7)
    vec3 nightCyan      = vec3(0.050, 0.650, 0.920); // Radiant neon cyan (#0da6eb)
    vec3 nightSilkCrest = vec3(0.550, 0.680, 1.000); // Luminous starlight sheen

    vec3 nightColor = mix(nightBg, nightSapphire, smoothstep(0.12, 0.62, field));
    nightColor = mix(nightColor, nightIndigo, smoothstep(0.30, 0.82, wave2 * 0.5 + 0.5));
    nightColor = mix(nightColor, nightCyan, pow(field, 2.8) * 0.55);
    nightColor += nightSilkCrest * (ripple * 0.25 + pow(field, 3.8) * 0.35);
    nightColor += vec3(0.12, 0.45, 0.95) * (mouseSpotlight * 0.45);

    // ========================================================
    // MORNING PALETTE: Alabaster Pearl, Celestial Azure & Radiant Amber Sun
    // ========================================================
    vec3 mornBg        = vec3(0.960, 0.972, 0.995); // Pure pristine alabaster
    vec3 mornSky       = vec3(0.780, 0.880, 0.990); // Gentle sky azure
    vec3 mornAmber     = vec3(0.995, 0.880, 0.760); // Warm solar amber dawn
    vec3 mornLavender  = vec3(0.910, 0.850, 0.970); // Soft dawn lilac
    vec3 mornSilkCrest = vec3(1.000, 1.000, 1.000); // White silk sheen

    vec3 mornColor = mix(mornBg, mornSky, smoothstep(0.15, 0.65, field));
    mornColor = mix(mornColor, mornAmber, smoothstep(0.28, 0.78, wave3 * 0.5 + 0.5));
    mornColor = mix(mornColor, mornLavender, pow(field, 2.5) * 0.45);
    mornColor += mornSilkCrest * (ripple * 0.18 + pow(field, 3.2) * 0.22);
    mornColor += vec3(0.35, 0.55, 0.95) * (mouseSpotlight * 0.25);

    // Smooth theme interpolation
    vec3 finalColor = mix(mornColor, nightColor, u_theme);

    // Soft peripheral vignette for focal depth
    float vignette = 1.0 - dot(st - 0.5, st - 0.5) * 0.32;
    finalColor *= vignette;

    gl_FragColor = vec4(finalColor, 1.0);
  }
`;

function createShader(gl: WebGLRenderingContext, type: number, source: string): WebGLShader | null {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.warn('Shader compile failed:', gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

function createProgram(
  gl: WebGLRenderingContext,
  vsSource: string,
  fsSource: string
): WebGLProgram | null {
  const vs = createShader(gl, gl.VERTEX_SHADER, vsSource);
  const fs = createShader(gl, gl.FRAGMENT_SHADER, fsSource);
  if (!vs || !fs) return null;

  const program = gl.createProgram();
  if (!program) return null;
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.warn('Program link failed:', gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
    return null;
  }
  return program;
}

export const WebGLShaderCanvas: React.FC<{ className?: string }> = ({ className = '' }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  
  // Safe theme detection even if rendered outside ThemeProvider
  let isNight = true;
  try {
    const themeCtx = useTheme();
    isNight = themeCtx.isNight;
  } catch {
    isNight = typeof window !== 'undefined' && window.matchMedia
      ? !window.matchMedia('(prefers-color-scheme: light)').matches
      : true;
  }

  const stateRef = useRef({
    isNight,
    currentTheme: isNight ? 1.0 : 0.0,
    mouse: [0, 0],
    targetMouse: [0, 0],
    startTime: performance.now(),
    rafId: 0,
    isVisible: true,
  });

  useEffect(() => {
    stateRef.current.isNight = isNight;
  }, [isNight]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl', {
      alpha: false,
      antialias: false,
      depth: false,
      stencil: false,
      preserveDrawingBuffer: false,
      powerPreference: 'low-power',
    });

    if (!gl) {
      return;
    }

    const program = createProgram(gl, VS_SOURCE, FS_SOURCE);
    if (!program) return;

    gl.useProgram(program);

    // Full screen quad buffer
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    const positions = new Float32Array([
      -1, -1,
       1, -1,
      -1,  1,
      -1,  1,
       1, -1,
       1,  1,
    ]);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

    const aPositionLoc = gl.getAttribLocation(program, 'a_position');
    gl.enableVertexAttribArray(aPositionLoc);
    gl.vertexAttribPointer(aPositionLoc, 2, gl.FLOAT, false, 0, 0);

    const uResolutionLoc = gl.getUniformLocation(program, 'u_resolution');
    const uTimeLoc = gl.getUniformLocation(program, 'u_time');
    const uMouseLoc = gl.getUniformLocation(program, 'u_mouse');
    const uThemeLoc = gl.getUniformLocation(program, 'u_theme');

    const resize = () => {
      if (!canvas) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 1.25);
      const width = Math.floor(window.innerWidth * dpr);
      const height = Math.floor(window.innerHeight * dpr);

      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
        gl.viewport(0, 0, width, height);
      }
    };

    resize();
    window.addEventListener('resize', resize, { passive: true });

    // Interactive mouse positioning
    const onMouseMove = (e: MouseEvent) => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.25);
      stateRef.current.targetMouse = [
        e.clientX * dpr,
        (window.innerHeight - e.clientY) * dpr,
      ];
    };

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        const dpr = Math.min(window.devicePixelRatio || 1, 1.25);
        stateRef.current.targetMouse = [
          e.touches[0].clientX * dpr,
          (window.innerHeight - e.touches[0].clientY) * dpr,
        ];
      }
    };

    window.addEventListener('mousemove', onMouseMove, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });

    const handleVisibilityChange = () => {
      stateRef.current.isVisible = document.visibilityState === 'visible';
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Initial center position
    stateRef.current.mouse = [canvas.width / 2, canvas.height / 2];
    stateRef.current.targetMouse = [canvas.width / 2, canvas.height / 2];

    let running = true;
    const render = () => {
      if (!running) return;

      if (stateRef.current.isVisible) {
        const now = performance.now();
        const elapsed = (now - stateRef.current.startTime) / 1000;

        // Smooth spring easing for cursor fluid tracking
        stateRef.current.mouse[0] += (stateRef.current.targetMouse[0] - stateRef.current.mouse[0]) * 0.05;
        stateRef.current.mouse[1] += (stateRef.current.targetMouse[1] - stateRef.current.mouse[1]) * 0.05;

        // Smooth crossfade between light and dark theme
        const targetTheme = stateRef.current.isNight ? 1.0 : 0.0;
        stateRef.current.currentTheme += (targetTheme - stateRef.current.currentTheme) * 0.04;

        gl.useProgram(program);
        gl.uniform2f(uResolutionLoc, canvas.width, canvas.height);
        gl.uniform1f(uTimeLoc, elapsed);
        gl.uniform2f(uMouseLoc, stateRef.current.mouse[0], stateRef.current.mouse[1]);
        gl.uniform1f(uThemeLoc, stateRef.current.currentTheme);

        gl.drawArrays(gl.TRIANGLES, 0, 6);
      }

      stateRef.current.rafId = requestAnimationFrame(render);
    };

    stateRef.current.rafId = requestAnimationFrame(render);

    return () => {
      running = false;
      cancelAnimationFrame(stateRef.current.rafId);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('touchmove', onTouchMove);
      document.removeEventListener('visibilitychange', handleVisibilityChange);

      if (positionBuffer) gl.deleteBuffer(positionBuffer);
      if (program) gl.deleteProgram(program);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={`fixed inset-0 pointer-events-none z-0 w-full h-full select-none ${className}`}
      style={{
        width: '100vw',
        height: '100vh',
      }}
    />
  );
};
