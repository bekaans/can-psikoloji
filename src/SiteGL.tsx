import { useEffect, useRef } from 'react';

const VERT = 'attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}';
const FRAG = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
uniform vec2 uRes;
uniform float uTime;
uniform vec2 uMouse;
uniform float uScroll;
float hash(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}
float noise(vec2 p){
  vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
  return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);
}
float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<4;i++){v+=a*noise(p);p=p*2.02+vec2(1.7,9.2);a*=.5;}return v;}
void main(){
  vec2 uv=gl_FragCoord.xy/uRes;
  float asp=uRes.x/uRes.y;
  float a=uScroll*.35;
  vec2 p=(mat2(cos(a),-sin(a),sin(a),cos(a))*(uv-.5))*vec2(asp,1.)*1.6+vec2(uScroll*.6,-uScroll*.4);
  float t=uTime*.07;
  vec2 m=(uMouse-uv)*vec2(asp,1.);
  p+=m*exp(-dot(m,m)*7.)*.4;
  vec2 q=vec2(fbm(p+t),fbm(p+vec2(5.2,1.3)-t));
  vec2 r=vec2(fbm(p+3.*q+vec2(1.7,9.2)+t*1.3),fbm(p+3.*q+vec2(8.3,2.8)-t));
  float f=fbm(p+3.*r+vec2(uScroll*.5,uScroll*.9));
  vec3 cream=vec3(.985,.995,.995);
  vec3 sage=vec3(.76,.93,.92);
  vec3 olive=vec3(.36,.78,.76);
  vec3 deep=vec3(.08,.50,.52);
  vec3 c=mix(cream,sage,smoothstep(.3,.62,f));
  c=mix(c,olive,smoothstep(.35,.85,length(q))*.75);
  c=mix(c,deep,smoothstep(.4,.9,r.x*f)*.35);
  c+=.05*smoothstep(.5,.6,f)*vec3(1.,.98,.9);
  c=mix(cream,c,.72+.28*smoothstep(0.,.5,uv.x));
  gl_FragColor=vec4(c,1.);
}`;

export function SiteGL({ still }: { still: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const gl = canvas.getContext('webgl', {
      antialias: false,
      alpha: false,
      powerPreference: 'low-power',
    });
    if (!gl) return;
    const shader = (type: number, src: string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      return s;
    };
    const prog = gl.createProgram()!;
    gl.attachShader(prog, shader(gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, shader(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
    gl.useProgram(prog);
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, 'p');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    const uRes = gl.getUniformLocation(prog, 'uRes');
    const uTime = gl.getUniformLocation(prog, 'uTime');
    const uMouse = gl.getUniformLocation(prog, 'uMouse');
    const uScroll = gl.getUniformLocation(prog, 'uScroll');

    const coarse = matchMedia('(pointer: coarse)').matches;
    const scale = coarse ? 0.4 : 0.55; // yumuşak degrade: düşük çözünürlük fark edilmez
    let flow = 0;
    let lastY = scrollY;
    const mouse = { x: 0.7, y: 0.5, tx: 0.7, ty: 0.5 };
    let visible = true;
    let raf = 0;
    let running = false;
    const start = performance.now();

    const resize = () => {
      const dpr = Math.min(devicePixelRatio || 1, 2);
      canvas.width = Math.max(2, Math.round(canvas.clientWidth * dpr * scale));
      canvas.height = Math.max(2, Math.round(canvas.clientHeight * dpr * scale));
      gl.viewport(0, 0, canvas.width, canvas.height);
    };
    const draw = () => {
      mouse.x += (mouse.tx - mouse.x) * 0.06;
      mouse.y += (mouse.ty - mouse.y) * 0.06;
      gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.uniform1f(uTime, (performance.now() - start) / 1000);
      gl.uniform2f(uMouse, mouse.x, mouse.y);
      const dy = scrollY - lastY;
      lastY = scrollY;
      flow += (dy / Math.max(1, innerHeight)) * 1.8;
      gl.uniform1f(uScroll, flow + (scrollY / Math.max(1, innerHeight)) * 0.6);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };
    const loop = () => {
      if (!visible || document.hidden) {
        running = false;
        return;
      }
      draw();
      raf = requestAnimationFrame(loop);
    };
    const kick = () => {
      if (still || running) return;
      running = true;
      raf = requestAnimationFrame(loop);
    };
    const onMove = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      mouse.tx = (e.clientX - r.left) / r.width;
      mouse.ty = 1 - (e.clientY - r.top) / r.height;
    };
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) kick();
    });
    io.observe(canvas);
    const ro = new ResizeObserver(() => {
      resize();
      if (still) draw();
    });
    ro.observe(canvas);
    resize();
    draw();
    canvas.classList.add('ready');
    document.addEventListener('visibilitychange', kick);
    if (!still) window.addEventListener('pointermove', onMove, { passive: true });
    kick();
    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
      document.removeEventListener('visibilitychange', kick);
      window.removeEventListener('pointermove', onMove);
    };
  }, [still]);
  return <canvas ref={ref} className="hero-gl" aria-hidden="true" />;
}
