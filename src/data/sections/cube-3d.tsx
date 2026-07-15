import { type ReactElement, useCallback, useRef, Suspense } from "react";
import { Canvas, useThree, useFrame, ThreeEvent } from "@react-three/fiber";
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
    InlineTrigger,
    InteractionHintSequence,
} from "@/components/atoms";
import { useVar, useSetVar } from "@/stores";
import {
    getVariableInfo,
    choicePropsFromDefinition,
} from "../variables";
import {
    cubeVolume,
    cubeVerticesVisible,
    cubeEdgesVisible,
    cubeFacesVisible,
    cubeCrossSections,
    cubeCrossSectionPositions,
} from "../model";

// ══════════════════════════════════════════════════════════════════════════════
// SECTION: Square to Cube (2D → 3D) - Drag Handle to Extrude
// ══════════════════════════════════════════════════════════════════════════════
//
// Learning objective: Understand that dragging a square perpendicular to its
// plane creates a cube with three dimensions. The aha moment: the cube is built
// by sweeping the square through space, and every position along the drag
// creates a cross-section of the cube.
//
// Design: Direct manipulation. Student drags a handle extending from a flat
// square to extrude it into a cube. Ghost cross-sections show the sweep path.
// ══════════════════════════════════════════════════════════════════════════════

// ── Constants ────────────────────────────────────────────────────────────────
const AMBER = "#F7B23B";
const TEAL = "#62D0AD";
const SIDE_LENGTH = 2;
const MAX_EXTRUSION = 2; // Visual depth in 3D units

// ── Draggable Extrusion Handle ───────────────────────────────────────────────

interface DraggableHandleProps {
    extrusionDepth: number;
    onDepthChange: (depth: number) => void;
    sideLength: number;
}

function DraggableHandle({ extrusionDepth, onDepthChange, sideLength }: DraggableHandleProps) {
    const { raycaster, gl } = useThree();
    const meshRef = useRef<THREE.Mesh>(null!);
    const [isDragging, setIsDragging] = React.useState(false);
    const [isHovered, setIsHovered] = React.useState(false);
    const dragPlane = useRef(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0));
    const offset = useRef(new THREE.Vector3());

    // Handle position: at the center of the front face
    const handleZ = extrusionDepth * MAX_EXTRUSION;

    const handlePointerDown = useCallback((e: ThreeEvent<PointerEvent>) => {
        e.stopPropagation();
        setIsDragging(true);
        (gl.domElement as HTMLElement).style.cursor = "grabbing";

        // Set up drag plane perpendicular to Y, passing through handle
        const pos = meshRef.current.position.clone();
        dragPlane.current.setFromNormalAndCoplanarPoint(
            new THREE.Vector3(0, 1, 0),
            pos
        );

        // Calculate offset
        const intersection = new THREE.Vector3();
        raycaster.ray.intersectPlane(dragPlane.current, intersection);
        offset.current.copy(pos).sub(intersection);
    }, [raycaster, gl]);

    useFrame(() => {
        if (!isDragging) return;

        const intersection = new THREE.Vector3();
        if (!raycaster.ray.intersectPlane(dragPlane.current, intersection)) return;

        const newPos = intersection.add(offset.current);
        // Only care about Z movement (extrusion direction)
        const newZ = Math.max(0, Math.min(MAX_EXTRUSION, newPos.z));
        const newDepth = newZ / MAX_EXTRUSION;
        onDepthChange(newDepth);
    });

    // Global pointer up
    React.useEffect(() => {
        if (!isDragging) return;
        const domEl = gl.domElement as HTMLElement;
        const onUp = () => {
            setIsDragging(false);
            domEl.style.cursor = "auto";
        };
        window.addEventListener("pointerup", onUp);
        return () => window.removeEventListener("pointerup", onUp);
    }, [isDragging, gl]);

    return (
        <group position={[0, 0, handleZ]} userData-concept="cube3d_extrusionDepth">
            {/* Cone arrow pointing in extrusion direction */}
            <mesh
                ref={meshRef}
                position={[0, 0, 0.3]}
                rotation={[Math.PI / 2, 0, 0]}
                onPointerDown={handlePointerDown}
                onPointerOver={(e) => {
                    e.stopPropagation();
                    setIsHovered(true);
                    (gl.domElement as HTMLElement).style.cursor = "grab";
                }}
                onPointerOut={() => {
                    setIsHovered(false);
                    if (!isDragging) (gl.domElement as HTMLElement).style.cursor = "auto";
                }}
            >
                <coneGeometry args={[0.15, 0.4, 16]} />
                <meshStandardMaterial
                    color={isDragging || isHovered ? "#FBBF24" : TEAL}
                    emissive={isDragging || isHovered ? TEAL : "#000"}
                    emissiveIntensity={isDragging || isHovered ? 0.4 : 0}
                />
            </mesh>

            {/* Handle stem */}
            <mesh position={[0, 0, 0.05]} rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.05, 0.05, 0.3, 8]} />
                <meshStandardMaterial color={TEAL} />
            </mesh>

            {/* Depth label */}
            <Text
                position={[0, -sideLength / 2 - 0.3, 0.3]}
                fontSize={0.2}
                color={TEAL}
                anchorX="center"
                anchorY="middle"
            >
                {`depth: ${extrusionDepth.toFixed(2)}`}
            </Text>
        </group>
    );
}

