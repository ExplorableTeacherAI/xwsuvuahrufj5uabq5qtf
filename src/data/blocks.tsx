import { type ReactElement } from "react";

// Initialize variables and their colors from this file's variable definitions
import { useVariableStore, initializeVariableColors } from "@/stores";
import { getDefaultValues, variableDefinitions } from "./variables";
useVariableStore.getState().initialize(getDefaultValues());
initializeVariableColors(variableDefinitions);

// Import section blocks
import { point0dBlocks } from "./sections/point-0d";

import { line1dBlocks } from "./sections/line-1d";

/**
 * ------------------------------------------------------------------
 * BUILDING A TESSERACT: From Point to 4D
 * ------------------------------------------------------------------
 *
 * This lesson teaches how dimensions build on each other:
 * - Section 1: Point (0D) - A position with no size
 * - Section 2: Line (1D) - Drag a point to create length
 * - Section 3: Square (2D) - Drag a line to create width
 * - Section 4: Cube (3D) - Drag a square to create depth
 * - Section 5: Tesseract (4D) - Drag a cube into the 4th dimension
 *
 * Each section reveals the same pattern: dragging perpendicular creates
 * the next dimension.
 */

export const blocks: ReactElement[] = [
    ...point0dBlocks,
    // Additional sections will be added as they are built
    ...line1dBlocks,
];
