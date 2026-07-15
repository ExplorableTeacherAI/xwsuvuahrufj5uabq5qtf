import { type ReactElement, useEffect, useCallback, Suspense, useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera, Line, Text } from "@react-three/drei";
import * as THREE from "three";
import { StackLayout } from "@/components/layouts";
import { Block } from "@/components/templates";
import {
    EditableH2,
    EditableParagraph,
    InlineClozeChoice,
    InlineFeedback,
    InlineSpotColor,
    InlineTooltip,
    InteractionHintSequence,
    Slider,
} from "@/components/atoms";
import { useVar, useSetVar } from "@/stores";
import {
    getVariableInfo,
    choicePropsFromDefinition,
} from "../variables";
import {
    squareToCubeVertices,
    squareToCubeEdges,
    squareToCubeFaces,
    cubeToTesseractVertices,
    cubeToTesseractEdges,
    cubeToTesseractFaces,
    cubeToTesseractCells,
    tesseractVerticesDuring4DSweep,
    project4Dto3DStereographic,
    cubeEdgeIndices,
} from "../model";

// ══════════════════════════════════════════════════════════════════════════════
// SECTION: Tesseract (3D → 4D) - Side-by-Side Construction Comparison
// ══════════════════════════════════════════════════════════════════════════════
//
// Learning objective: Understand that a tesseract is created by dragging a cube
// into the fourth dimension, and we can only see its 3D shadow/projection. The
// aha moment: the 4D construction process follows the exact same geometric logic
// as building a 3D cube from a 2D square — the pattern is identical.
//
// Design: Side-by-side comparison. Left panel shows square → cube construction.
// Right panel shows cube → tesseract construction. SAME slider controls both,
// revealing the parallel pattern.
// ══════════════════════════════════════════════════════════════════════════════

// ── Constants ────────────────────────────────────────────────────────────────
const AMBER = "#F7B23B";
const VIOLET = "#AC8BF9";
const SIZE = 1.5;
const SWEEP_DEPTH = 1.5;

// ── Left Panel: Square → Cube (2D) ───────────────────────────────────────────

interface SquareToCubeProps {
    sweepProgress: number;
}

function SquareToCubeScene({ sweepProgress }: SquareToCubeProps) {
    const half = SIZE / 2;
    const offset = sweepProgress * SWEEP_DEPTH;

    // Back face vertices (original square)
    const backVertices: [number, number, number][] = [
        [-half, -half, 0],
        [half, -half, 0],
        [half, half, 0],
        [-half, half, 0],
    ];

    // Front face vertices (swept copy)
    const frontVertices: [number, number, number][] = [
        [-half, -half, offset],
        [half, -half, offset],
        [half, half, offset],
        [-half, half, offset],
    ];

    // Edge indices for a square
    const squareEdges: [number, number][] = [[0, 1], [1, 2], [2, 3], [3, 0]];

    return (
        <>
            {/* Lighting */}
            <ambientLight intensity={0.6} />
            <directionalLight position={[3, 4, 5]} intensity={0.7} />

            {/* Back face (ghost at origin) */}
            <mesh position={[0, 0, 0]} userData-concept="tesseract4d_leftFaces">
                <planeGeometry args={[SIZE, SIZE]} />
                <meshStandardMaterial
                    color={AMBER}
                    transparent
                    opacity={0.25}
                    side={THREE.DoubleSide}
                />
            </mesh>

            {/* Back face edges */}
            {squareEdges.map(([i, j], idx) => (
                <Line
                    key={`back-edge-${idx}`}
                    points={[backVertices[i], backVertices[j]]}
                    color={AMBER}
                    lineWidth={2}
                    transparent
                    opacity={0.5}
                />
            ))}

            {/* Front face (moving) */}
            {sweepProgress > 0 && (
                <>
                    <mesh position={[0, 0, offset]}>
                        <planeGeometry args={[SIZE, SIZE]} />
                        <meshStandardMaterial
                            color={AMBER}
                            transparent
                            opacity={0.7}
                            side={THREE.DoubleSide}
                        />
                    </mesh>

                    {/* Front face edges */}
                    {squareEdges.map(([i, j], idx) => (
                        <Line
                            key={`front-edge-${idx}`}
                            points={[frontVertices[i], frontVertices[j]]}
                            color={AMBER}
                            lineWidth={2}
                        />
                    ))}

                    {/* Connecting edges */}
                    {backVertices.map((backV, idx) => (
                        <Line
                            key={`connect-edge-${idx}`}
                            points={[backV, frontVertices[idx]]}
                            color={AMBER}
                            lineWidth={1.5}
                            transparent
                            opacity={0.8}
                            userData-concept="tesseract4d_leftEdges"
                        />
                    ))}

                    {/* Side faces (semi-transparent) */}
                    {[0, 1, 2, 3].map((i) => {
                        const j = (i + 1) % 4;
                        const points = [
                            backVertices[i],
                            backVertices[j],
                            frontVertices[j],
                            frontVertices[i],
                        ];
                        return (
                            <mesh key={`side-${i}`}>
                                <bufferGeometry>
                                    <bufferAttribute
                                        attach="attributes-position"
                                        args={[
                                            new Float32Array([
                                                ...points[0], ...points[1], ...points[2],
                                                ...points[0], ...points[2], ...points[3],
                                            ]),
                                            3,
                                        ]}
                                    />
                                </bufferGeometry>
                                <meshStandardMaterial
                                    color={AMBER}
                                    transparent
                                    opacity={0.15}
                                    side={THREE.DoubleSide}
                                />
                            </mesh>
                        );
                    })}
                </>
            )}

            {/* Vertices */}
            {backVertices.map((pos, i) => (
                <mesh key={`back-v-${i}`} position={pos} userData-concept="tesseract4d_leftVertices">
                    <sphereGeometry args={[0.06, 12, 12]} />
                    <meshStandardMaterial color={AMBER} />
                </mesh>
            ))}
            {sweepProgress > 0 && frontVertices.map((pos, i) => (
                <mesh key={`front-v-${i}`} position={pos}>
                    <sphereGeometry args={[0.06, 12, 12]} />
                    <meshStandardMaterial color={AMBER} />
                </mesh>
            ))}

            {/* Label */}
            <Text
                position={[0, -half - 0.4, offset / 2]}
                fontSize={0.15}
                color="#666"
                anchorX="center"
            >
                2D → 3D
            </Text>
        </>
    );
}

