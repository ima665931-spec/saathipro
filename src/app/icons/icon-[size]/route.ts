import { NextResponse } from "next/server";

export const runtime = "nodejs";

/** Minimal solid PNG (violet) — valid for PWA install prompts */
function solidPng(size: number): Buffer {
  // Precomputed tiny PNGs are awkward; build uncompressed truecolor RGBA
  const { deflateSync } = require("zlib") as typeof import("zlib");

  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  function chunk(type: string, data: Buffer) {
    const typeB = Buffer.from(type, "ascii");
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const crc = Buffer.alloc(4);
    const crcVal = crc32(Buffer.concat([typeB, data]));
    crc.writeUInt32BE(crcVal >>> 0, 0);
    return Buffer.concat([len, typeB, data, crc]);
  }
  function crc32(buf: Buffer) {
    let c = ~0;
    for (let i = 0; i < buf.length; i++) {
      c ^= buf[i];
      for (let k = 0; k < 8; k++) c = c & 1 ? (0xedb88320 ^ (c >>> 1)) : c >>> 1;
    }
    return ~c;
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const stride = 1 + size * 4;
  const raw = Buffer.alloc(stride * size);
  const R = 124, G = 58, B = 237, A = 255;
  for (let y = 0; y < size; y++) {
    const row = y * stride;
    raw[row] = 0;
    for (let x = 0; x < size; x++) {
      const i = row + 1 + x * 4;
      raw[i] = R;
      raw[i + 1] = G;
      raw[i + 2] = B;
      raw[i + 3] = A;
    }
  }
  const idat = deflateSync(raw);
  return Buffer.concat([
    signature,
    chunk("IHDR", ihdr),
    chunk("IDAT", idat),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ size: string }> }
) {
  const { size: sizeStr } = await ctx.params;
  const n = Number(sizeStr);
  const size = n === 512 ? 512 : 192;
  const body = solidPng(size);
  return new NextResponse(body, {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=86400, immutable",
    },
  });
}
