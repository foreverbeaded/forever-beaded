const state = {
  opening: null,
  introStartedAt: 0,
  bookOpeningAt: 0,
  completed: false,
  exclusiveStarted: false,
  exclusiveObserverStarted: false,
  butterflyScene: null,
  audio: null
};

const butterflyPlans = [
  {
    delay: 650,
    role: "close",
    speed: .98,
    scale: 0.62,
    flap: 7.2,
    start: [-9.2, 0.55, -0.8],
    orbit: [[-4.6, 1.9, 1.45], [-.35, 2.65, 3.55], [1.15, .85, .42]],
    land: [-2.1, -.86, 0.24],
    exit: [2.8, 2.55, 1.35]
  },
  {
    delay: 1700,
    role: "title",
    speed: 1.06,
    scale: 0.48,
    flap: 8.4,
    start: [8.4, 1.7, -0.55],
    orbit: [[4.2, 2.15, 1.45], [1.2, .65, 2.25], [2.05, .26, .48]],
    land: [.24, .23, .2],
    exit: [-.8, 2.65, 1.42]
  },
  {
    delay: 2750,
    role: "flower",
    speed: 1.18,
    scale: 0.46,
    flap: 6.7,
    start: [1.1, 4.8, -0.2],
    orbit: [[-.45, 2.6, 1.55], [2.9, 1.45, .85], [1.4, -.42, .36]],
    land: [1.78, -1.18, .18],
    exit: [5.8, 1.8, 1.05]
  },
  {
    delay: 3650,
    role: "spine",
    speed: 1.08,
    scale: 0.44,
    flap: 7.9,
    start: [-5.8, -2.4, .35],
    orbit: [[-2.5, -.55, 1.95], [-1.1, .9, 1.25], [-2.72, .22, .42]],
    land: [-3.24, -.2, .2],
    exit: [-5.7, 2.05, 1.26]
  },
  {
    delay: 4550,
    role: "circle",
    speed: 1.24,
    scale: 0.43,
    flap: 8.9,
    start: [7.6, -1.9, .15],
    orbit: [[3.4, -.35, 1.85], [.55, 1.75, 1.25], [-1.9, .62, .62]],
    land: [-.88, -.7, .24],
    exit: [4.6, 2.8, 1.45]
  },
  {
    delay: 5400,
    role: "circle",
    speed: .96,
    scale: 0.42,
    flap: 6.2,
    start: [-7.4, 3.2, -.2],
    orbit: [[-3.4, 1.55, 1.55], [.2, 2.25, 2.05], [2.3, .62, .7]],
    land: [2.56, -.22, .2],
    exit: [1.2, 3.35, 1.7]
  },
  {
    delay: 6250,
    role: "page",
    speed: 1.34,
    scale: 0.44,
    flap: 9.6,
    start: [0.8, -4.8, .25],
    orbit: [[-2.1, -.72, 1.95], [-.15, .95, 1.25], [-1.38, .92, .5]],
    land: [-1.58, .82, .22],
    exit: [-5.4, 2.1, 1.38]
  },
  {
    delay: 7200,
    role: "wander",
    speed: 1.1,
    scale: 0.38,
    flap: 8.1,
    start: [9.4, 3.2, .15],
    orbit: [[4.4, 1.2, 2.2], [.2, 2.8, 1.4], [-2.2, .45, 1.05]],
    land: [-.42, -.28, .22],
    exit: [3.4, 3.7, 1.62]
  },
  {
    delay: 8150,
    role: "wander",
    speed: .92,
    scale: 0.36,
    flap: 6.9,
    start: [-9.6, -2.9, .65],
    orbit: [[-5.2, -.55, 2.65], [-1.4, 2.25, 1.85], [2.65, .1, 1.1]],
    land: [2.18, .72, .24],
    exit: [-2.2, 3.8, 1.55]
  },
  {
    delay: 0,
    role: "pageBurst",
    speed: 1,
    scale: 0.54,
    flap: 10.8,
    start: [0, 0, 0],
    orbit: [[-.2, .06, .4], [.18, .44, 1.8], [1.1, .72, 3.6]],
    land: [0, 0, 0],
    exit: [4.8, .52, 4.2]
  }
];

function monarchMarkup(image = "images/monarch-transparent.png") {
  return `
    <span class="monarch-shadow"></span>
    <img class="monarch-whole" src="${image}" alt="" draggable="false" decoding="async">
    <span class="hero-awakening-shimmer"></span>
    <span class="left-wing monarch-textured-wing"></span>
    <span class="right-wing monarch-textured-wing"></span>
  `;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function easeInOut(t) {
  return t * t * (3 - (2 * t));
}

function mix(a, b, t) {
  return a + ((b - a) * t);
}

function mix3(a, b, t) {
  return [mix(a[0], b[0], t), mix(a[1], b[1], t), mix(a[2], b[2], t)];
}

function cubic3(a, b, c, d, t) {
  const mt = 1 - t;
  return [
    (mt * mt * mt * a[0]) + (3 * mt * mt * t * b[0]) + (3 * mt * t * t * c[0]) + (t * t * t * d[0]),
    (mt * mt * mt * a[1]) + (3 * mt * mt * t * b[1]) + (3 * mt * t * t * c[1]) + (t * t * t * d[1]),
    (mt * mt * mt * a[2]) + (3 * mt * mt * t * b[2]) + (3 * mt * t * t * c[2]) + (t * t * t * d[2])
  ];
}

function createShader(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    throw new Error(gl.getShaderInfoLog(shader) || "WebGL shader compile failed.");
  }
  return shader;
}

function createProgram(gl, vertexSource, fragmentSource) {
  const program = gl.createProgram();
  gl.attachShader(program, createShader(gl, gl.VERTEX_SHADER, vertexSource));
  gl.attachShader(program, createShader(gl, gl.FRAGMENT_SHADER, fragmentSource));
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    throw new Error(gl.getProgramInfoLog(program) || "WebGL program link failed.");
  }
  return program;
}

function makeMat4Perspective(fov, aspect, near, far) {
  const f = 1 / Math.tan(fov / 2);
  const range = 1 / (near - far);
  return [
    f / aspect, 0, 0, 0,
    0, f, 0, 0,
    0, 0, (near + far) * range, -1,
    0, 0, (2 * near * far) * range, 0
  ];
}

function makeMat4LookAt(eye, target, up) {
  const z = normalize3([eye[0] - target[0], eye[1] - target[1], eye[2] - target[2]]);
  const x = normalize3(cross3(up, z));
  const y = cross3(z, x);

  return [
    x[0], y[0], z[0], 0,
    x[1], y[1], z[1], 0,
    x[2], y[2], z[2], 0,
    -dot3(x, eye), -dot3(y, eye), -dot3(z, eye), 1
  ];
}

function multiplyMat4(a, b) {
  const out = new Array(16).fill(0);
  for (let row = 0; row < 4; row += 1) {
    for (let col = 0; col < 4; col += 1) {
      for (let i = 0; i < 4; i += 1) {
        out[(col * 4) + row] += a[(i * 4) + row] * b[(col * 4) + i];
      }
    }
  }
  return out;
}

function normalize3(v) {
  const len = Math.hypot(v[0], v[1], v[2]) || 1;
  return [v[0] / len, v[1] / len, v[2] / len];
}

