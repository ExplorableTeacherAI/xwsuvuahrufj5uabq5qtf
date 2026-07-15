/**
 * Domain Model: Building Dimensions
 * ==================================
 *
 * This file contains the mathematical logic for understanding
 * how each dimension builds on the previous one.
 *
 * The pattern: dragging a shape perpendicular to itself creates
 * the next dimension.
 *
 * 0D → 1D: point → line (drag creates length)
 * 1D → 2D: line → square (drag creates width)
 * 2D → 3D: square → cube (drag creates depth)
 * 3D → 4D: cube → tesseract (drag creates the 4th dimension)
 */

// ─────────────────────────────────────────────────────────────
// POINT (0D) PROPERTIES
// ─────────────────────────────────────────────────────────────

/**
 * Mathematical point width: always exactly 0
 * A point has no dimension, no size, only position
 */
export const mathPointWidth = (): number => 0;

/**
 * Mathematical point area: always exactly 0
 * A point has no area because it has no dimension
 */
export const mathPointArea = (): number => 0;

/**
 * Physical dot width: the diameter of the rendered dot in pixels
 * Unlike a mathematical point, a physical dot has size
 */
export const physicalDotWidth = (dotRadius: number): number => dotRadius * 2;

/**
 * Physical dot area: the area of the rendered dot in pixels²
 * Unlike a mathematical point, a physical dot occupies space
 */
export const physicalDotArea = (dotRadius: number): number => Math.PI * dotRadius * dotRadius;

// ─────────────────────────────────────────────────────────────
// DIMENSION PROPERTIES
// ─────────────────────────────────────────────────────────────

/**
 * Count vertices for n-dimensional hypercube
 * Formula: 2^n
 */
export const countVertices = (dimension: number): number => {
    return Math.pow(2, dimension);
};

/**
 * Count edges for n-dimensional hypercube
 * Formula: n × 2^(n-1)
 */
export const countEdges = (dimension: number): number => {
    if (dimension < 1) return 0;
    return dimension * Math.pow(2, dimension - 1);
};

/**
 * Count faces (2D facets) for n-dimensional hypercube
 * Formula: (n choose 2) × 2^(n-2) for n >= 2
 */
export const countFaces = (dimension: number): number => {
    if (dimension < 2) return 0;
    const nChoose2 = (dimension * (dimension - 1)) / 2;
    return nChoose2 * Math.pow(2, dimension - 2);
};

/**
 * Count cells (3D facets) for n-dimensional hypercube
 * Formula: (n choose 3) × 2^(n-3) for n >= 3
 */
export const countCells = (dimension: number): number => {
    if (dimension < 3) return 0;
    const nChoose3 = (dimension * (dimension - 1) * (dimension - 2)) / 6;
    return nChoose3 * Math.pow(2, dimension - 3);
};

// ─────────────────────────────────────────────────────────────
// DIMENSION NAMES AND DESCRIPTIONS
// ─────────────────────────────────────────────────────────────

export const dimensionNames: Record<number, string> = {
    0: 'Point',
    1: 'Line Segment',
    2: 'Square',
    3: 'Cube',
    4: 'Tesseract',
};

export const dimensionDescriptions: Record<number, string> = {
    0: 'A single location with no size',
    1: 'Has length only',
    2: 'Has length and width',
    3: 'Has length, width, and depth',
    4: 'Has length, width, depth, and a fourth dimension',
};

// ─────────────────────────────────────────────────────────────
// 3D PROJECTION OF 4D TESSERACT
// ─────────────────────────────────────────────────────────────

/**
 * Generate 4D tesseract vertices
 * A tesseract has 16 vertices at all combinations of ±1 in 4D
 */
export const tesseractVertices4D = (): number[][] => {
    const vertices: number[][] = [];
    for (let x = -1; x <= 1; x += 2) {
        for (let y = -1; y <= 1; y += 2) {
            for (let z = -1; z <= 1; z += 2) {
                for (let w = -1; w <= 1; w += 2) {
                    vertices.push([x, y, z, w]);
                }
            }
        }
    }
    return vertices;
};

