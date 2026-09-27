"""Turn an upscaled / compressed pixel-art image into its clean native grid.

AI generators and stock sites deliver pixel art upscaled (each art pixel is
~3-5 real pixels) and JPEG/WebP-compressed, so edges are noisy. This box-
downscales by the art's pixel factor and snaps to a limited palette, which
gives back crisp, exact pixels the game can scale up by integer factors.

usage: python3 tools/prep_pixel_art.py IN OUT --factor 3 --colors 32 [--js OUT.js]

--js also writes the PNG as a base64 data URL in a JS file, because Chrome
refuses getImageData() on images loaded from file://, and the design pages
are meant to open straight from disk.
"""
import argparse
import base64
import io

from PIL import Image


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("src")
    ap.add_argument("dst")
    ap.add_argument("--factor", type=int, default=3, help="size of one art pixel in the source image")
    ap.add_argument("--colors", type=int, default=32, help="palette size after quantization")
    ap.add_argument("--js", help="also write a JS file exposing the PNG as window.MD_ART[name]")
    ap.add_argument("--name", default="skyline", help="key used in window.MD_ART")
    args = ap.parse_args()

    im = Image.open(args.src).convert("RGB")
    w, h = im.size[0] // args.factor, im.size[1] // args.factor
    small = im.resize((w, h), Image.BOX)
    small = small.quantize(colors=args.colors, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE)
    small = small.convert("RGB")
    small.save(args.dst)
    print(f"{args.dst}: {w}x{h}, {args.colors} colors")

    if args.js:
        buf = io.BytesIO()
        small.save(buf, format="PNG")
        b64 = base64.b64encode(buf.getvalue()).decode()
        with open(args.js, "w") as f:
            f.write("window.MD_ART = window.MD_ART || {};\n")
            f.write(f"window.MD_ART[{args.name!r}] = 'data:image/png;base64,{b64}';\n")
        print(f"{args.js}: {len(b64) // 1024} KB")


if __name__ == "__main__":
    main()
