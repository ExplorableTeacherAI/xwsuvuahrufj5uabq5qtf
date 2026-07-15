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

// ─────────────────────────────────────────────────────────────
// SQUARE (2D) PROPERTIES - LINE SWEEP
// ─────────────────────────────────────────────────────────────

/**
 * Calculate the current X position of the sweeping line based on progress.
 * Progress 0 = line at start position, Progress 1 = line at end position.
 */
export const sweepLineX = (
    startX: number,
    endX: number,
    progress: number
): number => {
    return startX + (endX - startX) * Math.min(1, Math.max(0, progress));
};

/**
 * Calculate the swept area at current progress.
 * Area = width × height, where width is proportional to progress.
 */
export const sweptArea = (
    startX: number,
    endX: number,
    y1: number,
    y2: number,
    progress: number
): number => {
    const width = (endX - startX) * Math.min(1, Math.max(0, progress));
    const height = Math.abs(y2 - y1);
    return width * height;
};

/**
 * Calculate the number of "positions included" based on progress.
 * This simulates the infinite intermediate positions by showing a count
 * that grows with progress (conceptually infinite, but capped for display).
 */
export const positionsIncluded = (progress: number, maxPositions: number = 100): number => {
    return Math.floor(progress * maxPositions);
};

// ─────────────────────────────────────────────────────────────
// CUBE (3D) PROPERTIES - SQUARE EXTRUSION
// ─────────────────────────────────────────────────────────────

/**
 * Calculate the volume of a cube during extrusion.
 * At extrusion = 0, volume = 0 (flat square)
 * At extrusion = 1, volume = sideLength³
 */
export const cubeVolume = (sideLength: number, extrusionDepth: number): number => {
    const depth = Math.max(0, Math.min(1, extrusionDepth));
    return sideLength * sideLength * sideLength * depth;
};

/**
 * Calculate the number of visible vertices during cube extrusion.
 * At extrusion = 0: 4 vertices (just the square)
 * At extrusion > 0: 8 vertices (full cube structure visible)
 */
export const cubeVerticesVisible = (extrusionDepth: number): number => {
    return extrusionDepth > 0 ? 8 : 4;
};

/**
 * Calculate the number of visible edges during cube extrusion.
 * At extrusion = 0: 4 edges (just the square)
 * At extrusion > 0: 12 edges (full cube structure visible)
 */
export const cubeEdgesVisible = (extrusionDepth: number): number => {
    return extrusionDepth > 0 ? 12 : 4;
};

/**
 * Calculate the number of visible faces during cube extrusion.
 * At extrusion = 0: 1 face (just the square)
 * At extrusion > 0 but < 1: Shows base, top, and 4 side faces forming
 * At extrusion = 1: 6 faces (complete cube)
 */
export const cubeFacesVisible = (extrusionDepth: number): number => {
    if (extrusionDepth <= 0) return 1;
    if (extrusionDepth >= 1) return 6;
    // During extrusion, we see base + top + 4 side faces partially
    return 6;
};

/**
 * Number of ghost cross-section squares to show during extrusion.
 * More cross-sections at higher extrusion depths to emphasize the sweep.
 */
export const cubeCrossSections = (extrusionDepth: number): number => {
    if (extrusionDepth <= 0) return 0;
    // Show up to 5 ghost squares evenly spaced
    return Math.min(5, Math.floor(extrusionDepth * 6));
};

/**
 * Generate positions for ghost cross-section squares.
 * Returns an array of depth values (0 to current depth) where ghost squares should appear.
 */
export const cubeCrossSectionPositions = (extrusionDepth: number, count: number): number[] => {
    if (count <= 0 || extrusionDepth <= 0) return [];
    const positions: number[] = [];
    for (let i = 1; i <= count; i++) {
        positions.push((i / (count + 1)) * extrusionDepth);
    }
    return positions;
};

// ─────────────────────────────────────────────────────────────
// SIDE-BY-SIDE SWEEP VISUALIZATION (Tesseract Section)
// ─────────────────────────────────────────────────────────────

/**
 * Calculate vertices during sweep for left panel (square → cube).
 * At sweep = 0: 4 vertices (just the square)
 * At sweep > 0: 8 vertices (original + copy)
 */
export const squareToCubeVertices = (sweepProgress: number): number => {
    return sweepProgress > 0 ? 8 : 4;
};

/**
 * Calculate edges during sweep for left panel (square → cube).
 * At sweep = 0: 4 edges (just the square)
 * At sweep > 0: 12 edges (4 original + 4 copy + 4 connecting)
 */
export const squareToCubeEdges = (sweepProgress: number): number => {
    return sweepProgress > 0 ? 12 : 4;
};

/**
 * Calculate faces during sweep for left panel (square → cube).
 * At sweep = 0: 1 face (just the square)
 * At sweep > 0: 6 faces (2 squares + 4 rectangles)
 */
export const squareToCubeFaces = (sweepProgress: number): number => {
    return sweepProgress > 0 ? 6 : 1;
};

