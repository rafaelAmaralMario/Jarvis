"""Generate JARVIS app icon (jarvis.ico) using only stdlib."""

import struct
import zlib
import os


def _create_png(width: int, height: int, pixels: bytes) -> bytes:
    """Create a minimal RGBA PNG from raw pixel data."""
    def chunk(tag: bytes, data: bytes) -> bytes:
        c = tag + data
        return struct.pack(">I", len(data)) + c + struct.pack(">I", zlib.crc32(c) & 0xFFFFFFFF)

    raw = b""
    for y in range(height):
        raw += b"\x00"  # filter byte
        raw += pixels[y * width * 4 : (y + 1) * width * 4]

    return (
        b"\x89PNG\r\n\x1a\n"
        + chunk(b"IHDR", struct.pack(">IIBBBBB", width, height, 8, 6, 0, 0, 0))
        + chunk(b"IDAT", zlib.compress(raw))
        + chunk(b"IEND", b"")
    )


def main():
    size = 64
    cx, cy = size // 2, size // 2

    pixels = bytearray()
    for y in range(size):
        for x in range(size):
            dx, dy = x - cx, y - cy
            dist = (dx * dx + dy * dy) ** 0.5
            angle = __import__("math").atan2(dy, dx)

            bg = (30, 30, 45, 255)
            glow = (100, 140, 255, 255)
            accent = (80, 120, 255, 255)

            r, g, b, a = bg

            # Circular background
            if dist < cx - 4:
                r, g, b = bg[:3]
                a = 255
            elif dist < cx:
                fade = 1 - (dist - cx + 4) / 4
                r = int(bg[0] * (1 - fade) + accent[0] * fade)
                g = int(bg[1] * (1 - fade) + accent[1] * fade)
                b = int(bg[2] * (1 - fade) + accent[2] * fade)
                a = 255
            else:
                a = 0

            # Letter "J" shape
            if a > 0:
                # Map to coordinate system where 0,0 is top-left of letter area
                lx, ly = (x - 16) / 32, (y - 10) / 44
                if 0.2 <= lx <= 0.8 and 0.1 <= ly <= 0.9:
                    # Vertical stem
                    if 0.35 <= lx <= 0.65:
                        r, g, b = 220, 230, 255
                    # Top bar
                    if ly <= 0.25 and lx >= 0.2:
                        r, g, b = 220, 230, 255
                    # Bottom curve
                    if ly >= 0.7 and lx >= 0.2:
                        cr = ((lx - 0.5) ** 2 + (ly - 0.85) ** 2) ** 0.5
                        if cr <= 0.25 and lx >= 0.35:
                            r, g, b = 220, 230, 255
                    # Center dot glow
                    glow_dist = ((lx - 0.5) ** 2 + (ly - 0.45) ** 2) ** 0.5
                    if glow_dist < 0.15:
                        t = 1 - glow_dist / 0.15
                        r = int(r + (glow[0] - r) * t * 0.5)
                        g = int(g + (glow[1] - g) * t * 0.5)
                        b = int(b + (glow[2] - b) * t * 0.5)

            pixels.extend([max(0, min(255, r)), max(0, min(255, g)), max(0, min(255, b)), max(0, min(255, a))])

    png_data = _create_png(size, size, bytes(pixels))

    # ICO format: header + 1 directory entry + PNG data
    ico = (
        struct.pack("<HHH", 0, 1, 1)  # reserved, type=1(ico), count=1
        + struct.pack("<BBBBHHII", size if size < 256 else 0, size if size < 256 else 0, 0, 0, 1, 32, len(png_data), 22)
        + png_data
    )

    out = os.path.join(os.path.dirname(__file__), "jarvis.ico")
    with open(out, "wb") as f:
        f.write(ico)
    print(f"Icon created: {out} ({os.path.getsize(out)} bytes)")


if __name__ == "__main__":
    main()