/**
 * Generate tesseract edges (pairs of vertex indices)
 * Two vertices are connected if they differ in exactly one coordinate
 */
export const tesseractEdges = (): [number, number][] => {
    const vertices = tesseractVertices4D();
    const edges: [number, number][] = [];

    for (let i = 0; i < vertices.length; i++) {
        for (let j = i + 1; j < vertices.length; j++) {
            // Count how many coordinates differ
            let diff = 0;
            for (let k = 0; k < 4; k++) {
                if (vertices[i][k] !== vertices[j][k]) diff++;
            }
            // Connect if exactly one coordinate differs
            if (diff === 1) {
                edges.push([i, j]);
            }
        }
    }
    return edges;
};

/**
 * Project a 4D point to 3D using perspective projection
 * @param point4D The 4D point [x, y, z, w]
 * @param wDistance Distance of the viewing hyperplane from origin in w-direction
 */
export const project4Dto3D = (
    point4D: number[],
    wDistance: number = 2
): [number, number, number] => {
    const [x, y, z, w] = point4D;
    const scale = wDistance / (wDistance - w);
    return [x * scale, y * scale, z * scale];
};

/**
 * Rotate a 4D point in the XW plane
 */
export const rotateXW = (point: number[], angle: number): number[] => {
    const [x, y, z, w] = point;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    return [
        x * cos - w * sin,
        y,
        z,
        x * sin + w * cos
    ];
};

/**
 * Rotate a 4D point in the YW plane
 */
export const rotateYW = (point: number[], angle: number): number[] => {
    const [x, y, z, w] = point;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    return [
        x,
        y * cos - w * sin,
        z,
        y * sin + w * cos
    ];
};

/**
 * Rotate a 4D point in the ZW plane
 */
export const rotateZW = (point: number[], angle: number): number[] => {
    const [x, y, z, w] = point;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    return [
        x,
        y,
        z * cos - w * sin,
        z * sin + w * cos
    ];
};

// ─────────────────────────────────────────────────────────────
// EXTRUSION PROGRESS (0 to 1)
// ─────────────────────────────────────────────────────────────

/**
 * Interpolate extrusion of a shape.
 * When progress = 0, we have the original shape.
 * When progress = 1, we have the fully extruded next-dimension shape.
 */
export const extrusionProgress = (progress: number): number => {
    return Math.max(0, Math.min(1, progress));
};

// ─────────────────────────────────────────────────────────────
// LINE SEGMENT (1D) PROPERTIES
// ─────────────────────────────────────────────────────────────

/**
 * Calculate the straight-line distance between two points.
 * This is the segment length (the 1D dimension created by moving a point).
 */
export const segmentLength = (
    startX: number,
    startY: number,
    endX: number,
    endY: number
): number => {
    const dx = endX - startX;
    const dy = endY - startY;
    return Math.sqrt(dx * dx + dy * dy);
};

/**
 * Calculate efficiency: ratio of segment length to distance traveled.
 * Returns a percentage (0-100).
 * A straight path has 100% efficiency; a wandering path has lower efficiency.
 */
export const movementEfficiency = (
    segmentLen: number,
    distanceTraveled: number
): number => {
    if (distanceTraveled === 0) return 0;
    return Math.min(100, (segmentLen / distanceTraveled) * 100);
};

/**
 * Get the budget color based on remaining budget.
 * Green (>66%), Yellow (33-66%), Red (<33%)
 */
export const budgetColor = (budget: number, maxBudget: number = 100): string => {
    const ratio = budget / maxBudget;
    if (ratio > 0.66) return '#22c55e'; // green
    if (ratio > 0.33) return '#F7B23B'; // amber/yellow
    return '#ef4444'; // red
};
