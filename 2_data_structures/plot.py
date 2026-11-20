"""
Step 2 charts, from results/memory_p{p}.csv.

    python3 2_data_structures/plot.py          # p = 5 (default)
    python3 2_data_structures/plot.py --p 3

Writes:
  results/memory_loglog_p{p}.png     all five structures, log-log: the slope shows
                                     linear (lists) vs. quadratic (matrix) growth
  results/memory_per_topic_p{p}.png  the four lists only: bytes per topic, which stays
                                     flat when memory grows linearly

Encoding: colour = outer container (Map / array / matrix),
line style = inner container (solid = array, dashed = Set).
"""
import csv
import sys
from pathlib import Path

import matplotlib.pyplot as plt

p = int(sys.argv[sys.argv.index("--p") + 1]) if "--p" in sys.argv else 5
results = Path(__file__).parent / "results"

BLUE, ORANGE, AQUA = "#2a78d6", "#eb6834", "#1baf7a"
TEXT, MUTED, GRID = "#1a1a19", "#6b6a63", "#e4e3dd"
STYLE = {  # structure: (label, colour, line style, marker)
    "map-of-arrays": ("Map of arrays", BLUE, "-", "o"),
    "map-of-sets": ("Map of sets", BLUE, "--", "s"),
    "array-of-arrays": ("Array of arrays", ORANGE, "-", "o"),
    "array-of-sets": ("Array of sets", ORANGE, "--", "s"),
    "matrix": ("Matrix", AQUA, "-", "D"),
}

rows = list(csv.DictReader(open(results / f"memory_p{p}.csv")))


def series(structure: str, column: str):
    xs, ys = [], []
    for r in rows:
        if r["structure"] == structure and r[column] != "":
            xs.append(int(r["V"]))
            ys.append(float(r[column]))
    return xs, ys


def style_axes(ax, title: str, xlabel: str, ylabel: str):
    ax.set_title(title, loc="left", fontsize=12, color=TEXT, pad=12)
    ax.set_xlabel(xlabel, color=MUTED)
    ax.set_ylabel(ylabel, color=MUTED)
    ax.grid(True, which="major", color=GRID, linewidth=0.8)
    ax.set_axisbelow(True)
    for side in ("top", "right"):
        ax.spines[side].set_visible(False)
    for side in ("left", "bottom"):
        ax.spines[side].set_color(GRID)
    ax.tick_params(colors=MUTED)


plt.rcParams.update({"font.size": 10, "figure.facecolor": "white", "axes.facecolor": "white"})

# --- 1. log-log: all five structures ----------------------------------------
fig, ax = plt.subplots(figsize=(8, 5.2))
for name, (label, colour, ls, marker) in STYLE.items():
    xs, ys = series(name, "measuredBytes")
    ys = [y / 1e6 for y in ys]
    ax.plot(xs, ys, ls, color=colour, marker=marker, markersize=6, linewidth=2, label=label)
    if name == "matrix":
        # sizes too big to build: only calculated (V² bytes), drawn hollow and dotted
        ex, ey = series(name, "estimateBytes")
        calc = [(x, y / 1e6) for x, y in zip(ex, ey) if x > xs[-1]]
        cx = [xs[-1]] + [c[0] for c in calc]
        cy = [ys[-1]] + [c[1] for c in calc]
        ax.plot(cx, cy, ":", color=colour, linewidth=2)
        ax.plot(cx[1:], cy[1:], "D", color=colour, markersize=6, markerfacecolor="white",
                label="Matrix, calculated (too big to build)")
ax.set_xscale("log")
ax.set_yscale("log")
style_axes(ax, f"Memory per data structure (avg. {p} prerequisites per topic)",
           "Topics V (log scale)", "Memory in MB (log scale)")
ax.annotate("lists: ×10 topics → ×10 memory\n(slope 1 = linear, O(V + E))", xy=(2000, 0.4), xytext=(150, 2),
            color=MUTED, fontsize=9, arrowprops=dict(arrowstyle="-", color=MUTED, lw=0.8))
