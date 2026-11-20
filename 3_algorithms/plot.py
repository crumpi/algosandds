"""
Step 3 charts, from results/checks_p{p}.csv.

    python3 3_algorithms/plot.py          # p = 5 (default)
    python3 3_algorithms/plot.py --p 3

Writes (all in results/, suffix _p{p}):
  time_all            DFS: average time per check vs. size, all five structures (log-log)
  time_lists          the same, only the four lists, linear time axis
  time_per_visit      DFS: time per visited topic: flat for the lists, growing with V for the matrix
  memory_algorithms   DFS, BFS, DFS without visited set: memory entries per check vs. size
  visited_by_level    checks without a cycle: topics visited with vs. without a visited set, by level of A
  no_visited_time     how much slower DFS gets without a visited set, per structure

Structures: colour = outer container (Map / array / matrix), line style = inner (solid = array, dashed = Set).
Algorithms: their own colours (violet = DFS, green = BFS, magenta = DFS without visited set).
"""
import csv
import statistics
import sys
from collections import defaultdict
from pathlib import Path

import matplotlib.pyplot as plt

p = int(sys.argv[sys.argv.index("--p") + 1]) if "--p" in sys.argv else 5
results = Path(__file__).parent / "results"

BLUE, ORANGE, AQUA = "#2a78d6", "#eb6834", "#1baf7a"
VIOLET, GREEN, MAGENTA = "#6250d6", "#008300", "#e87ba4"
TEXT, MUTED, GRID = "#1a1a19", "#6b6a63", "#e4e3dd"
STRUCTURES = {  # name: (label, colour, line style, marker)
    "array-of-arrays": ("Array of arrays", ORANGE, "-", "o"),
    "map-of-arrays": ("Map of arrays", BLUE, "-", "o"),
    "array-of-sets": ("Array of sets", ORANGE, "--", "s"),
    "map-of-sets": ("Map of sets", BLUE, "--", "s"),
    "matrix": ("Matrix", AQUA, "-", "D"),
}
LISTS = [s for s in STRUCTURES if s != "matrix"]
ALGORITHMS = {
    "dfs": ("DFS", VIOLET, "-", "o"),
    "bfs": ("BFS", GREEN, "--", "s"),
    "dfs-no-visited": ("DFS without visited set", MAGENTA, ":", "^"),
}

rows = list(csv.DictReader(open(results / f"checks_p{p}.csv")))
groups = defaultdict(list)  # (V, structure, algorithm) -> rows
for r in rows:
    groups[(int(r["V"]), r["structure"], r["algorithm"])].append(r)
sizes = sorted({int(r["V"]) for r in rows})


def mean_of(V, structure, algorithm, column, only_no_cycle=False):
    rs = groups.get((V, structure, algorithm), [])
    if only_no_cycle:
        rs = [r for r in rs if r["cycle"] == "false"]
    return statistics.mean(float(r[column]) for r in rs) if rs else None


def series(structure, algorithm, value):
    xs, ys = [], []
    for V in sizes:
        y = value(V, structure, algorithm)
        if y is not None:
            xs.append(V)
            ys.append(y)
    return xs, ys


def new_chart(title, xlabel, ylabel, size=(8, 5.2)):
    fig, ax = plt.subplots(figsize=size)
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
    return fig, ax


def end_labels(ax, items, min_gap, log=False):
    """Label each line at its right end; push labels apart so they don't overlap."""
    items = sorted(items, key=lambda i: i[1])
    placed = []
    for x, y, text in items:
        pos = y
        if placed:
            prev = placed[-1]
            pos = max(y, prev * min_gap) if log else max(y, prev + min_gap)
        placed.append(pos)
        ax.annotate(text, xy=(x, y), xytext=(x * 1.25, pos), va="center", fontsize=9, color=TEXT)


def save(fig, name):
    fig.tight_layout()
    fig.savefig(results / f"{name}_p{p}.png", dpi=200)
    plt.close(fig)


