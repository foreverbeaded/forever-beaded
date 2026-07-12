const state = {
  opening: null,
  introStartedAt: 0,
  bookOpeningAt: 0,
  completed: false,
  exclusiveStarted: false,
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
  const cream = [1.0 * light, 0.93 * light, 0.78 * light, 0.74];
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

  const spotY = [.32, .2, .08, -.08, -.22, -.32];
  spotY.forEach((y, index) => {
    const x = index < 3 ? .58 : .51;
    const size = index === 5 ? .014 : .019;
    addQuad(
      vertices,
      wingPoint(side, x - size, y - size, .11, flap, yaw, scale, origin),
      wingPoint(side, x + size, y - size, .11, flap, yaw, scale, origin),
      wingPoint(side, x + size, y + size, .11, flap, yaw, scale, origin),
      wingPoint(side, x - size, y + size, .11, flap, yaw, scale, origin),
      cream
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

  const p = clamp((openingElapsed - (butterfly.index * .14)) / 8.4, 0, 1);
  const fromCurrent = getButterflyPosition(butterfly, time, arrivalLength, false);
  if (!fromCurrent.visible) {
    return { x: 0, y: 0, z: 0, scale: 0, visible: false };
  }
  const liftStart = [fromCurrent.x, fromCurrent.y, fromCurrent.z];
  const liftMidA = [
    liftStart[0] + (Math.sin(butterfly.index) * .8),
    liftStart[1] + 1.2 + (butterfly.index * .06),
    liftStart[2] + .72
  ];
  const liftMidB = [
    mix(liftStart[0], exit[0], .45),
    2.6 + (Math.sin(butterfly.index * 1.7) * .5),
    1.65 + (Math.cos(butterfly.index) * .28)
  ];
  const lifted = cubic3(liftStart, liftMidA, liftMidB, exit, easeInOut(p));
  const panic = Math.sin((openingElapsed * (2.2 + butterfly.index * .22)) + butterfly.index);
  return {
    x: lifted[0] + (Math.sin(p * Math.PI * 5 + butterfly.index) * .42) + (panic * .18),
    y: lifted[1] + (Math.sin(p * Math.PI) * .85) + (Math.abs(panic) * .18),
    z: lifted[2] + (Math.sin(p * Math.PI * 2 + butterfly.index) * .32) + (Math.cos(openingElapsed * 1.7) * .16),
    scale: mix(fromCurrent.scale || .78, 1.04, Math.sin(p * Math.PI)),
    resting: false,
    close: lifted[2] > 1.25,
    bank: panic * .34,
    wingPhase: (openingElapsed * (4.2 + butterfly.index * .18)) + butterfly.index,
    visible: p < .98
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
  state.opening?.classList.add("is-inside-book");
  document.body.classList.remove("intro-active");
  document.body.classList.add("book-opened");
  window.setTimeout(() => {
    document.getElementById("chapterOne")?.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
    window.setTimeout(startExclusiveDiscovery, 1800);
    window.setTimeout(() => {
      document.body.classList.add("ambient-nature-active");
    }, 2300);
  }, 420);
}

function startExclusiveDiscovery() {
  if (state.exclusiveStarted) return;
  const feature = document.querySelector(".hero-feature");
  if (!feature) return;

  state.exclusiveStarted = true;
  const butterfly = document.createElement("span");
  butterfly.className = "exclusive-discovery-butterfly";
  document.body.appendChild(butterfly);

  const start = { x: -70, y: window.innerHeight * .62 };
  const targetRect = feature.getBoundingClientRect();
  const end = {
    x: targetRect.left + (targetRect.width * .52),
    y: targetRect.top + (targetRect.height * .36)
  };
  const c1 = { x: window.innerWidth * .25, y: window.innerHeight * .2 };
  const c2 = { x: window.innerWidth * .72, y: window.innerHeight * .74 };
  const started = performance.now();
  const duration = 5200;

  function point(a, b, c, d, t) {
    const mt = 1 - t;
    return {
      x: (mt * mt * mt * a.x) + (3 * mt * mt * t * b.x) + (3 * mt * t * t * c.x) + (t * t * t * d.x),
      y: (mt * mt * mt * a.y) + (3 * mt * mt * t * b.y) + (3 * mt * t * t * c.y) + (t * t * t * d.y)
    };
  }

  function animate(now) {
    const raw = clamp((now - started) / duration, 0, 1);
    const t = easeInOut(raw);
    const pos = point(start, c1, c2, end, t);
    const bob = Math.sin(raw * Math.PI * 8) * 18;
    const bank = Math.sin(raw * Math.PI * 5) * 18;

    butterfly.style.opacity = String(raw < .08 ? raw / .08 : raw > .92 ? (1 - raw) / .08 : 1);
    butterfly.style.transform = `translate(${pos.x}px, ${pos.y + bob}px) translate(-50%, -50%) rotate(${bank}deg) scale(${.78 + Math.sin(raw * Math.PI) * .22})`;

    if (raw >= .78) {
      feature.classList.add("treasure-found");
    }

    if (raw < 1) {
      window.requestAnimationFrame(animate);
    } else {
      butterfly.remove();
    }
  }

  window.requestAnimationFrame(animate);
}

function startCinematicIntro() {
  state.opening = document.getElementById("openingScene");
  const image = document.querySelector(".intro-book-image");
  state.introStartedAt = performance.now();
  state.audio = setupIntroAudio();

  document.body.classList.add("cinematic-intro-ready");
  state.opening?.classList.add("cinematic-book-visible");
  state.butterflyScene = setupButterflyScene();

  const openingDelay = 12800;
  const revealDelay = 18800;
  const finishDelay = 22000;

  window.setTimeout(() => {
    state.bookOpeningAt = performance.now();
    state.opening?.classList.add("intro-opening");
  }, openingDelay);

  window.setTimeout(() => {
    if (state.completed) return;
    state.opening?.classList.add("is-entering-pages");
  }, revealDelay);

  window.setTimeout(completeOpening, finishDelay);

  image?.addEventListener("error", () => {
    state.opening?.classList.add("image-load-failed");
  }, { once: true });
}

function setupUi() {
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
startCinematicIntro();
