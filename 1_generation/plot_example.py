"""
Diagram of the hand-made example graph (graphs/example_cs.json) for the report.

    python3 1_generation/plot_example.py

Writes example_cs.png: topics by level (foundations at the bottom), arrows
"X requires Y", the path Merge Sort → Recursion → Functions → Variables
highlighted, and the new edge "Variables requires Merge Sort" that would close a cycle.
"""
import json
from collections import defaultdict
from pathlib import Path

import matplotlib.pyplot as plt
from matplotlib.patches import FancyArrowPatch

here = Path(__file__).parent
graph = json.load(open(here / "graphs" / "example_cs.json"))
nodes = {n["id"]: n for n in graph["nodes"]}
by_label = {n["label"]: n["id"] for n in graph["nodes"]}

TEXT, MUTED, EDGE = "#1a1a19", "#6b6a63", "#b9b8b0"
PATH, NEW = "#2a78d6", "#e34948"

# position: level = row (0 at the bottom), topics of a level spread evenly
rows = defaultdict(list)
for n in graph["nodes"]:
    rows[n["level"]].append(n["id"])
pos = {}
for level, ids in rows.items():
    for i, node_id in enumerate(ids):
        pos[node_id] = ((i + 1) / (len(ids) + 1) * 10, level * 1.6)

path = ["Merge Sort", "Recursion", "Functions", "Variables"]
path_edges = {(by_label[a], by_label[b]) for a, b in zip(path, path[1:])}

fig, ax = plt.subplots(figsize=(8, 6.4))


def arrow(a, b, colour, width, style="-", rad=0.0):
    ax.add_patch(FancyArrowPatch(pos[a], pos[b], arrowstyle="-|>", mutation_scale=14, color=colour, lw=width,
                                 linestyle=style, shrinkA=22, shrinkB=22, connectionstyle=f"arc3,rad={rad}", zorder=1))


for a, b in graph["edges"]:
    on_path = (a, b) in path_edges
    arrow(a, b, PATH if on_path else EDGE, 2.4 if on_path else 1.2)

# the new edge that would close the cycle
arrow(by_label["Variables"], by_label["Merge Sort"], NEW, 2.2, style=(0, (4, 3)), rad=-0.45)
ax.annotate('new: "Variables requires Merge Sort"?\nMerge Sort already reaches Variables → cycle',
            xy=(8.7, -0.15), color=NEW, fontsize=8.5, ha="center")

for node_id, (x, y) in pos.items():
    label = nodes[node_id]["label"]
    highlight = label in path
    ax.text(x, y, label, ha="center", va="center", fontsize=9, color=TEXT, zorder=2,
            bbox=dict(boxstyle="round,pad=0.4", fc="white", ec=PATH if highlight else MUTED, lw=2 if highlight else 1))

for level in rows:
    ax.text(-0.3, level * 1.6, f"level {level}", ha="right", va="center", fontsize=8, color=MUTED)

ax.set_xlim(-1.6, 10.6)
ax.set_ylim(-0.8, max(rows) * 1.6 + 0.8)
ax.axis("off")
ax.set_title('Example graph: an arrow X → Y means "X requires Y"', loc="left", fontsize=11, color=TEXT)
fig.tight_layout()
fig.savefig(here / "example_cs.png", dpi=200)
print(f"wrote {here / 'example_cs.png'}")