// ── Right Panel: Cube → Tesseract (3D → 4D) ──────────────────────────────────

interface CubeToTesseractProps {
    sweepProgress: number;
}

function CubeToTesseractScene({ sweepProgress }: CubeToTesseractProps) {
    // Generate 4D vertices and project to 3D
    const vertices4D = useMemo(
        () => tesseractVerticesDuring4DSweep(SIZE, sweepProgress),
        [sweepProgress]
    );

    const vertices3D = useMemo(
        () => vertices4D.map((v) => project4Dto3DStereographic(v, 4)),
        [vertices4D]
    );

    const cubeEdges = cubeEdgeIndices();

    // Inner cube (first 8 vertices)
    const innerVertices = vertices3D.slice(0, 8);
    // Outer cube (vertices 8-15, only if sweep > 0)
    const outerVertices = sweepProgress > 0 ? vertices3D.slice(8, 16) : [];

    return (
        <>
            {/* Lighting */}
            <ambientLight intensity={0.6} />
            <directionalLight position={[3, 4, 5]} intensity={0.7} />

            {/* Inner cube edges (ghost) */}
            {cubeEdges.map(([i, j], idx) => (
                <Line
                    key={`inner-edge-${idx}`}
                    points={[innerVertices[i], innerVertices[j]]}
                    color={VIOLET}
                    lineWidth={sweepProgress > 0 ? 1.5 : 2}
                    transparent
                    opacity={sweepProgress > 0 ? 0.4 : 1}
                />
            ))}

            {/* Inner cube faces (very transparent) */}
            <mesh userData-concept="tesseract4d_rightFaces">
                <boxGeometry args={[SIZE, SIZE, SIZE]} />
                <meshStandardMaterial
                    color={VIOLET}
                    transparent
                    opacity={sweepProgress > 0 ? 0.1 : 0.2}
                    side={THREE.DoubleSide}
                />
            </mesh>

            {/* Outer cube (only when sweep > 0) */}
            {sweepProgress > 0 && outerVertices.length === 8 && (
                <>
                    {/* Outer cube edges */}
                    {cubeEdges.map(([i, j], idx) => (
                        <Line
                            key={`outer-edge-${idx}`}
                            points={[outerVertices[i], outerVertices[j]]}
                            color={VIOLET}
                            lineWidth={2}
                            userData-concept="tesseract4d_rightEdges"
                        />
                    ))}

                    {/* Connecting edges (8 edges from inner to outer) */}
                    {innerVertices.map((innerV, idx) => (
                        <Line
                            key={`connect-${idx}`}
                            points={[innerV, outerVertices[idx]]}
                            color={VIOLET}
                            lineWidth={1.5}
                            transparent
                            opacity={0.7}
                        />
                    ))}
                </>
            )}

            {/* Inner cube vertices */}
            {innerVertices.map((pos, i) => (
                <mesh key={`inner-v-${i}`} position={pos} userData-concept="tesseract4d_rightVertices">
                    <sphereGeometry args={[0.05, 12, 12]} />
                    <meshStandardMaterial color={VIOLET} opacity={sweepProgress > 0 ? 0.5 : 1} transparent />
                </mesh>
            ))}

            {/* Outer cube vertices */}
            {outerVertices.map((pos, i) => (
                <mesh key={`outer-v-${i}`} position={pos}>
                    <sphereGeometry args={[0.06, 12, 12]} />
                    <meshStandardMaterial color={VIOLET} />
                </mesh>
            ))}

            {/* Label */}
            <Text
                position={[0, -SIZE / 2 - 0.5, 0]}
                fontSize={0.15}
                color="#666"
                anchorX="center"
            >
                3D → 4D
            </Text>
        </>
    );
}