function cross3(a, b) {
  return [
    (a[1] * b[2]) - (a[2] * b[1]),
    (a[2] * b[0]) - (a[0] * b[2]),
    (a[0] * b[1]) - (a[1] * b[0])
  ];
}

function dot3(a, b) {
  return (a[0] * b[0]) + (a[1] * b[1]) + (a[2] * b[2]);
}

function rotateY(point, angle) {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  return [(point[0] * c) + (point[2] * s), point[1], (point[2] * c) - (point[0] * s)];
}

function rotateZ(point, angle) {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  return [(point[0] * c) - (point[1] * s), (point[0] * s) + (point[1] * c), point[2]];
}

function addVertex(vertices, position, color) {
  vertices.push(position[0], position[1], position[2], color[0], color[1], color[2], color[3]);
}

function addTri(vertices, a, b, c, color) {
  addVertex(vertices, a, color);
  addVertex(vertices, b, color);
  addVertex(vertices, c, color);
}

function addQuad(vertices, a, b, c, d, color) {
  addTri(vertices, a, b, c, color);
  addTri(vertices, a, c, d, color);
}

function transformLocal(point, origin, yaw, scale) {
  const rotated = rotateZ(point, yaw);
  const ox = origin.x ?? origin[0];
  const oy = origin.y ?? origin[1];
  const oz = origin.z ?? origin[2];
  return [
    ox + (rotated[0] * scale),
    oy + (rotated[1] * scale),
    oz + (rotated[2] * scale)
  ];
}

function wingPoint(side, x, y, z, flap, yaw, scale, origin) {
  const wingFlex = 0.48 + (x * 1.02);
  const ribWave = Math.sin((x * Math.PI * 2.8) + (y * 3.4) + (origin.wingPhase || 0)) * .024;
  const membraneCurl = Math.sin((x * Math.PI) + (origin.wingPhase || 0)) * .035 * Math.abs(flap);
  const local = rotateY([
    x * side,
    y + (Math.sin((x * 2.2) + (origin.wingPhase || 0)) * .012),
    z + ribWave + membraneCurl
  ], flap * side * wingFlex);
  return transformLocal(local, origin, yaw, scale);
}

function addWingFan(vertices, side, origin, yaw, scale, flap, cx, cy, rx, ry, color, start, end, steps = 18) {
  const center = wingPoint(side, cx, cy, .055, flap, yaw, scale, origin);
  let previous = null;
  for (let i = 0; i <= steps; i += 1) {
    const t = start + ((end - start) * (i / steps));
    const taper = 1 - (Math.cos(t) * .08);
    const x = cx + (Math.cos(t) * rx * taper);
    const y = cy + (Math.sin(t) * ry);
    const edge = wingPoint(side, x, y, .06, flap, yaw, scale, origin);
    if (previous) {
      addTri(vertices, center, previous, edge, color);
    }
    previous = edge;
  }
}

function addWing(vertices, side, origin, yaw, scale, flap, light) {
  const black = [0.012 * light, 0.009 * light, 0.006 * light, 0.74];
  const orange = [0.96 * light, 0.34 * light, 0.06 * light, 0.9];
  const amber = [0.96 * light, 0.46 * light, 0.1 * light, 0.86];
  const vein = [0.01 * light, 0.008 * light, 0.006 * light, .32];

  addWingFan(vertices, side, origin, yaw, scale, flap, .34, .17, .39, .29, black, -2.95, 1.12, 24);
  addWingFan(vertices, side, origin, yaw, scale, flap, .3, -.15, .31, .24, black, -1.1, 2.88, 22);
  addWingFan(vertices, side, origin, yaw, scale, flap, .34, .16, .29, .21, orange, -2.75, .98, 20);
  addWingFan(vertices, side, origin, yaw, scale, flap, .3, -.14, .22, .17, amber, -1.02, 2.7, 18);

  const veinWidth = .0055;
  [
    [[.08, .12], [.52, .02]],
    [[.12, .2], [.48, .26]],
    [[.11, -.08], [.44, -.24]],
    [[.16, -.16], [.5, -.02]]
  ].forEach(([a, b]) => {
    addQuad(
      vertices,
      wingPoint(side, a[0], a[1] - veinWidth, .085, flap, yaw, scale, origin),
      wingPoint(side, b[0], b[1] - veinWidth, .09, flap, yaw, scale, origin),
      wingPoint(side, b[0], b[1] + veinWidth, .09, flap, yaw, scale, origin),
      wingPoint(side, a[0], a[1] + veinWidth, .085, flap, yaw, scale, origin),
      vein
    );
  });

}

function addButterflyGeometry(vertices, butterfly, now, opening) {
  const time = (now - state.introStartedAt - butterfly.plan.delay) / 1000;
  if (time < 0) return;

  const arrivalLength = 5.8 / butterfly.plan.speed;
  const origin = getButterflyPosition(butterfly, time, arrivalLength, opening);
  const visible = origin.visible;
  if (!visible) return;

  const next = getButterflyPosition(butterfly, time + .035, arrivalLength, opening);
  origin.wingPhase = origin.wingPhase ?? ((time * (3.3 + butterfly.index * .22)) + butterfly.index);
  const yaw = Math.atan2(next.y - origin.y, next.x - origin.x) + (origin.bank || 0) + (Math.sin(time * .7 + butterfly.index) * .1);
  const lift = opening ? 1 : clamp(time / arrivalLength, 0, 1);
  const light = 0.86 + (lift * .18) + (origin.close ? .16 : 0) + (opening ? .22 : 0);
  const flap = origin.resting
    ? .22 + (Math.sin((time * 1.45) + butterfly.index) * .16)
    : .42 + (Math.sin((time * butterfly.plan.flap) + butterfly.index) * .58);
  const scale = butterfly.plan.scale * origin.scale * (origin.close ? 1.16 : 1.04);

  if (origin.close) {
    addCameraBlur(vertices, origin, yaw, scale);
  }

  addWing(vertices, -1, origin, yaw, scale, flap, light);
  addWing(vertices, 1, origin, yaw, scale, flap, light);

  const bodyColor = [0.035 * light, 0.023 * light, 0.015 * light, .96];
  addQuad(
    vertices,
    transformLocal([-.026, -.31, .12], origin, yaw, scale),
    transformLocal([.026, -.31, .12], origin, yaw, scale),
    transformLocal([.026, .32, .12], origin, yaw, scale),
    transformLocal([-.026, .32, .12], origin, yaw, scale),
    bodyColor
  );

  const shadowAlpha = origin.resting
    ? .24
    : clamp(.28 - (origin.z * .06), .04, .18);
  addQuad(
    vertices,
    [origin.x - (.68 * scale), origin.y - (.7 * scale), -0.22],
    [origin.x + (.68 * scale), origin.y - (.7 * scale), -0.22],
    [origin.x + (.46 * scale), origin.y - (.9 * scale), -0.22],
    [origin.x - (.46 * scale), origin.y - (.9 * scale), -0.22],
    [0, 0, 0, shadowAlpha]
  );
}

function addCameraBlur(vertices, origin, yaw, scale) {
  const blur = [1.0, .58, .18, .12];
  const blurScale = scale * 1.75;
  addQuad(
    vertices,
    transformLocal([-.62, -.44, .02], origin, yaw, blurScale),
    transformLocal([.62, -.44, .02], origin, yaw, blurScale),
    transformLocal([.62, .44, .02], origin, yaw, blurScale),
    transformLocal([-.62, .44, .02], origin, yaw, blurScale),
    blur
  );
}

