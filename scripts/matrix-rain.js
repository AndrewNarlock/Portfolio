// 3D digital rain behind the home page hero ------------------------------------
// Columns of glyphs hang in a 3D volume in front of the camera. A bright "head"
// sweeps down each column and the glyphs it passes fade out behind it, while the
// camera flies in, settles into a slow drift and turns toward the pointer. The
// pointer also lights up nearby glyphs, and a click sends out a pulse.
//
// All per-glyph work happens in the vertex shader, so each frame the CPU only
// updates a handful of uniforms. Without WebGL the hero keeps its CSS background;
// with reduced motion on, a single still frame is drawn; and the loop pauses
// while the hero is off-screen.

(function () {
    const canvas = document.querySelector('.hero-canvas');
    if (!canvas) return;
    const hero = canvas.closest('.hero') || canvas.parentElement;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

    // Scene layout, in world units. The camera sits at the origin looking down -z.
    const FOV = (60 * Math.PI) / 180;
    const NEAR = 1;            // glyphs closer than this are never drawn
    const DEPTH = 36;          // how far the volume reaches beyond NEAR
    const SPACING = 0.62;      // vertical gap between glyph slots in a column
    const GLYPH = 0.56;        // glyph size
    const COLUMNS_PER_UNIT = 14;
    const MAX_COLUMNS = 800;
    const CRUISE = 0.9;        // forward drift once the fly-in is over (units/s)
    const MAX_DPR = 1.75;

    const TAN = Math.tan(FOV / 2);
    const HALF_Y = (NEAR + DEPTH) * TAN * 1.15;
    const SLOTS = Math.ceil((HALF_Y * 2) / SPACING);

    // Glyph atlas: GRID x GRID cells of CELL pixels
    const GRID = 8;
    const CELL = 64;
    const FONT = '"MS Gothic", "Osaka-Mono", "Hiragino Kaku Gothic ProN", "Noto Sans Mono CJK JP", monospace';

    const gl = canvas.getContext('webgl', {
        alpha: false,
        antialias: false,
        depth: false,
        powerPreference: 'high-performance',
    });
    if (!gl) return;

    const f = (n) => n.toFixed(4); // numbers -> GLSL float literals

    const VERTEX_SHADER = `
attribute vec4 aColumn; // x seed, depth offset, fall speed (slots/s), phase
attribute vec4 aSlot;   // slot index, trail length, cycle length, glyph seed

uniform float uTime;
uniform float uTravel;  // how far the camera has flown
uniform float uFade;    // fades the whole scene in on load
uniform mat3 uRot;      // camera turn
uniform float uFocal;   // 1 / tan(fov / 2)
uniform float uAspect;
uniform float uPixelFocal;
uniform float uMaxPoint;
uniform float uHalfX;
uniform vec3 uMouse;    // ndc x, ndc y, strength
uniform vec3 uPulse;    // ndc x, ndc y, age in seconds (negative = none)

varying vec3 vColor;
varying float vAlpha;
varying vec2 vCell;

float hash(float p) {
    p = fract(p * 0.1031);
    p *= p + 33.33;
    p *= p + p;
    return fract(p);
}

void main() {
    // Depth wraps: a column that flies past the camera reappears at the back
    // of the volume, at a new x position each lap.
    float z = aColumn.y - uTravel;
    float lap = floor(z / ${f(DEPTH)});
    float depth = ${f(NEAR)} + z - lap * ${f(DEPTH)};
    float x = (hash(aColumn.x * 7919.0 + lap * 13.17) * 2.0 - 1.0) * uHalfX;
    float y = ${f(HALF_Y)} - aSlot.x * ${f(SPACING)};

    vec3 p = uRot * vec3(x, y, -depth);
    float w = -p.z;
    if (w < 0.2) {
        gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
        gl_PointSize = 0.0;
        vColor = vec3(0.0);
        vAlpha = 0.0;
        vCell = vec2(0.0);
        return;
    }
    gl_Position = vec4(p.x * uFocal / uAspect, p.y * uFocal, 0.0, w);
    vec2 ndc = gl_Position.xy / w;

    // How many slots ago the head passed this one: 0 is the head itself,
    // anything under the trail length is still glowing.
    float run = uTime * aColumn.z + aColumn.w;
    float since = mod(floor(run) - aSlot.x, aSlot.z);
    float lit = since < aSlot.y ? pow(1.0 - since / aSlot.y, 1.6) : 0.0;
    float head = step(since, 0.5);

    // Each glyph changes at its own pace; heads change fastest.
    float rate = 0.25 + hash(aSlot.w * 71.0) * 2.0 + head * 10.0;
    float pick = hash(aSlot.w * 131.0 + floor(uTime * rate + aSlot.w * 17.0));
    float g = floor(pick * ${f(GRID * GRID)});
    vCell = vec2(mod(g, ${f(GRID)}), floor(g / ${f(GRID)}));

    // Pointer light and click pulse, measured on screen. They also reveal the
    // unlit glyphs hiding between the trails.
    vec2 screen = vec2(uAspect, 1.0);
    float spot = uMouse.z * (1.0 - smoothstep(0.0, 0.5, length((ndc - uMouse.xy) * screen)));
    float ring = 0.0;
    if (uPulse.z >= 0.0) {
        float edge = (length((ndc - uPulse.xy) * screen) - uPulse.z * 1.8) * 8.0;
        ring = exp(-edge * edge) * (1.0 - smoothstep(0.4, 1.4, uPulse.z));
    }

    // Fade in from the far end of the volume, and out just before the camera.
    float fog = smoothstep(${f(NEAR)}, ${f(NEAR + 4)}, depth)
        * (1.0 - smoothstep(${f(DEPTH * 0.3)}, ${f(NEAR + DEPTH)}, depth));

    vAlpha = min(lit + head * 0.5 + spot * 0.75 + ring * 0.9, 1.5) * fog * uFade;
    vec3 trail = mix(vec3(0.03, 0.5, 0.2), vec3(0.3, 1.0, 0.55), lit);
    vColor = mix(trail, vec3(0.85, 1.0, 0.9), head);
    gl_PointSize = vAlpha > 0.004 ? min(${f(GLYPH)} * uPixelFocal / w, uMaxPoint) : 0.0;
}`;

    const FRAGMENT_SHADER = `
precision mediump float;
uniform sampler2D uAtlas;
varying vec3 vColor;
varying float vAlpha;
varying vec2 vCell;

void main() {
    float a = texture2D(uAtlas, (vCell + gl_PointCoord) / ${f(GRID)}).a * vAlpha;
    gl_FragColor = vec4(vColor * a, 1.0);
}`;

    // ----- Glyph atlas -----

    // Draw a character small and return its pixels, to check the font has it.
    const probe = (ch) => {
        const c = document.createElement('canvas');
        c.width = c.height = 32;
        const ctx = c.getContext('2d');
        ctx.font = `28px ${FONT}`;
        ctx.fillText(ch, 2, 26);
        return ctx.getImageData(0, 0, 32, 32).data.join(',');
    };

    function buildAtlas() {
        // Half-width katakana (mirrored, as in the films), digits and symbols.
        // If the system has no katakana font, two different katakana draw the
        // same missing-glyph box, so fall back to Latin characters instead.
        const kana = 'ｦｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾜ';
        const hasKana = probe('ｱ') !== probe('ﾈ');
        const chars = Array.from(hasKana
            ? kana + '0123456789Z:.=*+-<>|'
            : '0123456789ABCDEFHKLMNPRTXZ:.=*+-<>|#$%&@');

        const atlas = document.createElement('canvas');
        atlas.width = atlas.height = GRID * CELL;
        const ctx = atlas.getContext('2d');
        ctx.font = `${Math.round(CELL * 0.72)}px ${FONT}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#fff';
        ctx.shadowColor = '#fff';

        for (let i = 0; i < GRID * GRID; i++) {
            const ch = chars[i % chars.length];
            ctx.save();
            ctx.translate((i % GRID) * CELL + CELL / 2, Math.floor(i / GRID) * CELL + CELL / 2);
            if (ch.charCodeAt(0) >= 0xff66) ctx.scale(-1, 1);
            // A blurred pass for the glow, then a crisp pass on top
            ctx.shadowBlur = 12;
            ctx.fillText(ch, 0, 0);
            ctx.shadowBlur = 0;
            ctx.fillText(ch, 0, 0);
            ctx.restore();
        }
        return atlas;
    }

    // ----- Columns -----

    // Small seeded random generator, so a resize keeps the same columns.
    function seeded(seed) {
        return () => {
            seed = (seed + 0x6d2b79f5) | 0;
            let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
            t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
            return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
        };
    }

    // One vertex per glyph slot: 8 floats (aColumn + aSlot).
    function buildColumns(count) {
        const rand = seeded(490);
        const data = new Float32Array(count * SLOTS * 8);
        let o = 0;
        for (let c = 0; c < count; c++) {
            const seedX = rand();
            const z0 = rand() * DEPTH;
            const speed = 5 + rand() * 13;
            const trail = 6 + Math.floor(rand() * 22);
            const cycle = trail + 8 + Math.floor(rand() * 50);
            const phase = rand() * cycle;
            for (let k = 0; k < SLOTS; k++) {
                data[o++] = seedX;
                data[o++] = z0;
                data[o++] = speed;
                data[o++] = phase;
                data[o++] = k;
                data[o++] = trail;
                data[o++] = cycle;
                data[o++] = rand();
            }
        }
        return data;
    }

    // ----- WebGL setup -----

    let program, buffer, uniforms, maxPoint;
    let columns = 0;
    let aspect = 1;
    let halfX = 1;

    function compile(type, source) {
        const shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            throw new Error(gl.getShaderInfoLog(shader));
        }
        return shader;
    }

    function setup() {
        program = gl.createProgram();
        gl.attachShader(program, compile(gl.VERTEX_SHADER, VERTEX_SHADER));
        gl.attachShader(program, compile(gl.FRAGMENT_SHADER, FRAGMENT_SHADER));
        gl.linkProgram(program);
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            throw new Error(gl.getProgramInfoLog(program));
        }
        gl.useProgram(program);

        uniforms = {};
        ['uTime', 'uTravel', 'uFade', 'uRot', 'uFocal', 'uAspect', 'uPixelFocal', 'uMaxPoint',
            'uHalfX', 'uMouse', 'uPulse', 'uAtlas'].forEach((name) => {
            uniforms[name] = gl.getUniformLocation(program, name);
        });

        buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        const aColumn = gl.getAttribLocation(program, 'aColumn');
        const aSlot = gl.getAttribLocation(program, 'aSlot');
        gl.enableVertexAttribArray(aColumn);
        gl.enableVertexAttribArray(aSlot);
        gl.vertexAttribPointer(aColumn, 4, gl.FLOAT, false, 32, 0);
        gl.vertexAttribPointer(aSlot, 4, gl.FLOAT, false, 32, 16);

        const texture = gl.createTexture();
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, buildAtlas());
        gl.generateMipmap(gl.TEXTURE_2D);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.uniform1i(uniforms.uAtlas, 0);

        // Additive blending: overlapping glyphs glow brighter
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.ONE, gl.ONE);
        gl.clearColor(0.008, 0.016, 0.012, 1);

        maxPoint = gl.getParameter(gl.ALIASED_POINT_SIZE_RANGE)[1];
        columns = 0;
    }

    function resize() {
        const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
        const width = Math.max(1, Math.round(canvas.clientWidth * dpr));
        const height = Math.max(1, Math.round(canvas.clientHeight * dpr));
        if (canvas.width !== width || canvas.height !== height) {
            canvas.width = width;
            canvas.height = height;
        }
        gl.viewport(0, 0, width, height);
        aspect = width / height;

        // Wide enough to fill the screen at the back of the volume, plus a
        // margin for the camera turning.
        halfX = (NEAR + DEPTH) * TAN * aspect * 1.15;
        const count = Math.min(MAX_COLUMNS, Math.round(halfX * COLUMNS_PER_UNIT));
        if (count !== columns) {
            columns = count;
            gl.bufferData(gl.ARRAY_BUFFER, buildColumns(count), gl.STATIC_DRAW);
        }
    }

    // ----- State and drawing -----

    let time = 0;
    let travel = 0;
    let yaw = 0;
    let pitch = 0;
    let target = { yaw: 0, pitch: 0, light: 0 };
    let mouse = { x: 0, y: 0, light: 0 };
    let pulse = null;

    function draw() {
        const cy = Math.cos(yaw), sy = Math.sin(yaw);
        const cx = Math.cos(pitch), sx = Math.sin(pitch);

        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.uniform1f(uniforms.uTime, time);
        gl.uniform1f(uniforms.uTravel, travel);
        gl.uniform1f(uniforms.uFade, reduceMotion ? 1 : Math.min(1, time / 1.2));
        // Pitch * yaw, column-major
        gl.uniformMatrix3fv(uniforms.uRot, false, [
            cy, sx * sy, -cx * sy,
            0, cx, sx,
            sy, -sx * cy, cx * cy,
        ]);
        gl.uniform1f(uniforms.uFocal, 1 / TAN);
        gl.uniform1f(uniforms.uAspect, aspect);
        gl.uniform1f(uniforms.uPixelFocal, canvas.height / 2 / TAN);
        gl.uniform1f(uniforms.uMaxPoint, maxPoint);
        gl.uniform1f(uniforms.uHalfX, halfX);
        gl.uniform3f(uniforms.uMouse, mouse.x, mouse.y, mouse.light);
        const age = pulse ? time - pulse.start : -1;
        if (age > 1.6) pulse = null;
        gl.uniform3f(uniforms.uPulse, pulse ? pulse.x : 0, pulse ? pulse.y : 0, pulse ? age : -1);
        gl.drawArrays(gl.POINTS, 0, columns * SLOTS);
    }

    let raf = 0;
    let last = 0;
    let running = false;

    function frame(now) {
        raf = requestAnimationFrame(frame);
        // Clamp the step so a backgrounded tab does not jump ahead on return
        const dt = last ? Math.min((now - last) / 1000, 0.1) : 0;
        last = now;
        time += dt;

        // Fly in fast, then ease down to a slow cruise
        travel += dt * (CRUISE + 26 * Math.exp(-time * 1.4));

        // Ease the camera toward the pointer, with a gentle sway on top
        const ease = 1 - Math.exp(-dt * 3);
        yaw += (target.yaw + Math.sin(time * 0.11) * 0.05 - yaw) * ease;
        pitch += (target.pitch + Math.sin(time * 0.083) * 0.025 - pitch) * ease;
        mouse.light += (target.light - mouse.light) * ease;

        draw();
    }

    function start() {
        if (running || reduceMotion) return;
        running = true;
        last = 0;
        raf = requestAnimationFrame(frame);
    }

    function stop() {
        running = false;
        cancelAnimationFrame(raf);
    }

    // ----- Init -----

    try {
        setup();
        resize();
    } catch (err) {
        console.warn('Digital rain disabled:', err);
        return;
    }

    if (reduceMotion) {
        // One still frame, mid-rain
        time = 9;
        travel = 4;
        draw();
    }

    new ResizeObserver(() => {
        resize();
        if (!running) draw();
    }).observe(canvas);

    // Only animate while the hero is on screen
    new IntersectionObserver(([entry]) => {
        if (entry.isIntersecting) start();
        else stop();
    }).observe(hero);

    canvas.addEventListener('webglcontextlost', (e) => {
        e.preventDefault();
        stop();
    });
    canvas.addEventListener('webglcontextrestored', () => {
        setup();
        resize();
        if (reduceMotion) draw();
        else start();
    });

    if (reduceMotion) return;

    const toNdc = (e) => {
        const r = canvas.getBoundingClientRect();
        return {
            x: ((e.clientX - r.left) / r.width) * 2 - 1,
            y: 1 - ((e.clientY - r.top) / r.height) * 2,
        };
    };

    if (finePointer) {
        hero.addEventListener('pointermove', (e) => {
            const p = toNdc(e);
            mouse.x = p.x;
            mouse.y = p.y;
            target = { yaw: p.x * 0.12, pitch: -p.y * 0.06, light: 1 };
        });
        hero.addEventListener('pointerleave', () => {
            target = { yaw: 0, pitch: 0, light: 0 };
        });
    }

    // Click or tap on empty space sends a pulse through the rain
    hero.addEventListener('pointerdown', (e) => {
        if (e.target.closest('a, button')) return;
        const p = toNdc(e);
        pulse = { x: p.x, y: p.y, start: time };
    });
})();