# --- the averages behind the charts, as CSV ---------------------------------
# summary_p{p}.csv: one row per size × structure × algorithm, averaged over all its checks
# summary_by_level_p{p}.csv: the same, split by level of A and cycle / no cycle

def avg(rs, column):
    return statistics.mean(float(r[column]) for r in rs)


summary = ["V,E,structure,algorithm,checks,meanUs,medianUs,meanUsCycle,meanUsNoCycle,meanVisits,meanEdges,"
           "usPerVisit,meanMaxTodo,maxMaxTodo,meanVisitedSet,meanMemoryEntries,timeVsDfs"]
for (V, s, a), rs in sorted(groups.items(), key=lambda kv: (kv[0][0], list(STRUCTURES).index(kv[0][1]), list(ALGORITHMS).index(kv[0][2]))):
    cyc = [r for r in rs if r["cycle"] == "true"]
    no_cyc = [r for r in rs if r["cycle"] == "false"]
    dfs_rows = groups[(V, s, "dfs")]
    summary.append(",".join(str(x) for x in [
        V, rs[0]["E"], s, a, len(rs),
        f"{avg(rs, 'medianUs'):.3f}", f"{statistics.median(float(r['medianUs']) for r in rs):.3f}",
        f"{avg(cyc, 'medianUs'):.3f}", f"{avg(no_cyc, 'medianUs'):.3f}",
        f"{avg(rs, 'visits'):.1f}", f"{avg(rs, 'edges'):.1f}",
        f"{avg(rs, 'medianUs') / avg(rs, 'visits'):.4f}",  # ratio of means, as in time_per_visit
        f"{avg(rs, 'maxTodo'):.1f}", max(int(r["maxTodo"]) for r in rs),
        f"{avg(rs, 'visitedSetSize'):.1f}", f"{avg(rs, 'memoryEntries'):.1f}",
        f"{avg(rs, 'medianUs') / avg(dfs_rows, 'medianUs'):.3f}",  # as in no_visited_time (1 for DFS itself)
    ]))
(results / f"summary_p{p}.csv").write_text("\n".join(summary) + "\n")

by_level = defaultdict(list)
for r in rows:
    by_level[(int(r["V"]), r["structure"], r["algorithm"], int(r["levelA"]), r["cycle"])].append(r)
level_rows = ["V,structure,algorithm,levelA,cycle,checks,meanUs,meanVisits,meanEdges,meanMaxTodo,meanVisitedSet,meanMemoryEntries"]
for (V, s, a, level, cycle), rs in sorted(by_level.items(), key=lambda kv: (kv[0][0], list(STRUCTURES).index(kv[0][1]),
                                                                          list(ALGORITHMS).index(kv[0][2]), kv[0][3], kv[0][4])):
    level_rows.append(",".join(str(x) for x in [
        V, s, a, level, cycle, len(rs), f"{avg(rs, 'medianUs'):.3f}", f"{avg(rs, 'visits'):.1f}", f"{avg(rs, 'edges'):.1f}",
        f"{avg(rs, 'maxTodo'):.1f}", f"{avg(rs, 'visitedSetSize'):.1f}", f"{avg(rs, 'memoryEntries'):.1f}",
    ]))
(results / f"summary_by_level_p{p}.csv").write_text("\n".join(level_rows) + "\n")

# --- charts ----------------------------------------------------------------
plt.rcParams.update({"font.size": 10, "figure.facecolor": "white", "axes.facecolor": "white"})
time_per_check = lambda V, s, a: mean_of(V, s, a, "medianUs")
subtitle = f"avg. {p} prerequisites per topic"

# --- 1. time per check, all five --------------------------------------------
fig, ax = new_chart(f"DFS: average time per cycle check ({subtitle})", "Topics V (log scale)", "µs per check (log scale)")
for s, (label, colour, ls, marker) in STRUCTURES.items():
    xs, ys = series(s, "dfs", time_per_check)
    ax.plot(xs, ys, ls, color=colour, marker=marker, markersize=6, linewidth=2, label=label)