// Need to import React for useState
import React from "react";

// ── Square Face Component ────────────────────────────────────────────────────

interface SquareFaceProps {
    position: [number, number, number];
    sideLength: number;
    opacity: number;
    color: string;
    showEdges?: boolean;
}

function SquareFace({ position, sideLength, opacity, color, showEdges = true }: SquareFaceProps) {
    const half = sideLength / 2;

    return (
        <group position={position}>
            {/* Filled face */}
            <mesh>
                <planeGeometry args={[sideLength, sideLength]} />
                <meshStandardMaterial
                    color={color}
                    transparent
                    opacity={opacity}
                    side={THREE.DoubleSide}
                />
            </mesh>

            {/* Edge outline */}
            {showEdges && (
                <Line
                    points={[
                        [-half, -half, 0],
                        [half, -half, 0],
                        [half, half, 0],
                        [-half, half, 0],
                        [-half, -half, 0],
                    ]}
                    color={AMBER}
                    lineWidth={2}
                />
            )}
        </group>
    );
}

// ── Cube Extrusion Visualization ─────────────────────────────────────────────

interface CubeExtrusionSceneProps {
    extrusionDepth: number;
    sideLength: number;
    onDepthChange: (depth: number) => void;
}

function CubeExtrusionScene({ extrusionDepth, sideLength, onDepthChange }: CubeExtrusionSceneProps) {
    const half = sideLength / 2;
    const currentZ = extrusionDepth * MAX_EXTRUSION;

    // Ghost cross-sections
    const ghostCount = cubeCrossSections(extrusionDepth);
    const ghostPositions = cubeCrossSectionPositions(extrusionDepth, ghostCount);

    // Corner vertices of base square
    const baseCorners: [number, number, number][] = [
        [-half, -half, 0],
        [half, -half, 0],
        [half, half, 0],
        [-half, half, 0],
    ];

    // Front face corners (at current extrusion depth)
    const frontCorners: [number, number, number][] = baseCorners.map(
        ([x, y]) => [x, y, currentZ] as [number, number, number]
    );

    return (
        <>
            {/* Lighting */}
            <ambientLight intensity={0.5} />
            <directionalLight position={[5, 5, 5]} intensity={0.8} />
            <directionalLight position={[-3, 3, -3]} intensity={0.3} />

            {/* Base square (back face) - always visible and solid */}
            <SquareFace
                position={[0, 0, 0]}
                sideLength={sideLength}
                opacity={0.9}
                color={AMBER}
            />

            {/* Ghost cross-sections showing the sweep */}
            {ghostPositions.map((zPos, i) => (
                <SquareFace
                    key={`ghost-${i}`}
                    position={[0, 0, zPos * MAX_EXTRUSION]}
                    sideLength={sideLength}
                    opacity={0.15 - i * 0.02}
                    color={AMBER}
                    showEdges={false}
                />
            ))}

            {/* Front face (moves with extrusion) */}
            {extrusionDepth > 0 && (
                <SquareFace
                    position={[0, 0, currentZ]}
                    sideLength={sideLength}
                    opacity={0.7}
                    color={AMBER}
                />
            )}

            {/* Connecting edges (the 4 edges that form as we extrude) */}
            {extrusionDepth > 0 && baseCorners.map((baseCorner, i) => (
                <Line
                    key={`edge-${i}`}
                    points={[baseCorner, frontCorners[i]]}
                    color={AMBER}
                    lineWidth={2}
                    userData-concept="cube3d_edges"
                />
            ))}

            {/* Side faces (semi-transparent to show interior) */}
            {extrusionDepth > 0 && (
                <group>
                    {/* Bottom face */}
                    <mesh position={[0, -half, currentZ / 2]} rotation={[Math.PI / 2, 0, 0]}>
                        <planeGeometry args={[sideLength, currentZ]} />
                        <meshStandardMaterial
                            color={AMBER}
                            transparent
                            opacity={0.3}
                            side={THREE.DoubleSide}
                        />
                    </mesh>
                    {/* Top face */}
                    <mesh position={[0, half, currentZ / 2]} rotation={[Math.PI / 2, 0, 0]}>
                        <planeGeometry args={[sideLength, currentZ]} />
                        <meshStandardMaterial
                            color={AMBER}
                            transparent
                            opacity={0.3}
                            side={THREE.DoubleSide}
                        />
                    </mesh>
                    {/* Left face */}
                    <mesh position={[-half, 0, currentZ / 2]} rotation={[0, Math.PI / 2, 0]}>
                        <planeGeometry args={[currentZ, sideLength]} />
                        <meshStandardMaterial
                            color={AMBER}
                            transparent
                            opacity={0.3}
                            side={THREE.DoubleSide}
                        />
                    </mesh>
                    {/* Right face */}
                    <mesh position={[half, 0, currentZ / 2]} rotation={[0, Math.PI / 2, 0]}>
                        <planeGeometry args={[currentZ, sideLength]} />
                        <meshStandardMaterial
                            color={AMBER}
                            transparent
                            opacity={0.3}
                            side={THREE.DoubleSide}
                        />
                    </mesh>
                </group>
            )}

            {/* Vertex markers */}
            {baseCorners.map((pos, i) => (
                <mesh key={`base-vertex-${i}`} position={pos} userData-concept="cube3d_vertices">
                    <sphereGeometry args={[0.08, 16, 16]} />
                    <meshStandardMaterial color={AMBER} />
                </mesh>
            ))}
            {extrusionDepth > 0 && frontCorners.map((pos, i) => (
                <mesh key={`front-vertex-${i}`} position={pos}>
                    <sphereGeometry args={[0.08, 16, 16]} />
                    <meshStandardMaterial color={AMBER} />
                </mesh>
            ))}

            {/* Dimension labels when cube is complete */}
            {extrusionDepth >= 0.95 && (
                <>
                    <Text
                        position={[0, -half - 0.3, 0]}
                        fontSize={0.18}
                        color="#666"
                        anchorX="center"
                        anchorY="middle"
                    >
                        width
                    </Text>
                    <Text
                        position={[-half - 0.3, 0, 0]}
                        fontSize={0.18}
                        color="#666"
                        anchorX="center"
                        anchorY="middle"
                        rotation={[0, 0, Math.PI / 2]}
                    >
                        height
                    </Text>
                    <Text
                        position={[half + 0.3, -half - 0.2, currentZ / 2]}
                        fontSize={0.18}
                        color="#666"
                        anchorX="center"
                        anchorY="middle"
                    >
                        depth
                    </Text>
                </>
            )}

            {/* Draggable handle */}
            <DraggableHandle
                extrusionDepth={extrusionDepth}
                onDepthChange={onDepthChange}
                sideLength={sideLength}
            />
        </>
    );
}

