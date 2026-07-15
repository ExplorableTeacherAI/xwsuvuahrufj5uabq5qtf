/**
 * Variables Configuration
 * =======================
 * 
 * CENTRAL PLACE TO DEFINE ALL SHARED VARIABLES
 * 
 * This file defines all variables that can be shared across sections.
 * AI agents should read this file to understand what variables are available.
 * 
 * USAGE:
 * 1. Define variables here with their default values and metadata
 * 2. Use them in any section with: const x = useVar('variableName', defaultValue)
 * 3. Update them with: setVar('variableName', newValue)
 */

import { type VarValue } from '@/stores';

/**
 * Variable definition with metadata
 */
export interface VariableDefinition {
    /** Default value */
    defaultValue: VarValue;
    /** Human-readable label */
    label?: string;
    /** Description for AI agents */
    description?: string;
    /** Variable type hint */
    type?: 'number' | 'text' | 'boolean' | 'select' | 'array' | 'object' | 'spotColor' | 'linkedHighlight';
    /** Unit (e.g., 'Hz', '°', 'm/s') - for numbers */
    unit?: string;
    /** Minimum value (for number sliders) */
    min?: number;
    /** Maximum value (for number sliders) */
    max?: number;
    /** Step increment (for number sliders) */
    step?: number;
    /** Display color for InlineScrubbleNumber / InlineSpotColor (e.g. '#D81B60') */
    color?: string;
    /** Options for 'select' type variables */
    options?: string[];
    /** Placeholder text for text inputs */
    placeholder?: string;
    /** Correct answer for cloze input validation */
    correctAnswer?: string;
    /** Whether cloze matching is case sensitive */
    caseSensitive?: boolean;
    /** Background color for inline components */
    bgColor?: string;
    /** Schema hint for object types (for AI agents) */
    schema?: string;
}

/**
 * =====================================================
 * 🎯 DEFINE YOUR VARIABLES HERE
 * =====================================================
 * 
 * SUPPORTED TYPES:
 * 
 * 1. NUMBER (slider):
 *    { defaultValue: 5, type: 'number', min: 0, max: 10, step: 1 }
 * 
 * 2. TEXT (free text):
 *    { defaultValue: 'Hello', type: 'text', placeholder: 'Enter text...' }
 * 
 * 3. SELECT (dropdown):
 *    { defaultValue: 'sine', type: 'select', options: ['sine', 'cosine', 'tangent'] }
 * 
 * 4. BOOLEAN (toggle):
 *    { defaultValue: true, type: 'boolean' }
 * 
 * 5. ARRAY (list of numbers):
 *    { defaultValue: [1, 2, 3], type: 'array' }
 * 
 * 6. OBJECT (complex data):
 *    { defaultValue: { x: 5, y: 10 }, type: 'object', schema: '{ x: number, y: number }' }
 */
