/* ============================================================
   SoulScript — water hero
   Cursor-reactive WebGL water surface + the opening word sequence.

   Ported from the React/framer-motion pair Manan supplied, to vanilla so it
   drops into a no-build static site:
     - WaterRippleImage  -> the GLSL below, React wrapper removed
     - TextEffect        -> revealWords(), the 'blur' preset, word stagger

   What was ADDED to his shader: u_mouse + u_mouse_strength, and a radial
   ripple term driven by the pointer. His version animated on time only, so
   the surface moved but did not answer the cursor.

   MOTION CONTRACT: the sequence runs once per session. Everything here is
   disabled under prefers-reduced-motion and on no-WebGL, both of which fall
   back to the still image with no loss of content.
   ============================================================ */
(function () {
  "use strict";

  var host = document.getElementById("waterHero");
  if (!host) return;

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var stillSrc = host.getAttribute("data-still");

  /* ---------- 1. The opening sequence ------------------------------------
     Manan's rule: the tagline appears FIRST, at its final size and final
     position, and never moves. So the hero's layout is complete on frame 1;
     only opacity changes. The h1 occupies its space from the start at
     opacity 0, which is what stops the tagline shifting when it arrives. */

  var seq = document.getElementById("heroSeq");

  /* ONE flag for the whole visit, not one per language.

     History, because this is a reversal and the reason matters:
     21 Aug, a single shared key meant landing on the French home set the flag, then
     clicking EN made the English home skip its opening entirely and look broken.
     So it was split per language. Correct fix for that bug.

     31 Aug, Marine and Manan hit the opposite problem on the call. Manan, 14:35:
     "there is another animation... I have removed it but it keeps coming back for
     some reason. So I will remove that animation." Switching language replayed the
     whole 4 second opening, which reads as a glitch rather than a welcome.

     What changed in between: the language switcher now keeps you on the same page
     (28 Aug), so the ONLY way to meet the second home page is to deliberately click
     the language toggle on the home page. In that situation the visitor has already
     seen the intro seconds ago. One shared key is now the right behaviour, and the
     original bug cannot come back because the English home no longer looks broken,
     it simply opens in its finished state like any other repeat view. */
  var already = sessionStorage.getItem("ss_seen_hero") === "1";

  function revealWords(el, delay, stagger) {
    var words = el.querySelectorAll("[data-w]");
    for (var i = 0; i < words.length; i++) {
      words[i].style.transitionDelay = (delay + i * stagger) + "ms";
      words[i].classList.add("is-in");
    }
  }

  function runSequence() {
    document.documentElement.classList.add("seq-running");

    /* Manan, 7 Aug: "wait for all three words to show up, and THEN the rest of
       the screen opens". So the beats are driven by the last word finishing,
       not by guessed timers that overlap it.
       5 items (3 words + 2 separators) x 300ms stagger + 760ms transition,
       + 220ms lead-in = the moment "Rise" is fully sharp. */
    var items = seq.querySelectorAll("[data-w]");
    var LEAD = 220, STAGGER = 300, DUR = 760;
    var lastWordDone = LEAD + (items.length - 1) * STAGGER + DUR;   // ~2.4s

    revealWords(seq, LEAD, STAGGER);

    // the three words hold alone for a beat once the last one lands
    setTimeout(function () { host.classList.add("is-lit"); }, lastWordDone + 420);
    // only then does the rest of the screen arrive
    setTimeout(function () { document.documentElement.classList.add("seq-open"); }, lastWordDone + 1150);
    setTimeout(function () {
      document.documentElement.classList.remove("seq-running");
      document.documentElement.classList.add("seq-done");
      sessionStorage.setItem("ss_seen_hero", "1");
    }, lastWordDone + 1900);
  }

  if (reduced || already) {
    document.documentElement.classList.add("seq-open", "seq-done");
    host.classList.add("is-lit");
    var ws = seq ? seq.querySelectorAll("[data-w]") : [];
    for (var j = 0; j < ws.length; j++) { ws[j].style.transitionDelay = "0ms"; ws[j].classList.add("is-in"); }
  } else {
    runSequence();
  }

  if (reduced) return;   // still image only, no GL

  /* ---------- 2. The shader ---------------------------------------------- */

  var VERT =
    "precision mediump float;varying vec2 vUv;attribute vec2 a_position;" +
    "void main(){vUv=.5*(a_position+1.);gl_Position=vec4(a_position,0.,1.);}";

  var FRAG = [
    "precision mediump float;",
    "varying vec2 vUv;",
    "uniform sampler2D u_image_texture;",
    "uniform float u_time,u_ratio,u_img_ratio,u_blueish,u_scale,u_illumination;",
    "uniform float u_surface_distortion,u_water_distortion,u_mouse_strength;",
    "uniform vec2 u_mouse;",
    "uniform vec3 u_drops[5];",      // xy = position, z = age in seconds

    "vec3 mod289(vec3 x){return x-floor(x*(1./289.))*289.;}",
    "vec2 mod289(vec2 x){return x-floor(x*(1./289.))*289.;}",
    "vec3 permute(vec3 x){return mod289(((x*34.)+1.)*x);}",
    "float snoise(vec2 v){",
    " const vec4 C=vec4(0.211324865405187,0.366025403784439,-0.577350269189626,0.024390243902439);",
    " vec2 i=floor(v+dot(v,C.yy));vec2 x0=v-i+dot(i,C.xx);vec2 i1;",
    " i1=(x0.x>x0.y)?vec2(1.,0.):vec2(0.,1.);",
    " vec4 x12=x0.xyxy+C.xxzz;x12.xy-=i1;i=mod289(i);",
    " vec3 p=permute(permute(i.y+vec3(0.,i1.y,1.))+i.x+vec3(0.,i1.x,1.));",
    " vec3 m=max(0.5-vec3(dot(x0,x0),dot(x12.xy,x12.xy),dot(x12.zw,x12.zw)),0.);",
    " m=m*m;m=m*m;vec3 x=2.*fract(p*C.www)-1.;vec3 h=abs(x)-0.5;",
    " vec3 ox=floor(x+0.5);vec3 a0=x-ox;",
    " m*=1.79284291400159-0.85373472095314*(a0*a0+h*h);",
    " vec3 g;g.x=a0.x*x0.x+h.x*x0.y;g.yz=a0.yz*x12.xz+h.yz*x12.yw;",
    " return 130.*dot(m,g);}",
    "mat2 rot(float r){return mat2(cos(r),sin(r),-sin(r),cos(r));}",
    "float surf_noise(vec2 uv,float t,float scale){",
    " vec2 n=vec2(.1),N=vec2(.1);mat2 m=rot(.5);",
    " for(int j=0;j<8;j++){uv*=m;n*=m;",
    "  vec2 q=uv*scale+float(j)+n+(.5+.5*float(j))*(mod(float(j),2.)-1.)*t;",
    "  n+=sin(q);N+=cos(q)/scale;scale*=1.2;}",
    " return (N.x+N.y+.1);}",
    "void main(){",
    " vec2 uv=vUv;uv.y=1.-uv.y;uv.x*=u_ratio;",
    " float t=.002*u_time;",
    // --- ADDED: pointer-driven ripple, absent from the source shader
    // Each drop is an expanding ring that travels outward and dies, the way a
    // real disturbance behaves. The ambient noise is now almost nothing, so the
    // surface is calm until it is touched.
    " float ring=0.0;",
    " for(int i=0;i<5;i++){",
    "   vec3 dp=u_drops[i];",
    "   if(dp.z<0.0) continue;",
    "   vec2 dc=vec2(dp.x*u_ratio,dp.y);",
    "   float dd=distance(uv,dc);",
    "   float age=dp.z;",
    // Calmed 7 Aug: the ring spreads more slowly, dies sooner and carries a
    // longer wavelength, so a touch reads as one soft swell rather than chatter.
    "   float radius=age*0.30;",           // ring travels outward
    "   float life=exp(-age*2.20);",       // and fades as it goes
    "   float band=exp(-pow((dd-radius)*7.0,2.0));",
    "   ring+=sin((dd-radius)*30.0)*band*life;",
    " }",
    " vec2 m=u_mouse;m.x*=u_ratio;",
    " float pull=exp(-distance(uv,m)*5.0)*u_mouse_strength*0.35;",
    " float outer=snoise((.3+.1*sin(t))*uv+vec2(0.,.2*t));",
    " vec2 sn_uv=2.*uv+(outer*.2)+ring*.028;",
    " float surf=surf_noise(sn_uv,t,u_scale);",
    " surf*=pow(uv.y,.45);surf=pow(abs(surf),1.35)*sign(surf);",
    " surf+=pull*.32+ring*.15;",
    " vec2 iuv=vUv-.5;",
    // TRUE COVER. The source shader had this inverted: on a viewport narrower than
    // the image it multiplied y by img/ratio (3.9x on a phone), sampling a thin
    // horizontal band across the full height. That produced the vertical streaking,
    // not the distortion. Cover crops, never stretches.
    " if(u_ratio>u_img_ratio){iuv.y=iuv.y*u_img_ratio/u_ratio;}else{iuv.x=iuv.x*u_ratio/u_img_ratio;}",
    " iuv*=1.06;iuv+=.5;iuv.y=1.-iuv.y;",
    " iuv+=(u_water_distortion*outer);",
    " iuv+=(u_surface_distortion*surf);",
    " iuv+=ring*.020;",
    " vec4 img=texture2D(u_image_texture,clamp(iuv,0.001,0.999));",
    " img*=(1.+u_illumination*surf);",
    " vec3 color=img.rgb;",
    " color+=u_illumination*vec3(1.-u_blueish,1.,1.)*surf;",
    " gl_FragColor=vec4(color,1.);}"
  ].join("\n");

  var canvas = document.createElement("canvas");
  canvas.className = "water-canvas";
  canvas.setAttribute("aria-hidden", "true");
  host.appendChild(canvas);

  var gl = canvas.getContext("webgl", { alpha: false, antialias: false, powerPreference: "low-power" })
        || canvas.getContext("experimental-webgl");
  if (!gl) return;   // still image stays visible

  function sh(src, type) {
    var s = gl.createShader(type);
    gl.shaderSource(s, src); gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) { gl.deleteShader(s); return null; }
    return s;
  }
  var v = sh(VERT, gl.VERTEX_SHADER), f = sh(FRAG, gl.FRAGMENT_SHADER);
  if (!v || !f) return;
  var prog = gl.createProgram();
  gl.attachShader(prog, v); gl.attachShader(prog, f); gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
  gl.useProgram(prog);

  var U = {};
  var n = gl.getProgramParameter(prog, gl.ACTIVE_UNIFORMS);
  /* getActiveUniform reports an array uniform as "u_drops[0]", so keying on the
     raw name left U.u_drops undefined, the drops were never uploaded, and the
     uniform stayed at its all-zero default: five drops sitting at age 0 on the
     top-left corner. That is the static ring in the corner, and it is also why
     the cursor never disturbed the water. Strip the index. */
  for (var k = 0; k < n; k++) {
    var info = gl.getActiveUniform(prog, k);
    var loc = gl.getUniformLocation(prog, info.name);
    U[info.name] = loc;
    U[info.name.replace(/\[0\]$/, "")] = loc;
  }

  var buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW);
  var loc = gl.getAttribLocation(prog, "a_position");
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

  // calm, warm, brand-appropriate. Not the demo's blue.
  /* Tuned down hard from the demo defaults. At the source values the surf term
     dominates and smears the photograph into vertical streaks: it stops reading
     as water and starts reading as a melting texture. These keep the image
     legible and let the motion sit underneath it. */
  gl.uniform1f(U.u_blueish, 0.10);
  gl.uniform1f(U.u_scale, 2.6);
  gl.uniform1f(U.u_illumination, 0.06);
  gl.uniform1f(U.u_surface_distortion, 0.005);
  gl.uniform1f(U.u_water_distortion, 0.0035);
  gl.uniform1f(U.u_mouse_strength, 0.0);
  gl.uniform2f(U.u_mouse, 0.5, 0.5);

  var imgRatio = 16 / 9;
  var img = new Image();
  img.crossOrigin = "anonymous";
  img.onload = function () {
    var tex = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 0);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
    gl.uniform1i(U.u_image_texture, 0);
    imgRatio = img.naturalWidth / img.naturalHeight;
    resize();
    host.classList.add("gl-ready");
    start();
  };
  img.src = stillSrc;

  var dpr = Math.min(window.devicePixelRatio || 1, 1.75);
  function resize() {
    var r = host.getBoundingClientRect();
    var w = Math.max(1, Math.floor(r.width * dpr));
    var h = Math.max(1, Math.floor(r.height * dpr));
    if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
    gl.viewport(0, 0, w, h);
    gl.uniform1f(U.u_ratio, w / h);
    gl.uniform1f(U.u_img_ratio, imgRatio);
  }
  window.addEventListener("resize", resize);

  /* pointer: normalised, y flipped to match the shader, eased so the surface
     trails the cursor rather than snapping to it. Strength decays so the water
     settles when the pointer stops. */
  var mx = 0.5, my = 0.5, tx = 0.5, ty = 0.5, strength = 0, target = 0;

  /* Drops: five slots, oldest recycled. A drop is spawned when the pointer has
     travelled far enough, and on scroll, so the surface answers both. */
  /* SLOTS is the shader's array length and cannot change. LIVE is how many
     rings are allowed at once: five overlapping rings read as churn, two read
     as water. */
  var drops = [], SLOTS = 5, LIVE = 2, lastDropX = -9, lastDropY = -9;
  function addDrop(x, y) {
    drops.push({ x: x, y: y, t: performance.now() });
    if (drops.length > LIVE) drops.shift();
  }
  function pushDrops(now) {
    var arr = new Float32Array(SLOTS * 3);
    for (var i = 0; i < SLOTS; i++) {
      var d = drops[i];
      if (!d) { arr[i*3] = 0; arr[i*3+1] = 0; arr[i*3+2] = -1; continue; }
      var age = (now - d.t) / 1000;
      arr[i*3] = d.x; arr[i*3+1] = d.y; arr[i*3+2] = age > 2.2 ? -1 : age;
    }
    if (U.u_drops) gl.uniform3fv(U.u_drops, arr);
  }
  host.addEventListener("pointermove", function (e) {
    var r = host.getBoundingClientRect();
    tx = (e.clientX - r.left) / r.width;
    ty = 1 - (e.clientY - r.top) / r.height;
    target = 1;
    if (Math.abs(tx - lastDropX) + Math.abs(ty - lastDropY) > 0.14) {
      addDrop(tx, ty); lastDropX = tx; lastDropY = ty;
    }
  }, { passive: true });
  host.addEventListener("pointerleave", function () { target = 0; }, { passive: true });

  /* Scroll used to spawn a drop every 90 px. A normal flick is several hundred
     pixels, so four or five rings landed at random points at once and the water
     boiled. Manan, 7 Aug: "when I just touch it, it's okay, but when I scroll,
     too much movement happens together". Scrolling now leaves the surface alone;
     only the pointer disturbs it. */

  var raf = null, running = false, t0 = performance.now();
  function frame(now) {
    mx += (tx - mx) * 0.075; my += (ty - my) * 0.075;
    target *= 0.965;                       // settle when the pointer rests
    strength += (target - strength) * 0.06;
    gl.uniform2f(U.u_mouse, mx, my);
    gl.uniform1f(U.u_mouse_strength, strength);
    pushDrops(now);
    gl.uniform1f(U.u_time, now - t0);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    raf = requestAnimationFrame(frame);
  }
  function start() { if (!running) { running = true; raf = requestAnimationFrame(frame); } }
  function stop() { if (running) { running = false; cancelAnimationFrame(raf); } }

  /* never burn a GPU on a hero nobody is looking at */
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (es) {
      es[0].isIntersecting ? start() : stop();
    }, { threshold: 0.01 }).observe(host);
  }
  document.addEventListener("visibilitychange", function () {
    document.hidden ? stop() : start();
  });
})();