// ── Main Visualization Wrapper ───────────────────────────────────────────────

function CubeExtrusionVisualization() {
    const setVar = useSetVar();

    // Read from store
    const extrusionDepth = useVar("cube3d_extrusionDepth", 0) as number;
    const sideLength = useVar("cube3d_sideLength", SIDE_LENGTH) as number;
    const hasInteracted = useVar("cube3d_hasInteracted", false) as boolean;

    // Compute derived values from model
    const volume = cubeVolume(sideLength, extrusionDepth);
    const vertices = cubeVerticesVisible(extrusionDepth);
    const edges = cubeEdgesVisible(extrusionDepth);
    const faces = cubeFacesVisible(extrusionDepth);
    const crossSections = cubeCrossSections(extrusionDepth);

    // Update derived store variables
    React.useEffect(() => {
        setVar("cube3d_volume", Math.round(volume * 100) / 100);
        setVar("cube3d_vertices", vertices);
        setVar("cube3d_edges", edges);
        setVar("cube3d_faces", faces);
        setVar("cube3d_crossSectionCount", crossSections);
    }, [volume, vertices, edges, faces, crossSections, setVar]);

    const handleDepthChange = useCallback((newDepth: number) => {
        if (!hasInteracted) {
            setVar("cube3d_hasInteracted", true);
        }
        setVar("cube3d_extrusionDepth", Math.round(newDepth * 100) / 100);
    }, [hasInteracted, setVar]);

    const handleReset = useCallback(() => {
        setVar("cube3d_extrusionDepth", 0);
        setVar("cube3d_hasInteracted", false);
    }, [setVar]);

    return (
        <div className="flex flex-col items-center gap-4">
            {/* Stats Bar */}
            <div className="flex gap-6 text-sm flex-wrap justify-center">
                <div className="flex items-center gap-2">
                    <span className="text-slate-500">Vertices:</span>
                    <span
                        className="font-bold"
                        style={{ color: AMBER }}
                        data-concept="cube3d_vertices"
                    >
                        {vertices}
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-slate-500">Edges:</span>
                    <span
                        className="font-bold"
                        style={{ color: AMBER }}
                        data-concept="cube3d_edges"
                    >
                        {edges}
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-slate-500">Faces:</span>
                    <span
                        className="font-bold"
                        style={{ color: AMBER }}
                        data-concept="cube3d_faces"
                    >
                        {faces}
                    </span>
                </div>
                {extrusionDepth > 0 && (
                    <div className="flex items-center gap-2">
                        <span className="text-slate-500">Volume:</span>
                        <span
                            className="font-semibold"
                            style={{ color: AMBER }}
                            data-concept="cube3d_volume"
                        >
                            {volume.toFixed(1)}
                        </span>
                    </div>
                )}
            </div>

            {/* 3D Canvas */}
            <div className="relative w-full" style={{ height: 400 }}>
                <Canvas dpr={[1, 2]}>
                    <PerspectiveCamera
                        makeDefault
                        position={[4, 3, 5]}
                        fov={50}
                    />
                    <Suspense fallback={null}>
                        <CubeExtrusionScene
                            extrusionDepth={extrusionDepth}
                            sideLength={sideLength}
                            onDepthChange={handleDepthChange}
                        />
                    </Suspense>
                    <OrbitControls
                        makeDefault
                        enableDamping
                        dampingFactor={0.1}
                        minPolarAngle={0.3}
                        maxPolarAngle={Math.PI - 0.3}
                    />
                </Canvas>

                {/* Interaction hint */}
                {!hasInteracted && (
                    <InteractionHintSequence
                        hintKey="cube-3d-drag-handle"
                        steps={[
                            {
                                gesture: "drag",
                                label: "Drag the teal arrow to extrude the square",
                                position: { x: "55%", y: "45%" },
                            },
                        ]}
                    />
                )}
            </div>

            {/* Reset button */}
            {hasInteracted && (
                <button
                    onClick={handleReset}
                    className="px-4 py-2 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50 transition-colors text-sm"
                >
                    Reset to flat square
                </button>
            )}

            {/* Completion message */}
            {extrusionDepth >= 0.95 && (
                <div
                    className="text-sm font-medium px-4 py-2 rounded-lg"
                    style={{ backgroundColor: "rgba(98, 208, 173, 0.15)", color: TEAL }}
                >
                    Complete cube: 8 vertices, 12 edges, 6 faces
                </div>
            )}
        </div>
    );
}

