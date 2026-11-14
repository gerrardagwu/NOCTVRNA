/**
 * Canvas renderer for the Experience stage. Three scenes share one canvas:
 *  - sound:  a spinning vinyl with the NOCTVRNA owl on the label and a ring of bars pumping to the beat
 *  - people: a crowd silhouetted against the stage lights, bobbing on the beat, hands up near your cursor
 *  - atmos:  sweeping beams, haze and a mirror ball throwing sparkles round the room
 * A tap drops the bass, makes the crowd jump (with confetti) or fires the strobe.
 */

export type StageMode = "sound" | "people" | "atmos";

const COL = {
  lilac: "#c38bef",
  soft: "#edc1fc",
  deep: "#340857",
  green: "#55ff00",
  ink: "#f5f1e5",
};
const CONFETTI = [COL.lilac, COL.green, COL.ink, COL.soft];
const BEAT_MS = 60000 / 124; // 124 bpm

type Person = { x: number; row: number; scale: number; phase: number; hype: number; fan: boolean; jump: number; vy: number };
type Bit = { x: number; y: number; vx: number; vy: number; rot: number; vr: number; w: number; h: number; c: string; life: number };
type Ring = { r: number; life: number };
type Spark = { a: number; d: number; s: number; tw: number };

export class PartyStage {
  private ctx: CanvasRenderingContext2D;
  private W = 0;
  private H = 0;
  private mode: StageMode = "sound";
  private modeAt = 0;
  private hit = 0;
  private strobe = 0;
  private pointer = { x: 0, y: 0, on: false };
  private crowd: Person[] = [];
  private confetti: Bit[] = [];
  private rings: Ring[] = [];
  private sparks: Spark[] = [];
  private owl: HTMLImageElement;
  private last = 0;

  constructor(private canvas: HTMLCanvasElement, owlSrc: string) {
    this.ctx = canvas.getContext("2d")!;
    this.owl = new Image();
    this.owl.src = owlSrc;
    this.sparks = Array.from({ length: 70 }, () => ({
      a: Math.random() * Math.PI * 2,
      d: 0.15 + Math.random() * 0.95,
      s: 0.6 + Math.random() * 1.6,
      tw: Math.random() * Math.PI * 2,
    }));
  }