export const variableDefinitions: Record<string, VariableDefinition> = {
    // ========================================
    // TESSERACT LESSON VARIABLES
    // ========================================

    // ─────────────────────────────────────────
    // SECTION 0: What is a Point? (0D)
    // ─────────────────────────────────────────
    point0dClickX: {
        defaultValue: 0,
        type: 'number',
        label: 'Click X Position',
        description: 'X coordinate of the most recent click position',
        color: '#62D0AD',
    },
    point0dClickY: {
        defaultValue: 0,
        type: 'number',
        label: 'Click Y Position',
        description: 'Y coordinate of the most recent click position',
        color: '#62D0AD',
    },
    point0dMathWidth: {
        defaultValue: 0,
        type: 'number',
        label: 'Math Width',
        description: 'Width measured in mathematical universe (always 0)',
        color: '#8E90F5',
    },
    point0dPhysicalWidth: {
        defaultValue: 8,
        type: 'number',
        label: 'Physical Width',
        description: 'Width measured in physical universe (dot diameter in pixels)',
        color: '#F7B23B',
    },
    point0dMathArea: {
        defaultValue: 0,
        type: 'number',
        label: 'Math Area',
        description: 'Area in mathematical universe (always 0)',
        color: '#8E90F5',
    },
    point0dPhysicalArea: {
        defaultValue: 50.27,
        type: 'number',
        label: 'Physical Area',
        description: 'Area in physical universe (dot area in pixels²)',
        color: '#F7B23B',
    },
    point0dPointCount: {
        defaultValue: 0,
        type: 'number',
        label: 'Point Count',
        description: 'Number of points placed so far',
        color: '#62D0AD',
    },
    point0dHasPlacedPoint: {
        defaultValue: false,
        type: 'boolean',
        label: 'Has Placed Point',
        description: 'Whether at least one point has been placed',
    },
    answerPointDimension: {
        defaultValue: '',
        type: 'select',
        label: 'Point Dimension Answer',
        description: 'Student answer for what dimension a point has',
        placeholder: '?',
        correctAnswer: 'zero',
        options: ['zero', 'one', 'two', 'three'],
        color: '#8E90F5',
    },
    answerPointSize: {
        defaultValue: '',
        type: 'select',
        label: 'Point Size Answer',
        description: 'Student answer for what a mathematical point represents',
        placeholder: '?',
        correctAnswer: 'position only',
        options: ['a small dot', 'position only', 'a tiny circle', 'an atom'],
        color: '#62D0AD',
    },

    // ─────────────────────────────────────────
    // SECTION 1: Point to Line (0D → 1D) - Point Budget Game
    // ─────────────────────────────────────────
    pointToLineProgress: {
        defaultValue: 0,
        type: 'number',
        label: 'Extrusion Progress',
        description: 'How far the point has been dragged to create a line',
        min: 0,
        max: 1,
        step: 0.01,
        color: '#62D0AD',
    },
    line1d_startX: {
        defaultValue: 150,
        type: 'number',
        label: 'Start X',
        description: 'X coordinate of the starting point',
        color: '#62D0AD',
    },
    line1d_startY: {
        defaultValue: 150,
        type: 'number',
        label: 'Start Y',
        description: 'Y coordinate of the starting point',
        color: '#62D0AD',
    },
    line1d_currentX: {
        defaultValue: 150,
        type: 'number',
        label: 'Current X',
        description: 'X coordinate of the current point position',
        color: '#62D0AD',
    },
    line1d_currentY: {
        defaultValue: 150,
        type: 'number',
        label: 'Current Y',
        description: 'Y coordinate of the current point position',
        color: '#62D0AD',
    },
    line1d_budget: {
        defaultValue: 100,
        type: 'number',
        label: 'Movement Budget',
        description: 'Remaining movement budget (starts at 100)',
        min: 0,
        max: 100,
        color: '#22c55e',
    },
    line1d_distanceTraveled: {
        defaultValue: 0,
        type: 'number',
        label: 'Distance Traveled',
        description: 'Total distance traveled along the winding path',
        color: '#F7B23B',
    },
    line1d_segmentLength: {
        defaultValue: 0,
        type: 'number',
        label: 'Segment Length',
        description: 'Straight-line distance from start to current position',
        color: '#8E90F5',
    },
    line1d_efficiency: {
        defaultValue: 0,
        type: 'number',
        label: 'Efficiency',
        description: 'Ratio of segment length to distance traveled (0-100%)',
        min: 0,
        max: 100,
        color: '#AC8BF9',
    },
    line1d_hasStarted: {
        defaultValue: false,
        type: 'boolean',
        label: 'Game Started',
        description: 'Whether the game has started (starting point placed)',
    },
    line1d_isComplete: {
        defaultValue: false,
        type: 'boolean',
        label: 'Game Complete',
        description: 'Whether budget is exhausted',
    },
    answerLine1dSegmentDependsOn: {
        defaultValue: '',
        type: 'select',
        label: 'Segment Depends On',
        description: 'Student answer for what determines segment length',
        placeholder: '?',
        correctAnswer: 'endpoints only',
        options: ['the path taken', 'endpoints only', 'total distance', 'number of turns'],
        color: '#8E90F5',
    },
    answerLine1dDimension: {
        defaultValue: '',
        type: 'select',
        label: 'Line Dimension',
        description: 'Student answer for how many dimensions a line segment has',
        placeholder: '?',
        correctAnswer: 'one',
        options: ['zero', 'one', 'two', 'three'],
        color: '#62D0AD',
    },

    // ─────────────────────────────────────────
    // SECTION 2: Line to Square (1D → 2D)
    // ─────────────────────────────────────────
    lineToSquareProgress: {
        defaultValue: 0,
        type: 'number',
        label: 'Extrusion Progress',
        description: 'How far the line has been dragged to create a square',
        min: 0,
        max: 1,
        step: 0.01,
        color: '#8E90F5',
    },

    // ─────────────────────────────────────────
    // SECTION 3: Square to Cube (2D → 3D)
    // ─────────────────────────────────────────
    squareToCubeProgress: {
        defaultValue: 0,
        type: 'number',
        label: 'Extrusion Progress',
        description: 'How far the square has been dragged to create a cube',
        min: 0,
        max: 1,
        step: 0.01,
        color: '#F7B23B',
    },

    // ─────────────────────────────────────────
    // SECTION 4: Cube to Tesseract (3D → 4D)
    // ─────────────────────────────────────────
    cubeToTesseractProgress: {
        defaultValue: 0,
        type: 'number',
        label: 'Extrusion Progress',
        description: 'How far the cube has been dragged into the 4th dimension',
        min: 0,
        max: 1,
        step: 0.01,
        color: '#AC8BF9',
    },

    tesseractRotationXW: {
        defaultValue: 0,
        type: 'number',
        label: 'XW Rotation',
        description: 'Rotation angle in the XW plane (radians)',
        min: 0,
        max: 6.28,
        step: 0.01,
        color: '#62CCF9',
    },

    // ─────────────────────────────────────────
    // ASSESSMENT VARIABLES
    // ─────────────────────────────────────────
    answerLineVertices: {
        defaultValue: '',
        type: 'text',
        label: 'Line Vertices Answer',
        description: 'Student answer for number of vertices in a line',
        placeholder: '?',
        correctAnswer: '2',
        color: '#62D0AD',
    },

    answerSquareVertices: {
        defaultValue: '',
        type: 'text',
        label: 'Square Vertices Answer',
        description: 'Student answer for number of vertices in a square',
        placeholder: '?',
        correctAnswer: '4',
        color: '#8E90F5',
    },

    answerCubeVertices: {
        defaultValue: '',
        type: 'text',
        label: 'Cube Vertices Answer',
        description: 'Student answer for number of vertices in a cube',
        placeholder: '?',
        correctAnswer: '8',
        color: '#F7B23B',
    },

    answerTesseractVertices: {
        defaultValue: '',
        type: 'text',
        label: 'Tesseract Vertices Answer',
        description: 'Student answer for number of vertices in a tesseract',
        placeholder: '?',
        correctAnswer: '16',
        color: '#AC8BF9',
    },

    answerVertexPattern: {
        defaultValue: '',
        type: 'select',
        label: 'Vertex Pattern Answer',
        description: 'Student answer for the pattern of vertices',
        placeholder: '?',
        correctAnswer: 'doubles',
        options: ['doubles', 'adds 2', 'adds 4', 'triples'],
        color: '#F8A0CD',
    },

    answerNextDimension: {
        defaultValue: '',
        type: 'select',
        label: 'Next Dimension Method',
        description: 'Student answer for how to create the next dimension',
        placeholder: '?',
        correctAnswer: 'drag perpendicular',
        options: ['rotate it', 'drag perpendicular', 'copy it', 'stretch it'],
        color: '#7DD3C0',
    },
};