// ── Stats Display Component ──────────────────────────────────────────────────

interface StatsDisplayProps {
    label: string;
    vertices: number;
    edges: number;
    faces: number;
    cells?: number;
    color: string;
    conceptPrefix: string;
}

function StatsDisplay({ label, vertices, edges, faces, cells, color, conceptPrefix }: StatsDisplayProps) {
    return (
        <div className="text-center space-y-1">
            <div className="text-sm font-medium text-slate-600">{label}</div>
            <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs">
                <span>
                    Vertices:{" "}
                    <span className="font-bold" style={{ color }} data-concept={`${conceptPrefix}_vertices`}>
                        {vertices}
                    </span>
                </span>
                <span>
                    Edges:{" "}
                    <span className="font-bold" style={{ color }} data-concept={`${conceptPrefix}_edges`}>
                        {edges}
                    </span>
                </span>
                <span>
                    Faces:{" "}
                    <span className="font-bold" style={{ color }} data-concept={`${conceptPrefix}_faces`}>
                        {faces}
                    </span>
                </span>
                {cells !== undefined && (
                    <span>
                        Cells:{" "}
                        <span className="font-bold" style={{ color }} data-concept={`${conceptPrefix}_cells`}>
                            {cells}
                        </span>
                    </span>
                )}
            </div>
        </div>
    );
}

// ── Main Side-by-Side Visualization ──────────────────────────────────────────