/**
 * Calculate vertices during sweep for right panel (cube → tesseract).
 * At sweep = 0: 8 vertices (just the cube)
 * At sweep > 0: 16 vertices (original + copy)
 */
export const cubeToTesseractVertices = (sweepProgress: number): number => {
    return sweepProgress > 0 ? 16 : 8;
};

/**
 * Calculate edges during sweep for right panel (cube → tesseract).
 * At sweep = 0: 12 edges (just the cube)
 * At sweep > 0: 32 edges (12 original + 12 copy + 8 connecting)
 */
export const cubeToTesseractEdges = (sweepProgress: number): number => {
    return sweepProgress > 0 ? 32 : 12;
};

/**
 * Calculate faces during sweep for right panel (cube → tesseract).
 * At sweep = 0: 6 faces (just the cube)
 * At sweep > 0: 24 faces (6 original + 6 copy + 12 connecting)
 */
export const cubeToTesseractFaces = (sweepProgress: number): number => {
    return sweepProgress > 0 ? 24 : 6;
};

/**
 * Calculate cells (3D facets) during sweep for right panel (cube → tesseract).
 * At sweep = 0: 0 cells (cube has no 3D interior structure as a cell)
 * At sweep > 0: 8 cells (the cube sweeps through 4D, creating 8 cubic cells)
 */
export const cubeToTesseractCells = (sweepProgress: number): number => {
    return sweepProgress > 0 ? 8 : 0;
};

/**
 * Generate 2D square vertices for left panel visualization.
 * Returns 4 corner points of a square centered at origin.
 */
export const squareVertices2D = (size: number): [number, number][] => {
    const half = size / 2;
    return [
        [-half, -half],
        [half, -half],
        [half, half],
        [-half, half],
    ];
};

/**
 * Generate 2D cube projection (isometric) for left panel.
 * Returns 8 vertices of a cube projected to 2D with isometric view.
 */
export const cubeVertices2DIsometric = (
    size: number,
    depth: number,
    sweepProgress: number
): [number, number][] => {
    const half = size / 2;
    const offset = depth * sweepProgress;
    // Isometric offset direction: up and to the right
    const isoX = offset * 0.5;
    const isoY = offset * 0.5;

    // Back face (original square)
    const backFace: [number, number][] = [
        [-half, -half],
        [half, -half],
        [half, half],
        [-half, half],
    ];

    // Front face (swept copy)
    const frontFace: [number, number][] = [
        [-half + isoX, -half + isoY],
        [half + isoX, -half + isoY],
        [half + isoX, half + isoY],
        [-half + isoX, half + isoY],
    ];

    return [...backFace, ...frontFace];
};

/**
 * Generate 3D cube vertices.
 * Returns 8 vertices of a cube centered at origin.
 */
export const cubeVertices3D = (size: number): [number, number, number][] => {
    const half = size / 2;
    return [
        [-half, -half, -half],
        [half, -half, -half],
        [half, half, -half],
        [-half, half, -half],
        [-half, -half, half],
        [half, -half, half],
        [half, half, half],
        [-half, half, half],
    ];
};

/**
 * Generate cube edges as pairs of vertex indices.
 */
export const cubeEdgeIndices = (): [number, number][] => {
    return [
        // Back face
        [0, 1], [1, 2], [2, 3], [3, 0],
        // Front face
        [4, 5], [5, 6], [6, 7], [7, 4],
        // Connecting edges
        [0, 4], [1, 5], [2, 6], [3, 7],
    ];
};

/**
 * Generate tesseract (hypercube) vertices during construction.
 * When sweepProgress = 0: returns the 8 vertices of the inner cube
 * When sweepProgress > 0: returns all 16 vertices
 *
 * The 4D w-coordinate determines inner vs outer cube.
 */
export const tesseractVerticesDuring4DSweep = (
    size: number,
    sweepProgress: number
): [number, number, number, number][] => {
    const half = size / 2;
    const wOffset = sweepProgress * size;

    const vertices: [number, number, number, number][] = [];

    // Inner cube (w = 0)
    for (let x = -1; x <= 1; x += 2) {
        for (let y = -1; y <= 1; y += 2) {
            for (let z = -1; z <= 1; z += 2) {
                vertices.push([x * half, y * half, z * half, 0]);
            }
        }
    }

    // Outer cube (w = wOffset) - only if sweepProgress > 0
    if (sweepProgress > 0) {
        for (let x = -1; x <= 1; x += 2) {
            for (let y = -1; y <= 1; y += 2) {
                for (let z = -1; z <= 1; z += 2) {
                    vertices.push([x * half, y * half, z * half, wOffset]);
                }
            }
        }
    }

    return vertices;
};

/**
 * Project a 4D point to 3D using stereographic projection.
 * This creates the characteristic "cube within a cube" appearance.
 */
export const project4Dto3DStereographic = (
    point: [number, number, number, number],
    wDistance: number = 3
): [number, number, number] => {
    const [x, y, z, w] = point;
    const scale = wDistance / (wDistance - w);
    return [x * scale, y * scale, z * scale];
};