function phaseTimes(butterfly, arrivalLength) {
  const drift = butterfly.index * .27;
  return {
    entry: arrivalLength * (butterfly.index === 0 ? .9 : .72),
    weave: (butterfly.plan.role === "circle" || butterfly.plan.role === "wander" ? 3.1 : 2.05) + drift,
    land: 1.05 + (butterfly.index * .12),
    rest: 2.15 + ((butterfly.index % 4) * .28),
    lift: 2.15 + (butterfly.index * .14)
  };
}

function naturalFlutter(pos, butterfly, time, strength = 1) {
  const i = butterfly.index + 1;
  const bob = Math.sin((time * (2.55 + (i * .17))) + i) * .22 * strength;
  const wander = Math.sin((time * (1.24 + (i * .1))) + (i * 2.4)) * .16 * strength;
  const depth = Math.cos((time * (1.65 + (i * .07))) + i) * .18 * strength;

  return {
    x: pos[0] + wander,
    y: pos[1] + bob,
    z: pos[2] + depth,
    scale: 1 + (Math.sin((time * 1.8) + i) * .045 * strength),
    resting: false,
    close: pos[2] > 1.45,
    bank: Math.sin((time * 2.8) + i) * .32 * strength,
    wingPhase: (time * (3.2 + (i * .18))) + i,
    visible: true
  };
}

function gardenLoopPosition(plan, butterfly, loopTime) {
  const i = butterfly.index + 1;
  const a = loopTime * (.62 + (i * .045));
  const b = loopTime * (.38 + (i * .035));
  const center = mix3(plan.orbit[2], plan.orbit[0], .45);
  return [
    center[0] + (Math.cos(a + i) * (1.1 + (i * .08))),
    center[1] + (Math.sin(b + i * .7) * .64),
    center[2] + (Math.sin(a * .8 + i) * .72)
  ];
}

function titleCirclePosition(time, butterfly) {
  const angle = (time * 1.15) + butterfly.index;
  return [
    .18 + (Math.cos(angle) * 1.55),
    .48 + (Math.sin(angle * 1.08) * .62),
    .68 + (Math.sin(angle + .7) * .5)
  ];
}

function flowerHoverPosition(time, butterfly) {
  const angle = (time * 1.6) + butterfly.index;
  return [
    1.95 + (Math.cos(angle) * .52),
    -.78 + (Math.sin(angle * .9) * .34),
    .72 + (Math.sin(angle * 1.2) * .28)
  ];
}

function flowerScentPosition(time, butterfly) {
  const angle = (time * 2.2) + butterfly.index;
  return {
    x: 1.95 + (Math.cos(angle) * .24),
    y: -.78 + (Math.sin(angle * 1.28) * .16),
    z: .52 + (Math.sin(angle * .8) * .12),
    scale: .7 + (Math.sin(time * 3.8) * .035),
    resting: true,
    close: false,
    bank: Math.sin(angle) * .08,
    wingPhase: (time * 1.8) + butterfly.index,
    visible: true
  };
}