ax.annotate("matrix: ×10 topics → ×100 memory\n(slope 2 = quadratic, O(V²))", xy=(5000, 26), xytext=(250, 120),
            color=MUTED, fontsize=9, arrowprops=dict(arrowstyle="-", color=MUTED, lw=0.8))
ax.legend(frameon=False, loc="lower right", fontsize=9)
fig.tight_layout()
fig.savefig(results / f"memory_loglog_p{p}.png", dpi=200)

# --- 2. bytes per topic: the four lists ------------------------------------
fig, ax = plt.subplots(figsize=(8, 5.2))
end_labels = []  # (y, text) at the right end of each line
for name, (label, colour, ls, marker) in STYLE.items():
    if name == "matrix":
        continue
    xs, ys = series(name, "bytesPerTopic")
    ax.plot(xs, ys, ls, color=colour, marker=marker, markersize=6, linewidth=2, label=label)
    end_labels.append((ys[-1], f"{label}  {ys[-1]:.0f} B"))
ex, ey = series("array-of-arrays", "estimateBytes")
theory = [y / x for x, y in zip(ex, ey)]
ax.plot(ex, theory, "-", color=MUTED, linewidth=1.2)
end_labels.append((theory[-1], f"Theory: (V + E) · 8 B  {theory[-1]:.0f} B"))

# spread the end labels so that close lines don't overlap (at least 9 bytes apart)
end_labels.sort()
placed = []
for y, text in end_labels:
    y_label = max(y, placed[-1] + 9) if placed else y
    placed.append(y_label)
    ax.annotate(text, xy=(ex[-1], y), xytext=(ex[-1] * 1.25, y_label), va="center", fontsize=9, color=TEXT)

ax.set_xscale("log")
ax.set_ylim(0, None)
ax.set_xlim(None, ex[-1] * 9)  # room for the end labels
style_axes(ax, f"Adjacency lists: memory per topic (avg. {p} prerequisites per topic)",
           "Topics V (log scale)", "Bytes per topic")
ax.legend(frameon=False, loc="center left", fontsize=9)
fig.tight_layout()
fig.savefig(results / f"memory_per_topic_p{p}.png", dpi=200)

# --- 3. bars: the four lists at the largest size -----------------------------
largest = max(int(r["V"]) for r in rows)
by_name = {r["structure"]: float(r["measuredBytes"]) / 1e6 for r in rows if int(r["V"]) == largest and r["measuredBytes"] != ""}
order = ["array-of-arrays", "map-of-arrays", "array-of-sets", "map-of-sets"]
base = by_name["array-of-arrays"]

fig, ax = plt.subplots(figsize=(8, 4.6))
for i, name in enumerate(order):
    label, colour, ls, _ = STYLE[name]
    value = by_name[name]
    ax.bar(i, value, width=0.6, color=colour, hatch="//" if ls == "--" else None,
           edgecolor="white", linewidth=2)
    extra = "baseline" if name == "array-of-arrays" else f"+{(value / base - 1) * 100:.0f} %"
    ax.annotate(f"{value:.1f} MB\n{extra}", xy=(i, value), xytext=(0, 4), textcoords="offset points",
                ha="center", va="bottom", fontsize=9, color=TEXT)
ax.set_xticks(range(len(order)), [STYLE[n][0] for n in order])
ax.set_ylim(0, max(by_name[n] for n in order) * 1.25)
style_axes(ax, f"Adjacency lists at {largest:,} topics (avg. {p} prerequisites per topic)",
           "Blue = outer Map, orange = outer array; hatched = inner Set", "Memory in MB")
ax.grid(False, axis="x")
fig.tight_layout()
fig.savefig(results / f"memory_lists_p{p}.png", dpi=200)

print(f"wrote {results}/memory_loglog_p{p}.png, memory_per_topic_p{p}.png and memory_lists_p{p}.png")
