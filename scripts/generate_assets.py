"""Generate public-safe portfolio assets.

The repository already includes generated SVG and PNG assets. This script is a
placeholder for a real asset pipeline and documents the intended rule: all
published visuals must use synthetic labels and avoid private identifiers.
"""
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

if __name__ == "__main__":
    assets = sorted((ROOT / "assets").glob("*.svg"))
    screenshots = sorted((ROOT / "screenshots").glob("*.png"))
    print("SVG assets:")
    for asset in assets:
        print(f"- {asset.relative_to(ROOT)}")
    print("\nSynthetic screenshots:")
    for shot in screenshots:
        print(f"- {shot.relative_to(ROOT)}")