ax.set_xscale("log")
ax.set_yscale("log")
ax.legend(frameon=False, loc="upper left", fontsize=9)
save(fig, "time_all")

# --- 2. time per check, lists only, linear ----------------------------------
fig, ax = new_chart(f"DFS on the four lists: average time per cycle check ({subtitle})", "Topics V (log scale)", "µs per check")
labels = []
for s in LISTS:
    label, colour, ls, marker = STRUCTURES[s]
    xs, ys = series(s, "dfs", time_per_check)
    ax.plot(xs, ys, ls, color=colour, marker=marker, markersize=6, linewidth=2, label=label)
    labels.append((xs[-1], ys[-1], f"{label}  {ys[-1]:.0f} µs"))
end_labels(ax, labels, min_gap=7)
ax.set_xscale("log")
ax.set_ylim(0, None)
ax.set_xlim(None, sizes[-1] * 9)
ax.legend(frameon=False, loc="upper left", fontsize=9)
save(fig, "time_lists")

# --- 3. time per visited topic ----------------------------------------------
per_visit = lambda V, s, a: (mean_of(V, s, a, "medianUs") / mean_of(V, s, a, "visits")) if (V, s, a) in groups else None
fig, ax = new_chart(f"DFS: time per visited topic ({subtitle})", "Topics V (log scale)", "µs per visited topic (log scale)")
for s, (label, colour, ls, marker) in STRUCTURES.items():
    xs, ys = series(s, "dfs", per_visit)
    ax.plot(xs, ys, ls, color=colour, marker=marker, markersize=6, linewidth=2, label=label)
ax.set_xscale("log")
ax.set_yscale("log")
ax.annotate("matrix: every visit scans a row of V cells → O(V) per visit", xy=(5000, 5), xytext=(110, 8),
            color=MUTED, fontsize=9, arrowprops=dict(arrowstyle="-", color=MUTED, lw=0.8))
ax.annotate("lists: the same cost per visit at every size → O(1) to find the list", xy=(10000, 0.14), xytext=(250, 0.4),
            color=MUTED, fontsize=9, arrowprops=dict(arrowstyle="-", color=MUTED, lw=0.8))
ax.legend(frameon=False, loc="center right", fontsize=9)
save(fig, "time_per_visit")

# --- 4. memory per algorithm -------------------------------------------------
memory = lambda V, s, a: mean_of(V, s, a, "memoryEntries")
fig, ax = new_chart(f"Memory held during a check, array of arrays ({subtitle})", "Topics V (log scale)",
                    "Entries: largest to-do list + visited set (log scale)")
labels = []
for a, (label, colour, ls, marker) in ALGORITHMS.items():
    xs, ys = series("array-of-arrays", a, memory)
    ax.plot(xs, ys, ls, color=colour, marker=marker, markersize=6, linewidth=2)
    labels.append((xs[-1], ys[-1], f"{label}  {ys[-1]:.0f}"))
end_labels(ax, labels, min_gap=1.3, log=True)
ax.set_xscale("log")
ax.set_yscale("log")
ax.set_xlim(None, sizes[-1] * 30)
ax.set_xticks([t for t in (1e2, 1e3, 1e4, 1e5) if t <= sizes[-1]])
save(fig, "memory_algorithms")