function TesseractComparisonVisualization() {
    const setVar = useSetVar();

    // Read from store
    const sweepProgress = useVar("tesseract4d_sweepProgress", 0) as number;
    const hasInteracted = useVar("tesseract4d_hasInteracted", false) as boolean;

    // Compute derived values from model
    const leftVertices = squareToCubeVertices(sweepProgress);
    const leftEdges = squareToCubeEdges(sweepProgress);
    const leftFaces = squareToCubeFaces(sweepProgress);

    const rightVertices = cubeToTesseractVertices(sweepProgress);
    const rightEdges = cubeToTesseractEdges(sweepProgress);
    const rightFaces = cubeToTesseractFaces(sweepProgress);
    const rightCells = cubeToTesseractCells(sweepProgress);

    // Update derived store variables
    useEffect(() => {
        setVar("tesseract4d_leftVertices", leftVertices);
        setVar("tesseract4d_leftEdges", leftEdges);
        setVar("tesseract4d_leftFaces", leftFaces);
        setVar("tesseract4d_rightVertices", rightVertices);
        setVar("tesseract4d_rightEdges", rightEdges);
        setVar("tesseract4d_rightFaces", rightFaces);
        setVar("tesseract4d_rightCells", rightCells);
    }, [leftVertices, leftEdges, leftFaces, rightVertices, rightEdges, rightFaces, rightCells, setVar]);

    const handleSliderChange = useCallback((value: number[]) => {
        if (!hasInteracted) {
            setVar("tesseract4d_hasInteracted", true);
        }
        setVar("tesseract4d_sweepProgress", value[0]);
    }, [hasInteracted, setVar]);

    const handleReset = useCallback(() => {
        setVar("tesseract4d_sweepProgress", 0);
        setVar("tesseract4d_hasInteracted", false);
    }, [setVar]);

    return (
        <div className="flex flex-col gap-4" data-concept="tesseract4d_sweepProgress">
            {/* Side-by-side 3D canvases */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Left: Square → Cube */}
                <div className="flex flex-col gap-2">
                    <StatsDisplay
                        label="Square → Cube"
                        vertices={leftVertices}
                        edges={leftEdges}
                        faces={leftFaces}
                        color={AMBER}
                        conceptPrefix="tesseract4d_left"
                    />
                    <div className="relative bg-white rounded-lg border border-slate-200" style={{ height: 280 }}>
                        <Canvas dpr={[1, 2]}>
                            <PerspectiveCamera makeDefault position={[2.5, 2, 3]} fov={45} />
                            <Suspense fallback={null}>
                                <SquareToCubeScene sweepProgress={sweepProgress} />
                            </Suspense>
                            <OrbitControls enableDamping dampingFactor={0.1} />
                        </Canvas>
                    </div>
                </div>

                {/* Right: Cube → Tesseract */}
                <div className="flex flex-col gap-2">
                    <StatsDisplay
                        label="Cube → Tesseract"
                        vertices={rightVertices}
                        edges={rightEdges}
                        faces={rightFaces}
                        cells={rightCells}
                        color={VIOLET}
                        conceptPrefix="tesseract4d_right"
                    />
                    <div className="relative bg-white rounded-lg border border-slate-200" style={{ height: 280 }}>
                        <Canvas dpr={[1, 2]}>
                            <PerspectiveCamera makeDefault position={[3, 2.5, 4]} fov={45} />
                            <Suspense fallback={null}>
                                <CubeToTesseractScene sweepProgress={sweepProgress} />
                            </Suspense>
                            <OrbitControls enableDamping dampingFactor={0.1} />
                        </Canvas>

                        {/* Interaction hint for right panel */}
                        {!hasInteracted && (
                            <InteractionHintSequence
                                hintKey="tesseract-4d-orbit"
                                steps={[
                                    {
                                        gesture: "orbit-3d",
                                        label: "Drag to rotate the view",
                                        position: { x: "50%", y: "50%" },
                                    },
                                ]}
                            />
                        )}
                    </div>
                </div>
            </div>

            {/* Shared sweep slider */}
            <div className="flex flex-col items-center gap-3 px-4">
                <div className="text-sm text-slate-500">
                    Sweep progress:{" "}
                    <span className="font-bold" style={{ color: VIOLET }}>
                        {Math.round(sweepProgress * 100)}%
                    </span>
                </div>
                <div className="w-full max-w-md relative">
                    <Slider
                        value={[sweepProgress]}
                        onValueChange={handleSliderChange}
                        min={0}
                        max={1}
                        step={0.01}
                        className="w-full"
                    />
                    {!hasInteracted && (
                        <InteractionHintSequence
                            hintKey="tesseract-4d-slider"
                            steps={[
                                {
                                    gesture: "drag-horizontal",
                                    label: "Drag to sweep both shapes",
                                    position: { x: "50%", y: "50%" },
                                },
                            ]}
                        />
                    )}
                </div>
                <div className="flex gap-4 text-xs text-slate-400">
                    <span>Start</span>
                    <span className="flex-1" />
                    <span>Complete</span>
                </div>
            </div>

            {/* Reset button */}
            {hasInteracted && sweepProgress > 0 && (
                <div className="flex justify-center">
                    <button
                        onClick={handleReset}
                        className="px-4 py-2 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50 transition-colors text-sm"
                    >
                        Reset to start
                    </button>
                </div>
            )}

            {/* Completion message */}
            {sweepProgress >= 0.95 && (
                <div
                    className="text-sm font-medium px-4 py-2 rounded-lg text-center"
                    style={{ backgroundColor: "rgba(172, 139, 249, 0.15)", color: VIOLET }}
                >
                    The pattern is clear: vertices double each time (4 → 8 → 16)
                </div>
            )}
        </div>
    );
}

// ══════════════════════════════════════════════════════════════════════════════
// EXPORTED BLOCKS
// ══════════════════════════════════════════════════════════════════════════════

