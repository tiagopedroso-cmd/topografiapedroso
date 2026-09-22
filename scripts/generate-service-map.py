"""Generate the Services area map from IBGE municipality boundaries.

Run: python scripts/generate-service-map.py
Source: https://servicodados.ibge.gov.br/api/v3/malhas/municipios/{id}
"""

import json
import math
import gzip
import urllib.request
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "mapa-area-atuacao.svg"
MUNICIPALITIES = [
    ("Santa Isabel", 3546801, "#456f70", 116),
    ("Arujá", 3503901, "#07528d", 74),
    ("Guararema", 3518305, "#547a68", 110),
    ("Itaquaquecetuba", 3523107, "#6b8b78", 152),
    ("Mogi das Cruzes", 3530607, "#315f73", 148),
    ("Suzano", 3552502, "#678775", 78),
]


def rings_from_geometry(geometry):
    if geometry["type"] == "Polygon":
        return geometry["coordinates"]
    if geometry["type"] == "MultiPolygon":
        return [ring for polygon in geometry["coordinates"] for ring in polygon]
    raise ValueError(f"Unsupported geometry: {geometry['type']}")


def fetch_geometry(code):
    url = (
        f"https://servicodados.ibge.gov.br/api/v3/malhas/municipios/{code}"
        "?formato=application/vnd.geo%2Bjson&qualidade=maxima"
    )
    with urllib.request.urlopen(url, timeout=30) as response:
        payload = response.read()
    if payload.startswith(b"\x1f\x8b"):
        payload = gzip.decompress(payload)
    data = json.loads(payload)
    feature = data["features"][0]
    if feature["properties"]["codarea"] != str(code):
        raise ValueError(f"Unexpected IBGE code for {code}")
    return feature["geometry"]


def centroid(points):
    signed_area = x_sum = y_sum = 0.0
    for a, b in zip(points, points[1:]):
        cross = a[0] * b[1] - b[0] * a[1]
        signed_area += cross
        x_sum += (a[0] + b[0]) * cross
        y_sum += (a[1] + b[1]) * cross
    if abs(signed_area) < 1e-10:
        return tuple(map(lambda coords: sum(coords) / len(coords), zip(*points)))
    return x_sum / (3 * signed_area), y_sum / (3 * signed_area)


def main():
    areas = [(name, code, color, width, rings_from_geometry(fetch_geometry(code)))
             for name, code, color, width in MUNICIPALITIES]
    all_points = [point for *_, rings in areas for ring in rings for point in ring]
    mid_lat = (min(p[1] for p in all_points) + max(p[1] for p in all_points)) / 2
    cos_lat = math.cos(math.radians(mid_lat))
    x_values = [p[0] * cos_lat for p in all_points]
    y_values = [-p[1] for p in all_points]
    x_min, x_max = min(x_values), max(x_values)
    y_min, y_max = min(y_values), max(y_values)
    scale = min(590 / (x_max - x_min), 645 / (y_max - y_min))
    x_pad = (760 - (x_max - x_min) * scale) / 2
    y_pad = (760 - (y_max - y_min) * scale) / 2

    def project(point):
        return (x_pad + (point[0] * cos_lat - x_min) * scale,
                y_pad + (-point[1] - y_min) * scale)

    pieces = ['''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 760 760" role="img" aria-labelledby="title desc">
<title id="title">Área de atuação da Pedroso Topografia</title>
<desc id="desc">Limites municipais do IBGE para Arujá, Santa Isabel, Itaquaquecetuba, Guararema, Mogi das Cruzes e Suzano.</desc>
<defs>
  <pattern id="grid" width="38" height="38" patternUnits="userSpaceOnUse"><path d="M 38 0 L 0 0 0 38" fill="none" stroke="#dae5e9" stroke-width="1"/></pattern>
  <filter id="shadow" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy="12" stdDeviation="12" flood-color="#102b40" flood-opacity=".18"/></filter>
  <filter id="labelShadow" x="-30%" y="-50%" width="160%" height="200%"><feDropShadow dx="0" dy="3" stdDeviation="4" flood-color="#102b40" flood-opacity=".18"/></filter>
</defs>
<rect width="760" height="760" rx="22" fill="#f5f9f8"/>
<rect width="760" height="760" rx="22" fill="url(#grid)" opacity=".5"/>
<g fill="none" stroke="#b9d1d2" stroke-width="1" opacity=".4">
  <ellipse cx="48" cy="115" rx="92" ry="46" transform="rotate(-28 48 115)"/>
  <ellipse cx="48" cy="115" rx="125" ry="68" transform="rotate(-28 48 115)"/>
  <ellipse cx="705" cy="620" rx="95" ry="43" transform="rotate(-28 705 620)"/>
  <ellipse cx="705" cy="620" rx="135" ry="75" transform="rotate(-28 705 620)"/>
</g>
<g transform="translate(690 54)" fill="none" stroke="#315c72" stroke-width="2" aria-hidden="true">
  <circle r="21" stroke-opacity=".5"/><path d="M0-30V30M-30 0H30" stroke-opacity=".5"/><path d="M0-18 5 4 0 0-5 4Z" fill="#315c72"/>
  <text x="0" y="-39" text-anchor="middle" fill="#315c72" stroke="none" font-family="Arial,sans-serif" font-size="15" font-weight="700">N</text>
</g>
<g filter="url(#shadow)" stroke="#fff" stroke-width="3" stroke-linejoin="round" fill-rule="evenodd">''']

    for name, code, color, width, rings in areas:
        subpaths = []
        for ring in rings:
            coords = [project(point) for point in ring]
            subpaths.append("M" + " L".join(f"{x:.1f},{y:.1f}" for x, y in coords) + "Z")
        pieces.append(f'<path id="municipio-{code}" d="{" ".join(subpaths)}" fill="{color}"/>')
    pieces.append('</g>')

    for name, code, color, width, rings in areas:
        outer = max(rings, key=len)
        lon, lat = centroid(outer)
        x, y = project((lon, lat))
        # The marker sits on the municipality. The small label below it is a callout.
        label_y = y + 21
        pieces.append(f'''<g transform="translate({x:.1f} {label_y:.1f})" filter="url(#labelShadow)">
  <circle cy="-19" r="7" fill="#fff" stroke="{color}" stroke-width="3"/>
  <rect x="{-width / 2:.1f}" y="0" width="{width}" height="27" rx="8" fill="{'#074480' if name == 'Arujá' else '#fff'}"/>
  <text y="18" text-anchor="middle" fill="{'#fff' if name == 'Arujá' else '#173046'}" font-family="Arial,sans-serif" font-size="12.5" font-weight="700">{name}</text>
</g>''')
        print(f"{name}: label ({x:.0f}, {label_y:.0f})")

    pieces.append('''<g font-family="Arial,sans-serif" font-size="11" fill="#496274">
  <rect x="20" y="710" width="124" height="30" rx="8" fill="#fff" fill-opacity=".92"/>
  <circle cx="37" cy="725" r="6" fill="#07528d"/><text x="51" y="729">Base em Arujá</text>
</g>
</svg>''')
    OUTPUT.write_text("\n".join(pieces) + "\n", encoding="utf-8")
    print(f"Wrote {OUTPUT} ({OUTPUT.stat().st_size} bytes)")


if __name__ == "__main__":
    main()