/**
 * Get all variable names (for AI agents to discover)
 */
export const getVariableNames = (): string[] => {
    return Object.keys(variableDefinitions);
};

/**
 * Get a variable's default value
 */
export const getDefaultValue = (name: string): VarValue => {
    return variableDefinitions[name]?.defaultValue ?? 0;
};

/**
 * Get a variable's metadata
 */
export const getVariableInfo = (name: string): VariableDefinition | undefined => {
    return variableDefinitions[name];
};

/**
 * Get all default values as a record (for initialization)
 */
export const getDefaultValues = (): Record<string, VarValue> => {
    const defaults: Record<string, VarValue> = {};
    for (const [name, def] of Object.entries(variableDefinitions)) {
        defaults[name] = def.defaultValue;
    }
    return defaults;
};

/**
 * Get number props for InlineScrubbleNumber from a variable definition.
 * Use with getVariableInfo(name) in blocks.tsx, or getExampleVariableInfo(name) in exampleBlocks.tsx.
 */
export function numberPropsFromDefinition(def: VariableDefinition | undefined): {
    defaultValue?: number;
    min?: number;
    max?: number;
    step?: number;
    color?: string;
} {
    if (!def || def.type !== 'number') return {};
    return {
        defaultValue: def.defaultValue as number,
        min: def.min,
        max: def.max,
        step: def.step,
        ...(def.color ? { color: def.color } : {}),
    };
}

