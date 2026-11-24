// Collisioni semplici sul piano: lo studente non attraversa muri, veicoli, persone e oggetti.
export class Colliders {
  constructor() { this.boxes = []; this.circles = []; this.dyn = []; }
  // rettangolo con centro, dimensioni e rotazione (radianti attorno a Y)
  box(x, z, w, d, rot = 0) { this.boxes.push({ x, z, hw: w / 2, hd: d / 2, c: Math.cos(rot), s: Math.sin(rot) }); return this; }
  circle(x, z, r) { this.circles.push({ x, z, r }); return this; }
  // oggetti che si muovono: usa la posizione mondo di obj ad ogni controllo
  follow(obj, r, box) { this.dyn.push({ obj, r, box }); return this; }
  resolve(p, r = 0.25) {
    for (let it = 0; it < 3; it++) {
      for (const b of this.boxes) pushBox(p, r, b.x, b.z, b.hw, b.hd, b.c, b.s);
      for (const c of this.circles) pushCircle(p, r, c.x, c.z, c.r);
      for (const d of this.dyn) {
        if (!d.obj.visible && d.obj.visible !== undefined) continue;
        const o = d.obj.position;
        if (d.box) { const rot = d.obj.rotation.y; pushBox(p, r, o.x, o.z, d.box[0] / 2, d.box[1] / 2, Math.cos(rot), Math.sin(rot)); }
        else pushCircle(p, r, o.x, o.z, d.r);
      }
    }
    return p;
  }
}

function pushCircle(p, r, x, z, R) {
  const dx = p.x - x, dz = p.z - z, d = Math.hypot(dx, dz), m = R + r;
  if (d < m) { if (d < 1e-5) { p.x += m; return; } p.x = x + (dx / d) * m; p.z = z + (dz / d) * m; }
}

function pushBox(p, r, x, z, hw, hd, c, s) {
  // coordinate locali del rettangolo
  const dx = p.x - x, dz = p.z - z;
  let lx = dx * c - dz * s, lz = dx * s + dz * c;
  const qx = Math.max(-hw, Math.min(hw, lx)), qz = Math.max(-hd, Math.min(hd, lz));
  let ox = lx - qx, oz = lz - qz, d = Math.hypot(ox, oz);
  if (d >= r) return;
  if (d < 1e-5) {
    // dentro: esce dal lato più vicino
    const ex = hw - Math.abs(lx), ez = hd - Math.abs(lz);
    if (ex < ez) lx = Math.sign(lx || 1) * (hw + r); else lz = Math.sign(lz || 1) * (hd + r);
  } else { lx = qx + (ox / d) * r; lz = qz + (oz / d) * r; }
  p.x = x + lx * c + lz * s; p.z = z - lx * s + lz * c;
}