# --- 5. visits with vs. without visited set, by level ------------------------
show = [V for V in (100, 1_000, 10_000, 100_000) if V in sizes]
fig, axes = plt.subplots(1, len(show), figsize=(3 * len(show), 4.2), sharey=True)
for ax, V in zip(axes, show):
    for a in ("dfs", "dfs-no-visited"):
        label, colour, ls, marker = ALGORITHMS[a]
        by_level = defaultdict(list)
        for r in groups[(V, "array-of-arrays", a)]:
            if r["cycle"] == "false":
                by_level[int(r["levelA"])].append(int(r["visits"]))
        levels = sorted(by_level)
        ax.plot(levels, [statistics.mean(by_level[l]) for l in levels], ls, color=colour, marker=marker,
                markersize=5, linewidth=2, label="with visited set" if a == "dfs" else "without")
    ax.set_yscale("log")
    ax.set_title(f"V = {V:,}", fontsize=10, color=TEXT)
    ax.set_xlabel("Level of A", color=MUTED)
    ax.set_xticks(range(0, 12, 2))
    ax.grid(True, color=GRID, linewidth=0.8)
    ax.set_axisbelow(True)
    for side in ("top", "right"):
        ax.spines[side].set_visible(False)
    ax.tick_params(colors=MUTED)
axes[0].set_ylabel("Topics visited (log scale)", color=MUTED)
axes[0].legend(frameon=False, fontsize=9, loc="upper left")
fig.suptitle(f"Checks without a cycle: topics visited with vs. without a visited set ({subtitle})",
             x=0.01, ha="left", fontsize=12, color=TEXT)
fig.tight_layout()
fig.savefig(results / f"visited_by_level_p{p}.png", dpi=200)
plt.close(fig)

# --- 6. slowdown without visited set, per structure --------------------------
slowdown = lambda V, s, a: (mean_of(V, s, "dfs-no-visited", "medianUs") / mean_of(V, s, "dfs", "medianUs")) if (V, s, "dfs") in groups else None
fig, ax = new_chart(f"DFS without vs. with visited set: time ratio ({subtitle})", "Topics V (log scale)",
                    "× time of DFS with visited set (log scale)")
for s, (label, colour, ls, marker) in STRUCTURES.items():
    xs, ys = series(s, None, slowdown)
    ax.plot(xs, ys, ls, color=colour, marker=marker, markersize=6, linewidth=2, label=label)
ax.axhline(1, color=MUTED, linewidth=1)
ax.annotate("above 1: the visited set makes it faster", xy=(sizes[0], 1.15), color=MUTED, fontsize=9)
ax.set_xscale("log")
ax.set_yscale("log")
ax.legend(frameon=False, loc="upper right", fontsize=9)
save(fig, "no_visited_time")

# --- 7. ceiling: memory per check vs. the number of paths (from ceiling.ts) ----
ceiling_csv = results / f"ceiling_p{p}.csv"
if ceiling_csv.exists():
    c = list(csv.DictReader(open(ceiling_csv)))
    V = [int(r["V"]) for r in c]
    fig, ax = new_chart(f"Memory per check approaches a ceiling ({subtitle})", "Topics V (log scale)",
                        "Entries per check (average over 230 checks)")
    main_max = max(sizes)
    ax.axvspan(main_max * 1.15, max(V) * 1.6, color="#f3f2ee", zorder=0)
    ax.annotate("beyond the main measurements\n(graphs built in memory only)", xy=(main_max * 1.3, 0), xytext=(main_max * 1.3, 380),
                fontsize=8.5, color=MUTED, va="top")
    ax.plot(V, [float(r["paths"]) for r in c], "-", color=MUTED, linewidth=1.5, marker="x", markersize=5,
            label="Ceiling: paths walked per check (DFS without visited set)")
    # BFS is left out on purpose: its value adds the queue on top of the visited set,
    # so it can exceed the paths ceiling, which only limits the visited set (see ceiling_p{p}.csv)
    ax.plot(V, [float(r["dfsMemory"]) for r in c], "-", color=VIOLET, marker="o", markersize=5, linewidth=2,
            label="DFS memory (visited set + call stack ≤ 12)")
    ax.set_xscale("log")
    ax.set_xlim(min(V) * 0.7, max(V) * 1.6)
    ax.set_ylim(0, 3100)
    ax.legend(frameon=False, loc="upper left", fontsize=9)
    save(fig, "ceiling")

print(f"wrote summary_p{p}.csv, summary_by_level_p{p}.csv and the charts to {results}/")