/**
 * Get cloze input props for InlineClozeInput from a variable definition.
 * Use with getVariableInfo(name) in blocks.tsx, or getExampleVariableInfo(name) in exampleBlocks.tsx.
 */
/**
 * Get cloze choice props for InlineClozeChoice from a variable definition.
 * Use with getVariableInfo(name) in blocks.tsx.
 */
export function choicePropsFromDefinition(def: VariableDefinition | undefined): {
    placeholder?: string;
    color?: string;
    bgColor?: string;
} {
    if (!def || def.type !== 'select') return {};
    return {
        ...(def.placeholder ? { placeholder: def.placeholder } : {}),
        ...(def.color ? { color: def.color } : {}),
        ...(def.bgColor ? { bgColor: def.bgColor } : {}),
    };
}

/**
 * Get toggle props for InlineToggle from a variable definition.
 * Use with getVariableInfo(name) in blocks.tsx.
 */
export function togglePropsFromDefinition(def: VariableDefinition | undefined): {
    color?: string;
    bgColor?: string;
} {
    if (!def || def.type !== 'select') return {};
    return {
        ...(def.color ? { color: def.color } : {}),
        ...(def.bgColor ? { bgColor: def.bgColor } : {}),
    };
}

export function clozePropsFromDefinition(def: VariableDefinition | undefined): {
    placeholder?: string;
    color?: string;
    bgColor?: string;
    caseSensitive?: boolean;
} {
    if (!def || def.type !== 'text') return {};
    return {
        ...(def.placeholder ? { placeholder: def.placeholder } : {}),
        ...(def.color ? { color: def.color } : {}),
        ...(def.bgColor ? { bgColor: def.bgColor } : {}),
        ...(def.caseSensitive !== undefined ? { caseSensitive: def.caseSensitive } : {}),
    };
}

/**
 * Get spot-color props for InlineSpotColor from a variable definition.
 * Extracts the `color` field.
 *
 * @example
 * <InlineSpotColor
 *     varName="radius"
 *     {...spotColorPropsFromDefinition(getVariableInfo('radius'))}
 * >
 *     radius
 * </InlineSpotColor>
 */
export function spotColorPropsFromDefinition(def: VariableDefinition | undefined): {
    color: string;
} {
    return {
        color: def?.color ?? '#8B5CF6',
    };
}

/**
 * Get linked-highlight props for InlineLinkedHighlight from a variable definition.
 * Extracts the `color` and `bgColor` fields.
 *
 * @example
 * <InlineLinkedHighlight
 *     varName="activeHighlight"
 *     highlightId="radius"
 *     {...linkedHighlightPropsFromDefinition(getVariableInfo('activeHighlight'))}
 * >
 *     radius
 * </InlineLinkedHighlight>
 */
export function linkedHighlightPropsFromDefinition(def: VariableDefinition | undefined): {
    color?: string;
    bgColor?: string;
} {
    return {
        ...(def?.color ? { color: def.color } : {}),
        ...(def?.bgColor ? { bgColor: def.bgColor } : {}),
    };
}

/**
 * Build the `variables` prop for FormulaBlock from variable definitions.
 *
 * Takes an array of variable names and returns the config map expected by
 * `<FormulaBlock variables={...} />`.
 *
 * @example
 * import { scrubVarsFromDefinitions } from './variables';
 *
 * <FormulaBlock
 *     latex="\scrub{mass} \times \scrub{accel}"
 *     variables={scrubVarsFromDefinitions(['mass', 'accel'])}
 * />
 */
export function scrubVarsFromDefinitions(
    varNames: string[],
): Record<string, { min?: number; max?: number; step?: number; color?: string }> {
    const result: Record<string, { min?: number; max?: number; step?: number; color?: string }> = {};
    for (const name of varNames) {
        const def = variableDefinitions[name];
        if (!def) continue;
        result[name] = {
            ...(def.min !== undefined ? { min: def.min } : {}),
            ...(def.max !== undefined ? { max: def.max } : {}),
            ...(def.step !== undefined ? { step: def.step } : {}),
            ...(def.color ? { color: def.color } : {}),
        };
    }
    return result;
}