// ══════════════════════════════════════════════════════════════════════════════
// EXPORTED BLOCKS
// ══════════════════════════════════════════════════════════════════════════════

export const cube3dBlocks: ReactElement[] = [
    // ── Section Title ────────────────────────────────────────────────────────
    <StackLayout key="layout-cube-title" maxWidth="xl">
        <Block id="cube-title" padding="md">
            <EditableH2 id="h2-cube-title" blockId="cube-title">
                From Square to Cube: The Third Dimension
            </EditableH2>
        </Block>
    </StackLayout>,

    // ── Introduction ─────────────────────────────────────────────────────────
    <StackLayout key="layout-cube-intro" maxWidth="xl">
        <Block id="cube-intro" padding="sm">
            <EditableParagraph id="para-cube-intro" blockId="cube-intro">
                A square has{" "}
                <InlineSpotColor varName="square2d_sweptArea" color="#8E90F5">
                    length and width
                </InlineSpotColor>
                , but no depth. What if we could reach into the screen and pull the square{" "}
                <InlineTooltip
                    id="tooltip-perpendicular-3d"
                    tooltip="Perpendicular to the square's surface means straight out toward you, at a 90° angle to the flat face."
                >
                    perpendicular
                </InlineTooltip>
                {" "}to its surface? We would create the third dimension.
            </EditableParagraph>
        </Block>
    </StackLayout>,

    // ── Interactive Visualization ────────────────────────────────────────────
    <StackLayout key="layout-cube-visualization" maxWidth="2xl">
        <Block id="cube-visualization" padding="md" hasVisualization>
            <CubeExtrusionVisualization />
        </Block>
    </StackLayout>,

    // ── Guided Exploration ───────────────────────────────────────────────────
    <StackLayout key="layout-cube-exploration" maxWidth="xl">
        <Block id="cube-exploration" padding="sm">
            <EditableParagraph id="para-cube-exploration" blockId="cube-exploration">
                Drag the{" "}
                <InlineSpotColor varName="cube3d_extrusionDepth" color={TEAL}>
                    teal arrow
                </InlineSpotColor>
                {" "}away from the square to extrude it into the third dimension. Watch the faded ghost squares appear as the square sweeps through space. Each ghost represents a{" "}
                <InlineSpotColor varName="cube3d_crossSectionCount" color={AMBER}>
                    cross-section
                </InlineSpotColor>
                {" "}of the cube at that depth.{" "}
                <InlineTrigger varName="cube3d_extrusionDepth" value={0} icon="refresh">
                    Reset to flat
                </InlineTrigger>
                {" "}and try again.
            </EditableParagraph>
        </Block>
    </StackLayout>,

    // ── Key Insight ──────────────────────────────────────────────────────────
    <StackLayout key="layout-cube-insight" maxWidth="xl">
        <Block id="cube-insight" padding="sm">
            <EditableParagraph id="para-cube-insight" blockId="cube-insight">
                Notice how the{" "}
                <InlineSpotColor varName="cube3d_vertices" color={AMBER}>
                    vertices doubled
                </InlineSpotColor>
                {" "}from 4 to 8. The original square becomes the back face, and a copy becomes the front face. Four new edges connect them, forming the cube's sides. Every position of the square during its journey is a{" "}
                <em>slice</em> through the cube.
            </EditableParagraph>
        </Block>
    </StackLayout>,

    // ── Assessment Question 1 ────────────────────────────────────────────────
    <StackLayout key="layout-cube-question-dimension" maxWidth="xl">
        <Block id="cube-question-dimension" padding="md">
            <EditableParagraph id="para-cube-question-dimension" blockId="cube-question-dimension">
                A cube has{" "}
                <InlineFeedback
                    varName="answerCube3dDimension"
                    correctValue="three"
                    position="mid"
                    successMessage="✓"
                    failureMessage="✗"
                    hint="Count the independent directions: length, width, and..."
                    reviewBlockId="cube-insight"
                    reviewLabel="Review the cube properties"
                >
                    <InlineClozeChoice
                        varName="answerCube3dDimension"
                        correctAnswer="three"
                        options={["one", "two", "three", "four"]}
                        {...choicePropsFromDefinition(getVariableInfo("answerCube3dDimension"))}
                    />
                </InlineFeedback>{" "}
                dimensions.
            </EditableParagraph>
        </Block>
    </StackLayout>,

    // ── Assessment Question 2 ────────────────────────────────────────────────
    <StackLayout key="layout-cube-question-vertices" maxWidth="xl">
        <Block id="cube-question-vertices" padding="md">
            <EditableParagraph id="para-cube-question-vertices" blockId="cube-question-vertices">
                When you extrude a square into a cube, the number of vertices{" "}
                <InlineFeedback
                    varName="answerCube3dVerticesFromSquare"
                    correctValue="doubles"
                    position="terminal"
                    successMessage="— exactly! Each vertex of the square creates two vertices in the cube: one at the back, one at the front"
                    failureMessage="— not quite."
                    hint="The square has 4 vertices. How many does the cube have?"
                    reviewBlockId="cube-visualization"
                    reviewLabel="Extrude again and count"
                    visualizationHint={{
                        blockId: "cube-visualization",
                        hintKey: "feedback-cube-vertices-hint",
                        steps: [
                            {
                                gesture: "drag",
                                label: "Drag the arrow to extrude and watch the vertex count",
                                position: { x: "55%", y: "45%" },
                            },
                        ],
                        label: "See it yourself",
                        resetVars: { cube3d_extrusionDepth: 0 },
                    }}
                >
                    <InlineClozeChoice
                        varName="answerCube3dVerticesFromSquare"
                        correctAnswer="doubles"
                        options={["stays the same", "doubles", "triples", "quadruples"]}
                        {...choicePropsFromDefinition(getVariableInfo("answerCube3dVerticesFromSquare"))}
                    />
                </InlineFeedback>.
            </EditableParagraph>
        </Block>
    </StackLayout>,

    // ── Bridge to Next Section ───────────────────────────────────────────────
    <StackLayout key="layout-cube-bridge" maxWidth="xl">
        <Block id="cube-bridge" padding="sm">
            <EditableParagraph id="para-cube-bridge" blockId="cube-bridge">
                We started with a square at{" "}
                <InlineSpotColor varName="square2d_sweptArea" color="#8E90F5">
                    two dimensions
                </InlineSpotColor>
                . By dragging it perpendicular to its surface, we created a cube with{" "}
                <InlineSpotColor varName="cube3d_volume" color={AMBER}>
                    three dimensions
                </InlineSpotColor>
                : length, width, and depth. The pattern continues. What if we could drag this cube in a direction perpendicular to all three of its dimensions? We would enter the fourth dimension and create a{" "}
                <em>tesseract</em>.
            </EditableParagraph>
        </Block>
    </StackLayout>,
];