export const tesseract4dBlocks: ReactElement[] = [
    // ── Section Title ────────────────────────────────────────────────────────
    <StackLayout key="layout-tesseract-title" maxWidth="xl">
        <Block id="tesseract-title" padding="md">
            <EditableH2 id="h2-tesseract-title" blockId="tesseract-title">
                The Fourth Dimension: Building a Tesseract
            </EditableH2>
        </Block>
    </StackLayout>,

    // ── Interactive Construction Visualization ───────────────────────────────
    <StackLayout key="layout-tesseract-visualization" maxWidth="2xl">
        <Block id="tesseract-visualization" padding="md" hasVisualization>
            <TesseractComparisonVisualization />
        </Block>
    </StackLayout>,

    // ── The Pattern Revealed ─────────────────────────────────────────────────
    <StackLayout key="layout-tesseract-pattern" maxWidth="xl">
        <Block id="tesseract-pattern" padding="sm">
            <EditableParagraph id="para-tesseract-pattern" blockId="tesseract-pattern">
                On the left, a{" "}
                <InlineSpotColor varName="tesseract4d_leftVertices" color={AMBER}>
                    square
                </InlineSpotColor>
                {" "}sweeps into a cube. On the right, a{" "}
                <InlineSpotColor varName="tesseract4d_rightVertices" color={VIOLET}>
                    cube
                </InlineSpotColor>
                {" "}sweeps into a tesseract.
            </EditableParagraph>
        </Block>
    </StackLayout>,

    // ── Key Insight ──────────────────────────────────────────────────────────
    <StackLayout key="layout-tesseract-insight" maxWidth="xl">
        <Block id="tesseract-insight" padding="sm">
            <EditableParagraph id="para-tesseract-insight" blockId="tesseract-insight">
                What you see on the right is a{" "}
                <InlineTooltip
                    id="tooltip-projection"
                    tooltip="Just as a 3D cube casts a 2D shadow on a wall, a 4D tesseract casts a 3D shadow into our space. The inner cube is the 'near' face; the outer cube is the 'far' face."
                >
                    3D shadow
                </InlineTooltip>
                {" "}of the tesseract.
            </EditableParagraph>
        </Block>
    </StackLayout>,

    // ── Assessment Question 1 ────────────────────────────────────────────────
    <StackLayout key="layout-tesseract-question-pattern" maxWidth="xl">
        <Block id="tesseract-question-pattern" padding="md">
            <EditableParagraph id="para-tesseract-question-pattern" blockId="tesseract-question-pattern">
                When you move up one dimension (point → line → square → cube → tesseract), the number of vertices{" "}
                <InlineFeedback
                    varName="answerTesseract4dVerticesPattern"
                    correctValue="doubles each time"
                    position="terminal"
                    successMessage="— exactly! The pattern is 1 → 2 → 4 → 8 → 16. Each new dimension creates a copy and connects the copies"
                    failureMessage="— not quite."
                    hint="Look at the vertex counts: 4 → 8 on the left, 8 → 16 on the right"
                    reviewBlockId="tesseract-visualization"
                    reviewLabel="Watch the vertex counts"
                    visualizationHint={{
                        blockId: "tesseract-visualization",
                        hintKey: "feedback-tesseract-pattern-hint",
                        steps: [
                            {
                                gesture: "drag-horizontal",
                                label: "Drag the slider slowly and watch the vertex counts change",
                                position: { x: "50%", y: "85%" },
                            },
                        ],
                        label: "See the pattern",
                        resetVars: { tesseract4d_sweepProgress: 0 },
                    }}
                >
                    <InlineClozeChoice
                        varName="answerTesseract4dVerticesPattern"
                        correctAnswer="doubles each time"
                        options={["adds 4 each time", "doubles each time", "adds 8 each time", "stays the same"]}
                        {...choicePropsFromDefinition(getVariableInfo("answerTesseract4dVerticesPattern"))}
                    />
                </InlineFeedback>.
            </EditableParagraph>
        </Block>
    </StackLayout>,

    // ── Assessment Question 2 ────────────────────────────────────────────────
    <StackLayout key="layout-tesseract-question-method" maxWidth="xl">
        <Block id="tesseract-question-method" padding="md">
            <EditableParagraph id="para-tesseract-question-method" blockId="tesseract-question-method">
                A tesseract is constructed by taking a cube and{" "}
                <InlineFeedback
                    varName="answerTesseract4dConstructionMethod"
                    correctValue="drag cube into 4th dimension"
                    position="mid"
                    successMessage="✓"
                    failureMessage="✗"
                    hint="Think about how we made the cube from a square"
                    reviewBlockId="tesseract-pattern"
                    reviewLabel="Review the pattern"
                >
                    <InlineClozeChoice
                        varName="answerTesseract4dConstructionMethod"
                        correctAnswer="drag cube into 4th dimension"
                        options={["rotate a cube", "drag cube into 4th dimension", "stack 8 cubes", "fold a cube net"]}
                        {...choicePropsFromDefinition(getVariableInfo("answerTesseract4dConstructionMethod"))}
                    />
                </InlineFeedback>.
            </EditableParagraph>
        </Block>
    </StackLayout>,

    // ── Conclusion ───────────────────────────────────────────────────────────
    <StackLayout key="layout-tesseract-conclusion" maxWidth="xl">
        <Block id="tesseract-conclusion" padding="sm">
            <EditableParagraph id="para-tesseract-conclusion" blockId="tesseract-conclusion">
                The recipe is always the same: drag perpendicular, double the vertices, connect the copies.
            </EditableParagraph>
        </Block>
    </StackLayout>,
];