function getButterflyPosition(butterfly, time, arrivalLength, opening) {
  const plan = butterfly.plan;
  const start = plan.start;
  const first = plan.orbit[0];
  const second = plan.orbit[1];
  const third = plan.orbit[2];
  const landing = plan.land;
  const exit = plan.exit;

  if (!opening) {
    if (plan.role === "pageBurst") {
      return { x: 0, y: 0, z: 0, scale: 0, visible: false };
    }

    const phases = phaseTimes(butterfly, arrivalLength);
    const entryEnd = phases.entry;
    const weaveEnd = entryEnd + phases.weave;
    const landEnd = weaveEnd + phases.land;
    const restEnd = landEnd + phases.rest;
    const liftEnd = restEnd + phases.lift;

    if (butterfly.index === 0 && time < entryEnd) {
      const p = clamp(time / entryEnd, 0, 1);
      if (p < .34) {
        const t = easeInOut(p / .34);
        const pos = cubic3(start, [-6.9, .95, .35], [-4.35, 2.2, 2.5], [-1.55, 1.35, 3.45], t);
        const fluttered = naturalFlutter(pos, butterfly, time, .72);
        fluttered.scale = mix(.48, 1.34, t) * fluttered.scale;
        fluttered.close = t > .48;
        return fluttered;
      }

      if (p < .76) {
        const t = easeInOut((p - .34) / .42);
        const angle = mix(-Math.PI * .85, Math.PI * 1.25, t);
        const looped = {
          x: Math.cos(angle) * 1.45,
          y: 1.05 + (Math.sin(angle * .8) * .72),
          z: 2.65 + (Math.sin(angle) * .92),
          scale: 1.1 + (Math.sin(t * Math.PI) * .62),
          resting: false,
          close: true,
          bank: Math.sin(angle) * .34,
          visible: true
        };
        return looped;
      }

      const t = easeInOut((p - .76) / .24);
      const pos = cubic3([1.45, .85, 1.9], [1.2, 1.55, .7], [-1.5, .35, .55], third, t);
      const fluttered = naturalFlutter(pos, butterfly, time, .65);
      fluttered.scale = mix(.95, .86, t) * fluttered.scale;
      fluttered.close = false;
      return fluttered;
    }

    if (time < entryEnd) {
      const t = easeInOut(time / entryEnd);
      const orbit = cubic3(start, first, second, third, t);
      const circle = Math.sin((t * Math.PI * 4.4) + butterfly.index) * .44;
      const fluttered = naturalFlutter([orbit[0] + circle, orbit[1], orbit[2]], butterfly, time, .88);
      fluttered.scale = mix(.54, 1, t) * fluttered.scale;
      return fluttered;
    }

    if (time < weaveEnd) {
      const t = easeInOut((time - entryEnd) / phases.weave);
      const weaveTarget = plan.role === "title"
        ? titleCirclePosition((time - entryEnd) * 1.25, butterfly)
        : plan.role === "flower"
          ? flowerHoverPosition(time - entryEnd, butterfly)
          : plan.role === "spine"
            ? [-2.92 + (Math.cos(t * Math.PI * 2) * .42), .2 + (Math.sin(t * Math.PI * 2.4) * .54), .74]
            : gardenLoopPosition(plan, butterfly, t * (plan.role === "circle" ? 4.2 : 2.4));
      const pos = cubic3(third, second, first, weaveTarget, t);
      const fluttered = naturalFlutter(pos, butterfly, time, 1);
      fluttered.scale = (plan.role === "title" ? .8 : .92) * fluttered.scale;
      return fluttered;
    }

    if (time < landEnd) {
      const t = easeInOut((time - weaveEnd) / phases.land);
      const from = plan.role === "title"
        ? titleCirclePosition(phases.weave * 1.25, butterfly)
        : plan.role === "flower"
          ? flowerHoverPosition(phases.weave, butterfly)
          : plan.role === "spine"
            ? [-2.92, .2, .74]
            : gardenLoopPosition(plan, butterfly, plan.role === "circle" ? 4.2 : 2.4);
      const pos = cubic3(from, plan.orbit[1], plan.orbit[2], landing, t);
      const fluttered = naturalFlutter(pos, butterfly, time, .55);
      fluttered.scale = mix(.9, .74, t) * fluttered.scale;
      fluttered.close = false;
      return fluttered;
    }

    if (plan.role === "flower" && time < landEnd + 1.35) {
      return flowerScentPosition(time - landEnd, butterfly);
    }

    if (time < restEnd) {
      const restTime = time - landEnd;
      return {
        x: landing[0] + (Math.sin(restTime * .8 + butterfly.index) * .015),
        y: landing[1] + (Math.cos(restTime * .55 + butterfly.index) * .01),
        z: landing[2],
        scale: .74,
        resting: true,
        close: false,
        bank: Math.sin(restTime * .9) * .035,
        wingPhase: (restTime * 2.1) + butterfly.index,
        visible: true
      };
    }

    if (time < liftEnd) {
      const t = easeInOut((time - restEnd) / phases.lift);
      const returnPoint = gardenLoopPosition(plan, butterfly, t * 2.6 + 2.4);
      const pos = cubic3(landing, plan.orbit[2], plan.orbit[1], returnPoint, t);
      const fluttered = naturalFlutter(pos, butterfly, time, .95);
      fluttered.scale = mix(.74, .92, Math.sin(t * Math.PI)) * fluttered.scale;
      return fluttered;
    }

    const loopTime = time - liftEnd;
    const pos = gardenLoopPosition(plan, butterfly, loopTime);
    const fluttered = naturalFlutter(pos, butterfly, time, .85);
    fluttered.scale = .82 * fluttered.scale;
    return fluttered;
  }

  const openingElapsed = Math.max((performance.now() - state.bookOpeningAt) / 1000, 0);

  if (plan.role === "pageBurst") {
    const p = clamp((openingElapsed - 2.2) / 8.8, 0, 1);
    if (p <= 0 || p >= .98) {
      return { x: 0, y: 0, z: 0, scale: 0, visible: false };
    }
    const t = easeInOut(p);
    const pos = cubic3([-.12, .08, .36], [.28, .92, 2.4], [1.82, .56, 4.85], [4.95, -.35, 3.4], t);
    const fluttered = naturalFlutter(pos, butterfly, openingElapsed, .8);
    fluttered.scale = mix(.5, 1.9, Math.sin(p * Math.PI)) * fluttered.scale;
    fluttered.close = p > .32 && p < .78;
    fluttered.bank = Math.sin(p * Math.PI * 3.4) * .5;
    fluttered.wingPhase = openingElapsed * 6.4;
    return fluttered;
  }

  const gatherTime = openingElapsed - (butterfly.index * .08);
  const p = clamp(gatherTime / 8.4, 0, 1);
  const fromCurrent = getButterflyPosition(butterfly, time, arrivalLength, false);
  if (!fromCurrent.visible) {
    return { x: 0, y: 0, z: 0, scale: 0, visible: false };
  }
  const liftStart = [fromCurrent.x, fromCurrent.y, fromCurrent.z];
  const coaxTargets = [
    [-1.72, -.42, .42],
    [.18, .34, .34],
    [1.32, -.78, .38],
    [-2.62, .06, .42],
    [-.82, -.66, .36],
    [2.28, -.16, .34],
    [-1.18, .84, .38],
    [.86, -.24, .34],
    [1.82, .54, .36]
  ];
  const coax = coaxTargets[butterfly.index % coaxTargets.length];

  if (gatherTime < 2.2) {
    const t = easeInOut(clamp(gatherTime / 2.2, 0, 1));
    const pos = cubic3(
      liftStart,
      [liftStart[0] + Math.sin(butterfly.index) * .64, liftStart[1] + .92, liftStart[2] + .48],
      [coax[0] + Math.cos(butterfly.index) * .36, coax[1] + .64, coax[2] + .72],
      coax,
      t
    );
    const fluttered = naturalFlutter(pos, butterfly, openingElapsed, .46);
    fluttered.scale = mix(fromCurrent.scale || .78, .76, t) * fluttered.scale;
    fluttered.close = false;
    return fluttered;
  }

  if (gatherTime < 4.25) {
    const restTime = gatherTime - 2.2;
    const nudge = Math.sin(restTime * 5.4 + butterfly.index);
    return {
      x: coax[0] + (Math.sin(restTime * 2.2 + butterfly.index) * .035),
      y: coax[1] + (Math.abs(nudge) * .055),
      z: coax[2],
      scale: .76 + (Math.sin(restTime * 1.6 + butterfly.index) * .025),
      resting: true,
      close: false,
      bank: Math.sin(restTime * 2 + butterfly.index) * .06,
      wingPhase: (restTime * 2.8) + butterfly.index,
      visible: true
    };
  }

  const liftMidA = [
    coax[0] + (Math.sin(butterfly.index) * .58),
    coax[1] + 1.05 + (butterfly.index * .05),
    coax[2] + .72
  ];
  const liftMidB = [
    mix(coax[0], exit[0], .45),
    2.6 + (Math.sin(butterfly.index * 1.7) * .5),
    1.65 + (Math.cos(butterfly.index) * .28)
  ];
  const liftP = easeInOut(clamp((gatherTime - 4.25) / 4.15, 0, 1));
  const lifted = cubic3(coax, liftMidA, liftMidB, exit, liftP);
  const panic = Math.sin((openingElapsed * (2.2 + butterfly.index * .22)) + butterfly.index);
  return {
    x: lifted[0] + (Math.sin(liftP * Math.PI * 5 + butterfly.index) * .28) + (panic * .12),
    y: lifted[1] + (Math.sin(liftP * Math.PI) * .72) + (Math.abs(panic) * .12),
    z: lifted[2] + (Math.sin(liftP * Math.PI * 2 + butterfly.index) * .28) + (Math.cos(openingElapsed * 1.7) * .12),
    scale: mix(.76, 1.04, Math.sin(liftP * Math.PI)),
    resting: false,
    close: lifted[2] > 1.25,
    bank: panic * .34,
    wingPhase: (openingElapsed * (4.2 + butterfly.index * .18)) + butterfly.index,
    visible: liftP < .98
  };
}

function setupButterflyScene() {
  const canvas = document.getElementById("storybookCanvas");
  if (!canvas) return null;

  const gl = canvas.getContext("webgl", {
    alpha: true,
    antialias: true,
    premultipliedAlpha: false
  });
  if (!gl) {
    canvas.style.display = "none";
    return null;
  }

  const program = createProgram(gl, `
    attribute vec3 aPosition;
    attribute vec4 aColor;
    uniform mat4 uMatrix;
    varying vec4 vColor;
    void main() {
      gl_Position = uMatrix * vec4(aPosition, 1.0);
      vColor = aColor;
    }
  `, `
    precision mediump float;
    varying vec4 vColor;
    void main() {
      gl_FragColor = vColor;
    }
  `);

  const buffer = gl.createBuffer();
  const scene = {
    canvas,
    gl,
    program,
    buffer,
    butterflies: butterflyPlans.map((plan, index) => ({ plan, index })),
    vertices: []
  };

  resizeButterflyScene(scene);
  window.addEventListener("resize", () => resizeButterflyScene(scene), { passive: true });
  window.requestAnimationFrame((now) => renderButterflyScene(scene, now));
  return scene;
}

