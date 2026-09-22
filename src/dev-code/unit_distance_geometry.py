"""Expansion and proof utilities for unit-distance glyph graphs."""

from __future__ import annotations

from collections import defaultdict, deque
from dataclasses import dataclass
from math import gcd

from .glyphs import GRID_HEIGHT, GRID_WIDTH, Path, Point

Edge = tuple[Point, Point]


@dataclass(frozen=True)
class GlyphGraph:
    nodes: frozenset[Point]
    edges: frozenset[Edge]

    @property
    def connected(self) -> bool:
        if not self.nodes:
            return True
        adjacency: dict[Point, set[Point]] = defaultdict(set)
        for a, b in self.edges:
            adjacency[a].add(b)
            adjacency[b].add(a)
        seen: set[Point] = set()
        queue = deque([next(iter(self.nodes))])
        while queue:
            point = queue.popleft()
            if point in seen:
                continue
            seen.add(point)
            queue.extend(adjacency[point] - seen)
        return seen == set(self.nodes)


def canonical_edge(a: Point, b: Point) -> Edge:
    return (a, b) if a <= b else (b, a)


def expand_segment(a: Point, b: Point) -> tuple[Edge, ...]:
    """Subdivide an integer segment into primitive lattice edges.

    The current design language permits only horizontal and vertical source
    segments.  The stricter rule keeps every primitive edge at Euclidean
    length exactly 1; a diagonal must therefore be authored as a staircase.
    """

    dx, dy = b[0] - a[0], b[1] - a[1]
    if dx and dy:
        raise ValueError(f"diagonal source segment {a} -> {b}; use a unit staircase")
    steps = gcd(abs(dx), abs(dy))
    if steps == 0:
        raise ValueError(f"zero-length source segment at {a}")
    sx, sy = dx // steps, dy // steps
    if sx * sx + sy * sy != 1:
        raise ValueError(f"segment {a} -> {b} cannot be split into unit edges")
    edges: list[Edge] = []
    current = a
    for _ in range(steps):
        nxt = (current[0] + sx, current[1] + sy)
        edges.append(canonical_edge(current, nxt))
        current = nxt
    return tuple(edges)


def graph_from_paths(paths: tuple[Path, ...]) -> GlyphGraph:
    edges: set[Edge] = set()
    nodes: set[Point] = set()
    for path in paths:
        if len(path) < 2:
            raise ValueError("every source path needs at least two anchors")
        nodes.update(path)
        for a, b in zip(path, path[1:]):
            for edge in expand_segment(a, b):
                edges.add(edge)
                nodes.update(edge)
    return GlyphGraph(frozenset(nodes), frozenset(edges))


def squared_length(edge: Edge) -> int:
    (x1, y1), (x2, y2) = edge
    return (x2 - x1) ** 2 + (y2 - y1) ** 2


def validate_graph(graph: GlyphGraph) -> list[str]:
    errors: list[str] = []
    for edge in graph.edges:
        if squared_length(edge) != 1:
            errors.append(f"non-unit edge: {edge}")
    if not graph.connected:
        errors.append("graph is disconnected")
    for x, y in graph.nodes:
        if not (0 <= x < GRID_WIDTH and 0 <= y < GRID_HEIGHT):
            errors.append(f"node outside design grid: {(x, y)}")
    return errors