  resize(w: number, h: number) {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.W = w;
    this.H = h;
    this.canvas.width = Math.round(w * dpr);
    this.canvas.height = Math.round(h * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.buildCrowd();
  }

  setMode(mode: StageMode) {
    if (mode === this.mode) return;
    this.mode = mode;
    this.modeAt = performance.now();
  }

  move(x: number, y: number) {
    this.pointer = { x, y, on: true };
  }

  leave() {
    this.pointer.on = false;
  }

  tap(x: number, y: number) {
    this.hit = 1;
    if (this.mode === "sound") {
      this.rings.push({ r: 0, life: 1 }, { r: -40, life: 1 });
    } else if (this.mode === "people") {
      for (const p of this.crowd) {
        p.vy = -(5 + Math.random() * 5) * p.scale;
        p.hype = 1;
      }
      this.burst(x, y);
    } else {
      this.strobe = 1;
    }
  }

  draw(t: number) {
    const { ctx, W, H } = this;
    if (!W || !H) return;
    const dt = Math.min(48, t - (this.last || t)) / 16.67;
    this.last = t;
    const beat = Math.exp(-((t % BEAT_MS) / BEAT_MS) * 5);

    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = 1;
    ctx.fillStyle = "#0b0710";
    ctx.fillRect(0, 0, W, H);

    // New scene fades up like the lights coming on.
    ctx.globalAlpha = Math.min(1, (performance.now() - this.modeAt) / 500);
    if (this.mode === "sound") this.drawSound(t, beat, dt);
    else if (this.mode === "people") this.drawPeople(t, beat, dt);
    else this.drawAtmos(t, beat, dt);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";

    this.hit *= Math.pow(0.9, dt);
  }

  /* ------------------------------------------------------------------ sound */

  private drawSound(t: number, beat: number, dt: number) {
    const { ctx, W, H } = this;
    const cx = W / 2;
    const cy = H * 0.5;
    const R = Math.min(W, H) * 0.25;
    const energy = 0.5 + beat * 0.5 + this.hit * 0.8;

    const glow = ctx.createRadialGradient(cx, cy, R * 0.6, cx, cy, R * 2.6);
    glow.addColorStop(0, `rgba(195,139,239,${0.32 * energy})`);
    glow.addColorStop(1, "rgba(195,139,239,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, W, H);

    // Ring of rounded bars around the deck.
    const N = 60;
    const pAngle = Math.atan2(this.pointer.y - cy, this.pointer.x - cx);
    ctx.lineCap = "round";
    ctx.lineWidth = Math.max(3, ((Math.PI * 2 * R * 1.15) / N) * 0.52);
    for (let i = 0; i < N; i++) {
      const a = (i / N) * Math.PI * 2 - Math.PI / 2 + t * 0.00015;
      let v =
        0.2 +
        0.35 * Math.abs(Math.sin(t / 360 + i * 0.85)) * (0.6 + 0.4 * Math.sin(i * 0.31 + t / 800)) +
        beat * (i % 3 === 0 ? 0.45 : 0.3) +
        this.hit * 0.7;
      if (this.pointer.on) {
        let d = Math.abs(a - pAngle) % (Math.PI * 2);
        if (d > Math.PI) d = Math.PI * 2 - d;
        v += 0.55 * Math.exp(-((d / 0.38) ** 2));
      }
      const inner = R * 1.14;
      const len = R * (0.08 + Math.min(v, 1.4) * 0.62);
      ctx.strokeStyle = v > 0.95 ? COL.green : COL.lilac;
      ctx.globalAlpha = Math.min(1, (performance.now() - this.modeAt) / 500) * (0.55 + Math.min(v, 1) * 0.45);
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(a) * inner, cy + Math.sin(a) * inner);
      ctx.lineTo(cx + Math.cos(a) * (inner + len), cy + Math.sin(a) * (inner + len));
      ctx.stroke();
    }
    ctx.globalAlpha = Math.min(1, (performance.now() - this.modeAt) / 500);

    // Shockwave rings from taps, plus a soft one on every kick.
    if (beat > 0.97 && this.rings.length < 6) this.rings.push({ r: 0, life: 0.45 });
    for (const ring of this.rings) {
      ring.r += 7 * dt;
      ring.life -= 0.018 * dt;
      if (ring.r <= 0) continue;
      ctx.strokeStyle = `rgba(237,193,252,${Math.max(0, ring.life) * 0.7})`;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(cx, cy, R + ring.r, 0, Math.PI * 2);
      ctx.stroke();
    }
    this.rings = this.rings.filter((r) => r.life > 0);

    // The record.
    const spin = (t / 1000) * Math.PI * 2 * 0.55 * (1 + this.hit * 2);
    const pump = 1 + beat * 0.025 + this.hit * 0.05;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(pump, pump);
    ctx.fillStyle = "#08050b";
    ctx.beginPath();
    ctx.arc(0, 0, R, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.05)";
    ctx.lineWidth = 1;
    for (let r = R * 0.42; r < R * 0.97; r += 5) {
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.stroke();
    }
    // Sheen that stays put while the record turns under it.
    if ("createConicGradient" in ctx) {
      const sheen = ctx.createConicGradient(-0.6, 0, 0);
      sheen.addColorStop(0, "rgba(237,193,252,0)");
      sheen.addColorStop(0.08, "rgba(237,193,252,0.16)");
      sheen.addColorStop(0.16, "rgba(237,193,252,0)");
      sheen.addColorStop(0.5, "rgba(237,193,252,0)");
      sheen.addColorStop(0.58, "rgba(237,193,252,0.12)");
      sheen.addColorStop(0.66, "rgba(237,193,252,0)");
      ctx.fillStyle = sheen;
      ctx.beginPath();
      ctx.arc(0, 0, R, 0, Math.PI * 2);
      ctx.fill();
    }
    // Label: the owl, turning with the record.
    ctx.rotate(spin);
    const lr = R * 0.38;
    ctx.save();
    ctx.beginPath();
    ctx.arc(0, 0, lr, 0, Math.PI * 2);
    ctx.clip();
    ctx.fillStyle = COL.deep;
    ctx.fillRect(-lr, -lr, lr * 2, lr * 2);
    if (this.owl.complete && this.owl.naturalWidth) ctx.drawImage(this.owl, -lr, -lr, lr * 2, lr * 2);
    ctx.restore();
    ctx.strokeStyle = COL.lilac;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, lr, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = COL.ink;
    ctx.beginPath();
    ctx.arc(0, 0, Math.max(3, R * 0.03), 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  /* ----------------------------------------------------------------- people */

  private buildCrowd() {
    const { W } = this;
    const size = Math.min(1.35, Math.max(0.7, W / 640));
    this.crowd = [];
    for (let row = 0; row < 4; row++) {
      const scale = (0.55 + row * 0.2) * size;
      const gap = 38 * scale;
      for (let x = -gap * 0.5 + (row % 2) * gap * 0.5; x < W + gap; x += gap * (0.8 + Math.random() * 0.35)) {
        this.crowd.push({ x, row, scale, phase: Math.random() * Math.PI * 2, hype: 0, fan: Math.random() < 0.14, jump: 0, vy: 0 });
      }
    }
  }

  private burst(x: number, y: number) {
    for (let i = 0; i < 90; i++) {
      const a = -Math.PI / 2 + (Math.random() - 0.5) * 2.2;
      const v = 6 + Math.random() * 9;
      this.confetti.push({
        x,
        y,
        vx: Math.cos(a) * v,
        vy: Math.sin(a) * v,
        rot: Math.random() * Math.PI,
        vr: (Math.random() - 0.5) * 0.4,
        w: 6 + Math.random() * 6,
        h: 3 + Math.random() * 4,
        c: CONFETTI[i % CONFETTI.length],
        life: 1,
      });
    }
    if (this.confetti.length > 360) this.confetti.splice(0, this.confetti.length - 360);
  }

  private drawPeople(t: number, beat: number, dt: number) {
    const { ctx, W, H } = this;
    const alpha = ctx.globalAlpha;

    // Stage wash and swinging cones of light.
    const wash = ctx.createRadialGradient(W / 2, -H * 0.1, 0, W / 2, -H * 0.1, H * 1.1);
    wash.addColorStop(0, `rgba(195,139,239,${0.45 + beat * 0.15})`);
    wash.addColorStop(0.55, "rgba(52,8,87,0.35)");
    wash.addColorStop(1, "rgba(11,7,16,0)");
    ctx.fillStyle = wash;
    ctx.fillRect(0, 0, W, H);

    ctx.globalCompositeOperation = "lighter";
    for (let i = 0; i < 4; i++) {
      const ox = W * (0.15 + i * 0.23);
      const ang = Math.PI / 2 + Math.sin(t / (1500 + i * 300) + i * 1.7) * 0.5;
      const len = H * 1.3;
      const sp = 0.16;
      const g = ctx.createLinearGradient(ox, 0, ox + Math.cos(ang) * len, Math.sin(ang) * len);
      const c = i % 2 ? "85,255,0" : "237,193,252";
      g.addColorStop(0, `rgba(${c},${0.28 + beat * 0.12})`);
      g.addColorStop(1, `rgba(${c},0)`);
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(ox, -10);
      ctx.lineTo(ox + Math.cos(ang - sp) * len, Math.sin(ang - sp) * len);
      ctx.lineTo(ox + Math.cos(ang + sp) * len, Math.sin(ang + sp) * len);
      ctx.closePath();
      ctx.fill();
    }
    // Par cans along the top.
    for (let i = 0; i < 7; i++) {
      const x = W * ((i + 0.5) / 7);
      const on = 0.5 + 0.5 * Math.sin(t / 300 + i * 1.3);
      const g = ctx.createRadialGradient(x, 14, 0, x, 14, 26);
      g.addColorStop(0, `rgba(${i % 2 ? "85,255,0" : "237,193,252"},${0.5 + on * 0.5})`);
      g.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = g;
      ctx.fillRect(x - 26, 0, 52, 40);
    }
    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = alpha;

    // The crowd, back rows first.
    const shades = ["#2a1442", "#1d0d30", "#130820", "#0a0510"];
    const step = (t / BEAT_MS) * Math.PI;
    for (const p of this.crowd) {
      if (this.pointer.on && Math.abs(p.x - this.pointer.x) < 110 * p.scale) p.hype = Math.min(1, p.hype + 0.15 * dt);
      p.hype = Math.max(0, p.hype - 0.006 * dt);
      p.vy += 0.6 * p.scale * dt;
      p.jump = Math.min(0, p.jump + p.vy * dt);
      if (p.jump === 0) p.vy = 0;

      const s = p.scale;
      const base = H * (0.66 + p.row * 0.1);
      const bob = -Math.abs(Math.sin(step + p.phase * 0.3)) * (4 + beat * 5) * s;
      const y = base + bob + p.jump;
      const handsUp = p.fan || p.hype > 0.35;

      ctx.fillStyle = shades[p.row];
      ctx.strokeStyle = shades[p.row];
      if (handsUp) {
        const wave = Math.sin(t / 220 + p.phase) * 5 * s;
        ctx.lineWidth = 6 * s;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(p.x - 11 * s, y - 30 * s);
        ctx.lineTo(p.x - 17 * s + wave, y - 68 * s);
        ctx.moveTo(p.x + 11 * s, y - 30 * s);
        ctx.lineTo(p.x + 17 * s + wave, y - 68 * s);
        ctx.stroke();
      }
      ctx.beginPath();
      ctx.roundRect(p.x - 17 * s, y - 34 * s, 34 * s, H, [16 * s, 16 * s, 0, 0]);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(p.x, y - 46 * s, 10.5 * s, 0, Math.PI * 2);
      ctx.fill();
      // Rim light from the stage.
      ctx.strokeStyle = `rgba(237,193,252,${0.18 + p.row * 0.04})`;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(p.x, y - 46 * s, 10.5 * s, Math.PI * 1.1, Math.PI * 1.9);
      ctx.stroke();
    }

    // Confetti.
    for (const b of this.confetti) {
      b.vy += 0.28 * dt;
      b.vx *= Math.pow(0.985, dt);
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.rot += b.vr * dt;
      b.life -= 0.006 * dt;
      ctx.save();
      ctx.globalAlpha = alpha * Math.max(0, Math.min(1, b.life * 2));
      ctx.translate(b.x, b.y);
      ctx.rotate(b.rot);
      ctx.fillStyle = b.c;
      ctx.beginPath();
      ctx.roundRect(-b.w / 2, -b.h / 2, b.w, b.h, 2);
      ctx.fill();
      ctx.restore();
    }
    this.confetti = this.confetti.filter((b) => b.life > 0 && b.y < H + 40);
  }

  /* ------------------------------------------------------------------ atmos */

  private drawAtmos(t: number, beat: number, dt: number) {
    const { ctx, W, H } = this;
    const alpha = ctx.globalAlpha;
    const ballX = this.pointer.on ? W * 0.15 + this.pointer.x * 0.7 : W / 2;
    const ballY = H * 0.13;
    const ballR = Math.min(W, H) * 0.07;

    ctx.globalCompositeOperation = "lighter";
    // Beams from the rig.
    for (let i = 0; i < 6; i++) {
      const ox = W * (0.1 + i * 0.16);
      const ang = Math.PI / 2 + Math.sin(t / (1700 + i * 350) + i * 1.2) * 0.8;
      const len = H * 1.6;
      const sp = 0.05 + 0.025 * Math.sin(t / 800 + i) + this.strobe * 0.05;
      const g = ctx.createLinearGradient(ox, 0, ox + Math.cos(ang) * len, Math.sin(ang) * len);
      const c = i % 2 ? "85,255,0" : "195,139,239";
      g.addColorStop(0, `rgba(${c},${0.55 + beat * 0.2})`);
      g.addColorStop(1, `rgba(${c},0)`);
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(ox, -10);
      ctx.lineTo(ox + Math.cos(ang - sp) * len, Math.sin(ang - sp) * len);
      ctx.lineTo(ox + Math.cos(ang + sp) * len, Math.sin(ang + sp) * len);
      ctx.closePath();
      ctx.fill();
    }
    // Haze rolling across the floor.
    for (let i = 0; i < 7; i++) {
      const x = ((t / (24 + i * 7) + i * 170) % (W + 400)) - 200;
      const y = H * (0.6 + 0.08 * Math.sin(t / 2000 + i));
      const g = ctx.createRadialGradient(x, y, 0, x, y, 200);
      g.addColorStop(0, "rgba(195,139,239,0.13)");
      g.addColorStop(1, "rgba(195,139,239,0)");
      ctx.fillStyle = g;
      ctx.fillRect(x - 200, y - 200, 400, 400);
    }
    // Sparkles thrown by the mirror ball, wheeling round the room.
    const rot = t * 0.00022;
    for (const sp of this.sparks) {
      const a = sp.a + rot;
      const x = ballX + Math.cos(a) * sp.d * W * 0.75;
      const y = ballY + Math.abs(Math.sin(a)) * sp.d * H * 0.95;
      const tw = 0.4 + 0.6 * Math.abs(Math.sin(t / 400 + sp.tw));
      this.star(x, y, sp.s * 3.2 * tw, `rgba(245,241,229,${0.35 + tw * 0.55})`);
    }
    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = alpha;

    // The mirror ball.
    ctx.save();
    ctx.beginPath();
    ctx.arc(ballX, ballY, ballR, 0, Math.PI * 2);
    ctx.clip();
    ctx.fillStyle = "#2a1f33";
    ctx.fillRect(ballX - ballR, ballY - ballR, ballR * 2, ballR * 2);
    const tile = Math.max(4, ballR / 4.5);
    const shift = (t * 0.01) % tile;
    for (let gx = -ballR - tile; gx < ballR + tile; gx += tile) {
      for (let gy = -ballR; gy < ballR; gy += tile) {
        const v = 0.5 + 0.5 * Math.sin((gx + gy) * 0.3 + t / 260 + gx * gy * 0.01);
        ctx.fillStyle = `rgba(${v > 0.85 ? "245,241,229" : "195,139,239"},${0.25 + v * 0.6})`;
        ctx.fillRect(ballX + gx + shift + 0.5, ballY + gy + 0.5, tile - 1.5, tile - 1.5);
      }
    }
    ctx.restore();
    ctx.strokeStyle = "rgba(245,241,229,0.4)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(ballX, 0);
    ctx.lineTo(ballX, ballY - ballR);
    ctx.stroke();

    if (this.strobe > 0.01) {
      ctx.fillStyle = `rgba(245,241,229,${this.strobe * 0.85})`;
      ctx.fillRect(0, 0, W, H);
      this.strobe *= Math.pow(0.82, dt);
    }
  }

  private star(x: number, y: number, r: number, c: string) {
    const { ctx } = this;
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.moveTo(x, y - r * 2);
    ctx.quadraticCurveTo(x, y, x + r * 2, y);
    ctx.quadraticCurveTo(x, y, x, y + r * 2);
    ctx.quadraticCurveTo(x, y, x - r * 2, y);
    ctx.quadraticCurveTo(x, y, x, y - r * 2);
    ctx.fill();
  }
}