function setupOpeningMonarchs() {
  const opening = document.getElementById("openingScene");
  const canvas = document.getElementById("storybookCanvas");
  if (!opening) return null;

  canvas?.setAttribute("hidden", "");

  const layer = document.createElement("div");
  layer.className = "opening-monarch-layer";
  layer.setAttribute("aria-hidden", "true");
  opening.appendChild(layer);

  const heroButterflyImages = [
    "images/monarch-transparent.png",
    "images/hero-butterfly-purple.png",
    "images/hero-butterfly-pink.png",
    "images/hero-butterfly-blue.png"
  ];

  const butterflies = butterflyPlans
    .filter((plan) => plan.role !== "pageBurst")
    .slice(0, 4)
    .map((plan, index) => {
      const node = document.createElement("span");
      node.className = `svg-monarch opening-monarch opening-monarch-${index + 1}`;
      node.dataset.heroColor = ["orange", "purple", "pink", "blue"][index];
      node.innerHTML = monarchMarkup(heroButterflyImages[index]);
      layer.appendChild(node);
      return { node, plan, index };
    });

  const setPose = (node, x, y, rotation, scale, opacity, resting = false, warmLit = false) => {
    node.classList.add("is-flying");
    node.classList.toggle("is-resting", resting);
    node.classList.toggle("is-warm-lit", warmLit);
    node.style.opacity = String(clamp(opacity, 0, 1));
    node.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%) rotate(${rotation}deg) scale(${scale})`;
  };

  const point = (a, b, c, d, t) => {
    const mt = 1 - t;
    return {
      x: (mt * mt * mt * a.x) + (3 * mt * mt * t * b.x) + (3 * mt * t * t * c.x) + (t * t * t * d.x),
      y: (mt * mt * mt * a.y) + (3 * mt * mt * t * b.y) + (3 * mt * t * t * c.y) + (t * t * t * d.y)
    };
  };

  const poseBeforeOpening = (butterfly, elapsed, viewport) => {
    const entranceLeadIn = 1.1;
    const flightDuration = 5;
    const arrivalGap = .65;
    const delay = entranceLeadIn + (butterfly.index * (flightDuration + arrivalGap));
    const t = Math.max(0, elapsed - delay);
    const gatherTime = entranceLeadIn + ((flightDuration + arrivalGap) * 3) + flightDuration;
    const awakeningDuration = 3.45;
    const allLandedHoldDuration = 2.25;
    const edgeMoveDuration = 2.1;
    const edgeMoveStart = gatherTime + awakeningDuration + allLandedHoldDuration;
    const pullStart = edgeMoveStart + edgeMoveDuration;
    const liveBook = document.querySelector(".intro-book-element")?.getBoundingClientRect();
    const bookWidth = liveBook?.width || Math.min(1240, viewport.width * 1.22);
    const bookHeight = liveBook?.height || (bookWidth / 1.5);
    const bookLeft = liveBook?.left ?? ((viewport.width - bookWidth) / 2);
    const bookTop = liveBook?.top ?? ((viewport.height - bookHeight) / 2);
    const onBook = (x, y) => ({ x: bookLeft + (bookWidth * x), y: bookTop + (bookHeight * y) });
    const flowerLandings = [
      // Four separate flower-only anchors in the approved book artwork.
      // None of these points shares or targets a printed butterfly position.
      onBook(.265, .31),
      onBook(.62, .18),
      onBook(.44, .675),
      onBook(.73, .54)
    ];
    const paths = [
      {
        start: { x: viewport.width + 180, y: -140 },
        approachA: { x: viewport.width * .92, y: viewport.height * .06 },
        approachB: { x: viewport.width * .67, y: viewport.height * .29 },
        book: flowerLandings[0]
      },
      {
        start: { x: -180, y: -140 },
        approachA: { x: viewport.width * .08, y: viewport.height * .07 },
        approachB: { x: viewport.width * .33, y: viewport.height * .30 },
        book: flowerLandings[1]
      },
      {
        start: { x: -180, y: viewport.height + 140 },
        approachA: { x: viewport.width * .07, y: viewport.height * .92 },
        approachB: { x: viewport.width * .27, y: viewport.height * .76 },
        book: flowerLandings[2]
      },
      {
        start: { x: viewport.width + 180, y: viewport.height + 140 },
        approachA: { x: viewport.width * .93, y: viewport.height * .91 },
        approachB: { x: viewport.width * .73, y: viewport.height * .76 },
        book: flowerLandings[3]
      }
    ];
    const path = paths[butterfly.index] || paths[0];

    if (elapsed < delay) {
      butterfly.node.dataset.introPhase = "waiting";
      return { ...path.start, rotation: 0, scale: .58, opacity: 0 };
    }

    if (t < flightDuration) {
      butterfly.node.dataset.introPhase = "flying";
      const p = easeInOut(clamp(t / flightDuration, 0, 1));
      const pos = point(
        path.start,
        path.approachA,
        path.approachB,
        path.book,
        p
      );
      return { ...pos, rotation: Math.sin(p * Math.PI * 2.2 + butterfly.index) * 14, scale: .58 + Math.sin(p * Math.PI) * .18, opacity: p < .025 ? p / .025 : 1, warmLit: p > .72 };
    }

    if (elapsed < edgeMoveStart) {
      const rest = t - flightDuration;
      const allFourHolding = elapsed >= gatherTime + awakeningDuration;
      const phase = allFourHolding ? "all-landed-hold"
        : rest < .62 ? "landing-settle"
        : rest < 1.18 ? "wing-twitch"
          : rest < 1.92 ? "awakening-shimmer"
            : rest < 2.68 ? "wings-opening"
              : "awakened-lift";
      butterfly.node.dataset.introPhase = phase;
      const lift = phase === "awakened-lift" ? easeInOut(clamp((rest - 2.68) / .77, 0, 1)) : 0;
      return {
        x: path.book.x + Math.sin(rest * 1.1 + butterfly.index) * 3,
        y: path.book.y + Math.abs(Math.sin(rest * 1.7 + butterfly.index)) * 2 - (lift * 18),
        rotation: Math.sin(rest * 1.2 + butterfly.index) * 4,
        scale: .68 + (lift * .08),
        opacity: 1,
        resting: true,
        warmLit: true
      };
    }

    // The tugging points belong to the transformed book, not the viewport.
    // Keep them just inside the visible right edge so every butterfly is
    // physically pulling against the cover on narrow screens as well.
    const visibleBookRight = Math.min(bookLeft + bookWidth, viewport.width);
    const visibleBookEdge = Math.min(onBook(.82, .5).x, visibleBookRight - 54);
    const edgeTargets = [
      { x: visibleBookEdge - 14, y: onBook(.5, .34).y },
      { x: visibleBookEdge - 2, y: onBook(.5, .43).y },
      { x: visibleBookEdge - 15, y: onBook(.5, .52).y },
      { x: visibleBookEdge - 3, y: onBook(.5, .61).y }
    ];
    const edgeTarget = edgeTargets[butterfly.index] || edgeTargets[0];

    if (elapsed < pullStart) {
      butterfly.node.dataset.introPhase = "moving-to-edge";
      const p = easeInOut(clamp((elapsed - edgeMoveStart) / edgeMoveDuration, 0, 1));
      const pos = point(
        path.book,
        { x: path.book.x + (viewport.width * .08), y: path.book.y - (viewport.height * .08) },
        { x: edgeTarget.x - (viewport.width * .05), y: edgeTarget.y + (viewport.height * .05) },
        edgeTarget,
        p
      );
      return { ...pos, rotation: Math.sin(p * Math.PI * 3 + butterfly.index) * 12, scale: .62, opacity: 1, warmLit: true };
    }

    butterfly.node.dataset.introPhase = "pulling";
    const pullTime = elapsed - pullStart;
    const side = butterfly.index % 2 === 0 ? -1 : 1;
    const tug = Math.abs(Math.sin(pullTime * 5.2 + butterfly.index * .35));
    return {
      x: edgeTarget.x + side * (3 + tug * 14),
      y: edgeTarget.y - (tug * 13) + Math.sin(pullTime * 2 + butterfly.index) * 3,
      rotation: side * (4 + tug * 9),
      scale: .61 + tug * .035,
      opacity: 1,
      resting: false,
      warmLit: true
    };
  };

  const poseAfterOpening = (butterfly, openingElapsed, viewport) => {
    const titleFinished = opening.classList.contains("title-magic-complete");
    const glyphs = document.querySelectorAll("#introBrandType .magic-letter");
    const capital = glyphs[butterfly.index === 0 ? 0 : 8]?.getBoundingClientRect();
    const worldTargets = [
      { x: viewport.width * .38, y: viewport.height * .50 },
      { x: viewport.width * .62, y: viewport.height * .50 },
      { x: viewport.width * .43, y: viewport.height * .32 },
      { x: viewport.width * .72, y: viewport.height * .60 }
    ];
    const titleTarget = capital
      // Settle directly onto the upper painted stroke of the capital glyph.
      // The butterfly's centre overlaps the letter so the landing cannot read
      // as merely hovering nearby.
      ? { x: capital.left + (capital.width * .5), y: capital.top + 2 }
      : worldTargets[butterfly.index];
    const landingStart = 7.65;
    const landingProgress = clamp((openingElapsed - landingStart) / 1.75, 0, 1);
    const isTitleHero = titleFinished && butterfly.index < 2;
    let target = worldTargets[butterfly.index] || worldTargets[0];
    if (isTitleHero) {
      const p = easeInOut(landingProgress);
      const start = worldTargets[butterfly.index];
      target = point(
        start,
        { x: start.x + (butterfly.index ? -viewport.width * .08 : viewport.width * .04), y: start.y - viewport.height * .2 },
        { x: titleTarget.x + (butterfly.index ? viewport.width * .07 : -viewport.width * .06), y: titleTarget.y - viewport.height * .12 },
        titleTarget,
        p
      );
    }
    const bob = Math.abs(Math.sin(openingElapsed * 3.8 + butterfly.index)) * 8;
    butterfly.node.dataset.introPhase = isTitleHero && landingProgress >= 1 ? "title-perched" : (isTitleHero ? "title-landing" : "opening-world");
    return {
      x: target.x + (isTitleHero ? 0 : Math.sin(openingElapsed * 1.8 + butterfly.index) * 8),
      y: target.y - (isTitleHero ? 0 : bob),
      rotation: isTitleHero ? (butterfly.index ? 7 : -7) : Math.sin(openingElapsed * 2.1 + butterfly.index) * 9,
      scale: isTitleHero ? .44 : .62,
      opacity: 1,
      resting: isTitleHero && landingProgress >= 1,
      warmLit: true
    };
  };

  function frame(now) {
    const viewport = { width: window.innerWidth, height: window.innerHeight };
    const elapsed = (now - state.introStartedAt) / 1000;
    const openingElapsed = state.bookOpeningAt ? (now - state.bookOpeningAt) / 1000 : 0;

    butterflies.forEach((butterfly) => {
      const pose = state.bookOpeningAt
        ? poseAfterOpening(butterfly, openingElapsed, viewport)
        : poseBeforeOpening(butterfly, elapsed, viewport);
      setPose(butterfly.node, pose.x, pose.y, pose.rotation, pose.scale, pose.opacity, pose.resting, pose.warmLit);
      const awakenedPhases = ["awakened-lift", "all-landed-hold", "moving-to-edge", "pulling", "opening-world", "title-landing", "title-perched"];
      opening.classList.toggle(`hero-awakened-${butterfly.index + 1}`, awakenedPhases.includes(butterfly.node.dataset.introPhase));
    });

    if (!state.completed) {
      window.requestAnimationFrame(frame);
    }
  }

  window.requestAnimationFrame(frame);
  return { layer, butterflies };
}

function setupIntroAudio() {
  const audio = {
    pageTurn: document.getElementById("audioPageTurn"),
    forest: document.getElementById("audioForestAmbience"),
    wind: document.getElementById("audioSoftWind"),
    sparkle: document.getElementById("audioMagicSparkle")
  };

  Object.values(audio).forEach((track) => {
    if (!track) return;
    track.volume = 0;
  });

  window.ForeverBeadedAudio = {
    setSources(sources = {}) {
      Object.entries(sources).forEach(([key, src]) => {
        if (audio[key] && src) {
          audio[key].src = src;
        }
      });
    },
    setVolume(key, volume) {
      if (audio[key]) {
        audio[key].volume = clamp(Number(volume) || 0, 0, 1);
      }
    },
    play(key) {
      return audio[key]?.play?.();
    },
    pause(key) {
      audio[key]?.pause?.();
    }
  };

  return audio;
}

function resizeButterflyScene(scene) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const width = Math.max(1, Math.floor(scene.canvas.clientWidth * dpr));
  const height = Math.max(1, Math.floor(scene.canvas.clientHeight * dpr));
  if (scene.canvas.width !== width || scene.canvas.height !== height) {
    scene.canvas.width = width;
    scene.canvas.height = height;
  }
  scene.gl.viewport(0, 0, width, height);
}

function renderButterflyScene(scene, now) {
  const { gl, program, buffer, vertices } = scene;
  vertices.length = 0;

  const elapsed = (now - state.introStartedAt) / 1000;
  const opening = Boolean(state.bookOpeningAt);
  scene.butterflies.forEach((butterfly) => addButterflyGeometry(vertices, butterfly, now, opening));

  gl.clearColor(0, 0, 0, 0);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  gl.enable(gl.DEPTH_TEST);
  gl.depthMask(false);

  if (vertices.length) {
    const aspect = scene.canvas.width / scene.canvas.height;
    const dolly = clamp(elapsed / 22, 0, 1);
    const cameraJitter = Math.sin(elapsed * 1.7) * .025;
    const projection = makeMat4Perspective(Math.PI / 4.8, aspect, .1, 100);
    const view = makeMat4LookAt(
      [cameraJitter, .1 + (Math.sin(elapsed * .9) * .025), 7.2 - (dolly * 1.35)],
      [0, -.18, 0],
      [0, 1, 0]
    );
    const matrix = multiplyMat4(projection, view);

    gl.useProgram(program);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.DYNAMIC_DRAW);

    const stride = 7 * 4;
    const position = gl.getAttribLocation(program, "aPosition");
    const color = gl.getAttribLocation(program, "aColor");
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 3, gl.FLOAT, false, stride, 0);
    gl.enableVertexAttribArray(color);
    gl.vertexAttribPointer(color, 4, gl.FLOAT, false, stride, 3 * 4);
    gl.uniformMatrix4fv(gl.getUniformLocation(program, "uMatrix"), false, new Float32Array(matrix));
    gl.drawArrays(gl.TRIANGLES, 0, vertices.length / 7);
  }

  if (!state.completed || elapsed < 34) {
    window.requestAnimationFrame((next) => renderButterflyScene(scene, next));
  }
}

function completeOpening() {
  if (state.completed) return;
  state.completed = true;
  state.butterflyScene?.layer?.remove();
  state.butterflyScene = null;
  state.opening?.classList.add("is-inside-book");
  document.body.classList.remove("intro-active");
  document.body.classList.add("book-opened");
  window.setTimeout(() => {
    document.getElementById("chapterOne")?.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
    window.setTimeout(setupExclusiveDiscoveryObserver, 900);
    window.setTimeout(() => {
      document.body.classList.add("ambient-nature-active");
    }, 2300);
  }, 420);
}

function typeIntroBrand() {
  if (state.completed) return;
  const title = document.getElementById("introBrandType");
  if (!title) return;

  const words = "Forever Beaded";
  let letter = 0;
  title.replaceChildren();
  state.opening?.classList.add("collections-title-typing");

  const typeNextLetter = () => {
    if (state.completed || letter >= words.length) return;
    const character = words[letter];
    const glyph = document.createElement("span");
    glyph.className = character === " " ? "magic-letter magic-letter-space" : "magic-letter";
    glyph.textContent = character === " " ? "\u00a0" : character;
    title.appendChild(glyph);

    if (character !== " ") {
      const spark = document.createElement("i");
      spark.className = "writing-spark";
      spark.style.setProperty("--spark-x", `${((letter + .7) / words.length) * 100}%`);
      title.parentElement?.appendChild(spark);
      window.setTimeout(() => spark.remove(), 1200);
    }

    letter += 1;
    if (letter < words.length) {
      window.setTimeout(typeNextLetter, 145);
    } else {
      window.setTimeout(() => state.opening?.classList.add("title-magic-complete"), 420);
    }
  };

  typeNextLetter();
}

function createBookMagic() {
  const layer = document.getElementById("introBookMagic");
  if (!layer || layer.childElementCount) return;

  for (let index = 0; index < 34; index += 1) {
    const spark = document.createElement("i");
    const angle = (Math.PI * 2 * index) / 34;
    const distance = 80 + ((index * 31) % 250);
    spark.className = "intro-magic-speck";
    spark.style.setProperty("--spark-x", `${Math.cos(angle) * distance}px`);
    spark.style.setProperty("--spark-y", `${(Math.sin(angle) * distance) - 80}px`);
    spark.style.setProperty("--spark-delay", `${(index % 9) * .06}s`);
    spark.style.setProperty("--spark-time", `${2.1 + ((index % 5) * .2)}s`);
    spark.style.setProperty("--spark-size", `${2 + (index % 4)}px`);
    layer.appendChild(spark);
  }
}

function revealWorldButterflies() {
  const layer = document.getElementById("introWorldButterflies");
  if (!layer || layer.childElementCount) return;
  const plans = [
    ["47%", "59%", "95deg", "-150px", "-150px", "-280px", "-230px", "0s", "8.4s"],
    ["53%", "60%", "185deg", "150px", "-165px", "275px", "-225px", ".18s", "9.2s"],
    ["49%", "56%", "245deg", "-210px", "-250px", "-330px", "-330px", ".36s", "10s"],
    ["51%", "57%", "135deg", "210px", "-235px", "320px", "-315px", ".54s", "8.8s"],
    ["50%", "61%", "310deg", "70px", "-210px", "-90px", "-340px", ".72s", "9.6s"]
  ];

  plans.forEach((plan) => {
    const butterfly = document.createElement("span");
    butterfly.className = "svg-monarch world-magic-butterfly";
    butterfly.innerHTML = monarchMarkup();
    ["--start-x", "--start-y", "--hue", "--drift-x", "--drift-y", "--drift-x2", "--drift-y2", "--drift-delay", "--drift-time"]
      .forEach((name, index) => butterfly.style.setProperty(name, plan[index]));
    layer.appendChild(butterfly);
  });

  state.opening?.classList.add("world-butterflies-active");
}

function setupExclusiveDiscoveryObserver() {
  if (state.exclusiveObserverStarted || state.exclusiveStarted) return;
  const feature = document.querySelector(".hero-feature");
  const hero = feature?.closest(".chapter-hero");
  if (!hero) return;

  state.exclusiveObserverStarted = true;
  let animationFrame = 0;
  const watchStartedAt = performance.now();

  const isFeatureReady = () => {
    if (!document.body.classList.contains("book-opened")) return false;
    const rect = feature.getBoundingClientRect();
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
    return rect.top >= viewportHeight * .14 &&
      rect.top <= viewportHeight * .82 &&
      rect.bottom >= viewportHeight * .36 &&
      rect.left < window.innerWidth &&
      rect.right > 0;
  };

  const cleanup = () => {
    window.removeEventListener("scroll", trigger);
    window.removeEventListener("resize", trigger);
    if (animationFrame) cancelAnimationFrame(animationFrame);
  };

  const trigger = () => {
    if (state.exclusiveStarted) {
      cleanup();
      return;
    }
    if (!isFeatureReady()) return;
    cleanup();
    startExclusiveDiscovery();
  };

  const watch = () => {
    trigger();
    if (state.exclusiveStarted) return;
    if (performance.now() - watchStartedAt < 18000) {
      animationFrame = requestAnimationFrame(watch);
    }
  };

  window.addEventListener("scroll", trigger, { passive: true });
  window.addEventListener("resize", trigger, { passive: true });
  animationFrame = requestAnimationFrame(watch);
}

function startExclusiveDiscovery() {
  if (state.exclusiveStarted) return;
  const feature = document.querySelector(".hero-feature");
  const hero = feature?.closest(".chapter-hero");
  if (!hero) return;

  state.exclusiveStarted = true;
  const butterfly = document.createElement("span");
  butterfly.className = "svg-monarch exclusive-discovery-butterfly";
  butterfly.innerHTML = monarchMarkup();
  const layer = document.createElement("div");
  layer.className = "hero-butterfly-layer";
  layer.setAttribute("aria-hidden", "true");
  layer.appendChild(butterfly);
  hero.appendChild(layer);

  const getTargets = () => {
    const heroRect = hero.getBoundingClientRect();
    const rect = feature.getBoundingClientRect();
    const targetRect = {
      left: rect.left - heroRect.left, right: rect.right - heroRect.left,
      top: rect.top - heroRect.top, width: rect.width, height: rect.height
    };
    const image = feature.querySelector("img");
    const imageRect = image?.getBoundingClientRect() || targetRect;
    const useRightSide = targetRect.right + 150 < heroRect.width;
    const side = useRightSide ? 1 : -1;
    const edgeX = useRightSide ? targetRect.right : targetRect.left;
    const center = {
      x: clamp(edgeX + (side * 94), 78, heroRect.width - 78),
      y: clamp(targetRect.top + (targetRect.height * .36), 96, heroRect.height - 96)
    };
    const hover = {
      x: clamp(edgeX + (side * 82), 74, heroRect.width - 74),
      y: clamp(targetRect.top + (targetRect.height * .22), 90, heroRect.height - 90)
    };
    // Let the butterfly straddle the card border instead of covering the
    // right-aligned desktop copy. Its inner wing still visibly rests on-card.
    const landingX = clamp(targetRect.right + 20, 54, heroRect.width - 24);
    const copyRects = [...feature.querySelectorAll("h2, p, .text-link")].map((element) => {
      const copyRect = element.getBoundingClientRect();
      return {
        left: copyRect.left - heroRect.left,
        right: copyRect.right - heroRect.left,
        top: copyRect.top - heroRect.top,
        bottom: copyRect.bottom - heroRect.top
      };
    });
    const landingCandidates = [.16, .34, .5, .66, .82].map((ratio) => ({
      x: landingX,
      y: clamp(targetRect.top + (targetRect.height * ratio), 54, heroRect.height - 54)
    }));
    const overlapScore = (candidate) => copyRects.reduce((score, copyRect) => {
      const overlapWidth = Math.max(0, Math.min(candidate.x + 46, copyRect.right) - Math.max(candidate.x - 46, copyRect.left));
      const overlapHeight = Math.max(0, Math.min(candidate.y + 44, copyRect.bottom) - Math.max(candidate.y - 44, copyRect.top));
      return score + (overlapWidth * overlapHeight);
    }, 0);
    // Choose a responsive card-edge perch with the least overlap rather than
    // assuming the desktop and stacked mobile copy occupy the same area.
    const land = landingCandidates.reduce((best, candidate) =>
      overlapScore(candidate) < overlapScore(best) ? candidate : best
    );
    return { targetRect, center, hover, land };
  };

  const start = { x: window.innerWidth * .16, y: Math.max(110, window.innerHeight * .18) };
  const started = Date.now();
  const duration = 15000;

  function point(a, b, c, d, t) {
    const mt = 1 - t;
    return {
      x: (mt * mt * mt * a.x) + (3 * mt * mt * t * b.x) + (3 * mt * t * t * c.x) + (t * t * t * d.x),
      y: (mt * mt * mt * a.y) + (3 * mt * mt * t * b.y) + (3 * mt * t * t * c.y) + (t * t * t * d.y)
    };
  }

  function animate() {
    const raw = clamp((Date.now() - started) / duration, 0, 1);
    const { targetRect, center, hover, land } = getTargets();
    const c1 = { x: window.innerWidth * .28, y: window.innerHeight * .24 };
    const c2 = { x: Math.max(120, center.x - (window.innerWidth * .24)), y: Math.min(window.innerHeight - 110, center.y + 150) };
    let pos;
    let bank;
    let scale;
    let resting = false;

    if (raw < .3) {
      const t = easeInOut(raw / .3);
      pos = point(start, c1, c2, center, t);
      pos.x += Math.sin(t * Math.PI * 5.2) * 28;
      pos.y += Math.sin(t * Math.PI * 3.4) * 18;
      bank = Math.sin(t * Math.PI * 3.4) * 16;
      scale = .74 + Math.sin(t * Math.PI) * .2;
    } else if (raw < .5) {
      const t = (raw - .3) / .2;
      const angle = (t * Math.PI * 2) - Math.PI * .15;
      pos = {
        x: center.x + Math.cos(angle) * Math.min(24, targetRect.width * .08),
        y: center.y + Math.sin(angle) * Math.min(48, targetRect.height * .16)
      };
      bank = Math.sin(angle) * 18;
      scale = .9 + Math.sin(t * Math.PI) * .08;
    } else if (raw < .62) {
      const t = easeInOut((raw - .5) / .12);
      pos = point(center, { x: center.x + 64, y: center.y - 72 }, { x: hover.x + 34, y: hover.y + 22 }, hover, t);
      bank = Math.sin(t * Math.PI * 2) * 10;
      scale = .86;
    } else if (raw < .72) {
      const t = easeInOut((raw - .62) / .1);
      pos = point(hover, { x: hover.x + 30, y: hover.y - 34 }, { x: land.x + 22, y: land.y - 28 }, land, t);
      bank = 6 - (t * 12);
      scale = .82 - (t * .08);
      feature.classList.add("treasure-found");
      resting = t > .72;
    } else {
      const t = (raw - .72) / .28;
      pos = {
        x: land.x + (Math.sin(t * Math.PI * 2) * 2),
        y: land.y + (Math.sin(t * Math.PI * 3) * 1.6)
      };
      bank = -4 + (Math.sin(t * Math.PI * 2) * 2);
      scale = .74;
      resting = true;
    }

    const bob = resting ? 0 : Math.sin(raw * Math.PI * 9) * 8;
    butterfly.classList.add("is-flying");
    butterfly.classList.toggle("is-resting", resting);
    butterfly.style.opacity = String(raw < .06 ? raw / .06 : 1);
    butterfly.style.transform = `translate3d(${pos.x}px, ${pos.y + bob}px, 0) translate(-50%, -50%) rotate(${bank}deg) scale(${scale})`;

    if (raw < 1) {
      window.requestAnimationFrame(animate);
    }
  }

  window.requestAnimationFrame(animate);
}

function startCinematicIntro() {
  window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  state.opening = document.getElementById("openingScene");
  const image = document.querySelector(".intro-book-image");
  state.introStartedAt = performance.now();
  state.audio = setupIntroAudio();

  document.body.classList.add("cinematic-intro-ready");
  state.opening?.classList.add("cinematic-book-visible");
  state.butterflyScene = setupOpeningMonarchs();
  createBookMagic();

  const openingDelay = 33400;
  const beadMagicDelay = 33850;
  const worldRevealDelay = 35950;
  const titleDelay = 38500;
  const worldButterflyDelay = 36400;
  const finishDelay = 54000;

  window.setTimeout(() => {
    if (state.completed) return;
    state.bookOpeningAt = performance.now();
    state.opening?.classList.add("intro-opening");
  }, openingDelay);

  window.setTimeout(() => {
    if (state.completed) return;
    state.opening?.classList.add("bead-magic-active");
  }, beadMagicDelay);

  window.setTimeout(() => {
    if (state.completed) return;
    state.opening?.classList.add("collections-world-revealing");
  }, worldRevealDelay);

  window.setTimeout(typeIntroBrand, titleDelay);
  window.setTimeout(revealWorldButterflies, worldButterflyDelay);

  window.setTimeout(completeOpening, finishDelay);

  image?.addEventListener("error", () => {
    state.opening?.classList.add("image-load-failed");
  }, { once: true });
}

function showOpenedBookWithoutIntro() {
  state.completed = true;
  state.opening = document.getElementById("openingScene");
  state.opening?.classList.add("is-inside-book");
  document.body.classList.remove("intro-active");
  document.body.classList.add("book-opened", "ambient-nature-active");
}

function startIntroOncePerSession() {
  // The opening is the homepage entrance, so every fresh homepage load starts
  // with the existing cinematic sequence. The previous persisted visit count
  // made the book and its butterflies disappear after two visits.
  document.body.classList.add("first-visit-intro");
  startCinematicIntro();
}

function setupUi() {
  document.getElementById("skipOpening")?.addEventListener("click", () => {
    completeOpening();
    state.opening?.classList.add("is-skipped");
    const main = document.getElementById("chapterOne");
    main?.setAttribute("tabindex", "-1");
    main?.focus({ preventScroll: true });
    main?.scrollIntoView({ behavior: "instant", block: "start" });
  });
  const menuButton = document.getElementById("storyMenuButton");
  const nav = document.getElementById("storyNav");

  if (!menuButton || !nav) return;

  menuButton.addEventListener("click", () => {
    const isOpen = nav.classList.toggle("is-open");
    menuButton.setAttribute("aria-expanded", String(isOpen));
  });

  nav.addEventListener("click", (event) => {
    if (!event.target.closest("a")) return;
    nav.classList.remove("is-open");
    menuButton.setAttribute("aria-expanded", "false");
  });
}

setupUi();
startIntroOncePerSession();
