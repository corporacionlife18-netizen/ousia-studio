"""Optimiza imágenes de img/: máx. 2000 px de ancho, JPG calidad ~80, menos de 400 KB.

Uso: python optimizar_imagenes.py archivo1 archivo2 ...   (rutas relativas a la raíz del repo)

- JPG que ya cumplen (<= 2000 px y < 400 KB) no se tocan, para no recomprimir en cada push.
- PNG se convierte a JPG (fondo blanco si tiene transparencia) y se actualizan las rutas
  en content/*.json, que es donde Pages CMS guarda las referencias.
- WebP se mantiene en WebP, con los mismos límites.
"""
import io
import json
import sys
from pathlib import Path

from PIL import Image, ImageOps

MAX_W = 2000
MAX_BYTES = 400 * 1024
QUALITY, MIN_QUALITY = 80, 50
EXTS = {".jpg", ".jpeg", ".png", ".webp"}
CONTENT = Path("content")


def encode(im, fmt):
    q = QUALITY
    while True:
        buf = io.BytesIO()
        if fmt == "WEBP":
            im.save(buf, "WEBP", quality=q, method=6)
        else:
            im.save(buf, "JPEG", quality=q, optimize=True, progressive=True)
        if buf.tell() < MAX_BYTES or q <= MIN_QUALITY:
            return buf.getvalue(), q
        q -= 5


def flatten(im):
    im = ImageOps.exif_transpose(im)
    if im.mode in ("RGBA", "LA", "P"):
        im = im.convert("RGBA")
        bg = Image.new("RGB", im.size, (255, 255, 255))
        bg.paste(im, mask=im.split()[-1])
        return bg
    return im.convert("RGB")


def free_name(path):
    """Si ya existe un archivo con ese nombre, agrega -2, -3..."""
    if not path.exists():
        return path
    n = 2
    while path.with_name(f"{path.stem}-{n}{path.suffix}").exists():
        n += 1
    return path.with_name(f"{path.stem}-{n}{path.suffix}")


def optimize(path):
    """Devuelve la ruta final si cambió algo, o None si ya estaba bien."""
    ext = path.suffix.lower()
    size = path.stat().st_size
    with Image.open(path) as im:
        im.load()
        width = im.width
        if ext in (".jpg", ".jpeg", ".webp") and width <= MAX_W and size < MAX_BYTES:
            return None
        im = flatten(im)
    if im.width > MAX_W:
        im = im.resize((MAX_W, round(im.height * MAX_W / im.width)), Image.LANCZOS)

    fmt = "WEBP" if ext == ".webp" else "JPEG"
    data, q = encode(im, fmt)
    target = path
    if ext == ".png":
        target = free_name(path.with_suffix(".jpg"))
    target.write_bytes(data)
    if target != path:
        path.unlink()
    print(f"{path} -> {target}: {width}px/{size // 1024}KB -> {im.width}px/{len(data) // 1024}KB (q{q})")
    return target


def update_refs(renames):
    """Reemplaza rutas viejas por nuevas en content/*.json."""
    for f in CONTENT.glob("*.json"):
        text = f.read_text(encoding="utf-8")
        new = text
        for old, dst in renames.items():
            new = new.replace(json.dumps(old)[1:-1], json.dumps(dst)[1:-1])
        if new != text:
            f.write_text(new, encoding="utf-8")
            print(f"Rutas actualizadas en {f}")


def main(files):
    renames = {}
    for name in files:
        p = Path(name)
        if not p.is_file() or p.suffix.lower() not in EXTS or p.parts[0] != "img":
            continue
        try:
            out = optimize(p)
        except Exception as e:  # una imagen rota no debe frenar las demás
            print(f"No se pudo optimizar {p}: {e}", file=sys.stderr)
            continue
        if out and out != p:
            renames[p.as_posix()] = out.as_posix()
    if renames:
        update_refs(renames)


if __name__ == "__main__":
    main(sys.argv[1:])
