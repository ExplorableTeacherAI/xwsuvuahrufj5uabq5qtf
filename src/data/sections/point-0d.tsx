import { type ReactElement, useCallback, useMemo, useState } from "react";
import { StackLayout, SplitLayout } from "@/components/layouts";
import { Block } from "@/components/templates";
import {
    EditableH2,
    EditableParagraph,
    InlineClozeChoice,
    InlineFeedback,
    InlineSpotColor,
    InlineTooltip,
    InteractionHintSequence,
} from "@/components/atoms";
import { useVar, useSetVar } from "@/stores";
import {
    getVariableInfo,
    choicePropsFromDefinition,
} from "../variables";
import {
    mathPointWidth,
    mathPointArea,
    physicalDotWidth,
    physicalDotArea,
} from "../model";

// ══════════════════════════════════════════════════════════════════════════════
// SECTION: What is a Point? (0D)
// ══════════════════════════════════════════════════════════════════════════════
//
// This section introduces the concept that a mathematical point has zero
// dimensions — no length, width, or depth, just a position. The key insight
// is that the dot we draw to represent a point is NOT the point itself;
// the point is the position that dot tries to represent.
//
// Design: Two side-by-side canvases — "Mathematical Universe" and "Physical
// Drawing Universe". Clicking places a point/dot in both, but measurement
// calipers show 0 for math and actual pixels for physical.
// ══════════════════════════════════════════════════════════════════════════════

// ── Constants ────────────────────────────────────────────────────────────────
const DOT_RADIUS = 4; // Physical dot radius in pixels
const CANVAS_WIDTH = 280;
const CANVAS_HEIGHT = 220;
const CALIPER_COLOR = "#64748b";
const MATH_COLOR = "#8E90F5"; // Soft indigo
const PHYSICAL_COLOR = "#F7B23B"; // Warm amber
const GHOST_OPACITY = 0.25;

// ── Types ────────────────────────────────────────────────────────────────────
interface PlacedPoint {
    x: number;
    y: number;
    id: number;
}

// ══════════════════════════════════════════════════════════════════════════════
// BESPOKE VISUALIZATION: Two Universes Comparison
// ══════════════════════════════════════════════════════════════════════════════

function TwoUniversesVisualization() {
    const setVar = useSetVar();
    const pointCount = useVar("point0dPointCount", 0) as number;
    const hasPlacedPoint = useVar("point0dHasPlacedPoint", false) as boolean;

    // Track all placed points for ghost trail
    const [points, setPoints] = useState<PlacedPoint[]>([]);
    const [latestPoint, setLatestPoint] = useState<PlacedPoint | null>(null);

    // Handle click on either canvas
    const handleCanvasClick = useCallback(
        (e: React.MouseEvent<SVGSVGElement>, canvasId: "math" | "physical") => {
            const svg = e.currentTarget;
            const rect = svg.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            const newPoint: PlacedPoint = { x, y, id: Date.now() };

            // Move current latest to ghosts, set new latest
            setPoints((prev) => (latestPoint ? [...prev, latestPoint] : prev));
            setLatestPoint(newPoint);

            // Update store variables
            setVar("point0dClickX", Math.round(x));
            setVar("point0dClickY", Math.round(y));
            setVar("point0dPointCount", pointCount + 1);
            setVar("point0dHasPlacedPoint", true);

            // Update derived measurements using model functions
            setVar("point0dMathWidth", mathPointWidth());
            setVar("point0dMathArea", mathPointArea());
            setVar("point0dPhysicalWidth", physicalDotWidth(DOT_RADIUS));
            setVar("point0dPhysicalArea", Math.round(physicalDotArea(DOT_RADIUS) * 100) / 100);
        },
        [setVar, pointCount, latestPoint]
    );

    // Caliper component for measuring
    const Caliper = useMemo(() => {
        return function CaliperComponent({
            x,
            y,
            width,
            label,
            color,
            collapsed,
        }: {
            x: number;
            y: number;
            width: number;
            label: string;
            color: string;
            collapsed: boolean;
        }) {
            const armHeight = 12;
            const actualWidth = collapsed ? 0 : width;

            return (
                <g data-concept={collapsed ? "point0d_mathWidth" : "point0d_physicalWidth"}>
                    {/* Left arm */}
                    <line
                        x1={x - actualWidth / 2}
                        y1={y - armHeight}
                        x2={x - actualWidth / 2}
                        y2={y + armHeight}
                        stroke={color}
                        strokeWidth={1.5}
                    />
                    {/* Right arm */}
                    <line
                        x1={x + actualWidth / 2}
                        y1={y - armHeight}
                        x2={x + actualWidth / 2}
                        y2={y + armHeight}
                        stroke={color}
                        strokeWidth={1.5}
                    />
                    {/* Top bar */}
                    <line
                        x1={x - actualWidth / 2}
                        y1={y - armHeight}
                        x2={x + actualWidth / 2}
                        y2={y - armHeight}
                        stroke={color}
                        strokeWidth={1.5}
                    />
                    {/* Bottom bar */}
                    <line
                        x1={x - actualWidth / 2}
                        y1={y + armHeight}
                        x2={x + actualWidth / 2}
                        y2={y + armHeight}
                        stroke={color}
                        strokeWidth={1.5}
                    />
                    {/* Measurement label */}
                    <text
                        x={x}
                        y={y + armHeight + 16}
                        textAnchor="middle"
                        fill={color}
                        fontSize={11}
                        fontWeight={600}
                        fontFamily="system-ui, sans-serif"
                    >
                        {label}
                    </text>
                </g>
            );
        };
    }, []);

    // Single canvas component
    const UniverseCanvas = ({
        title,
        isMath,
        canvasId,
    }: {
        title: string;
        isMath: boolean;
        canvasId: "math" | "physical";
    }) => {
        const accentColor = isMath ? MATH_COLOR : PHYSICAL_COLOR;
        const measurementWidth = isMath ? 0 : DOT_RADIUS * 2;
        const measurementLabel = isMath ? "0 units" : `${DOT_RADIUS * 2} px`;

        return (
            <div className="flex flex-col items-center">
                {/* Title */}
                <div
                    className="text-sm font-semibold mb-2 px-3 py-1 rounded-full"
                    style={{
                        color: accentColor,
                        backgroundColor: `${accentColor}15`,
                    }}
                >
                    {title}
                </div>

                {/* Canvas */}
                <svg
                    width={CANVAS_WIDTH}
                    height={CANVAS_HEIGHT}
                    className="cursor-crosshair rounded-lg border border-slate-200"
                    style={{ backgroundColor: "#FAFAFA" }}
                    onClick={(e) => handleCanvasClick(e, canvasId)}
                >
                    {/* Grid for context */}
                    <defs>
                        <pattern
                            id={`grid-${canvasId}`}
                            width="20"
                            height="20"
                            patternUnits="userSpaceOnUse"
                        >
                            <path
                                d="M 20 0 L 0 0 0 20"
                                fill="none"
                                stroke="#e2e8f0"
                                strokeWidth="0.5"
                            />
                        </pattern>
                    </defs>
                    <rect
                        width={CANVAS_WIDTH}
                        height={CANVAS_HEIGHT}
                        fill={`url(#grid-${canvasId})`}
                    />

                    {/* Ghost points (previous placements) */}
                    {points.map((pt) => (
                        <g key={pt.id} opacity={GHOST_OPACITY}>
                            <circle
                                cx={pt.x}
                                cy={pt.y}
                                r={isMath ? 1 : DOT_RADIUS}
                                fill={accentColor}
                            />
                            {/* Ghost measurement annotation */}
                            <text
                                x={pt.x}
                                y={pt.y + (isMath ? 14 : DOT_RADIUS + 14)}
                                textAnchor="middle"
                                fill={CALIPER_COLOR}
                                fontSize={8}
                                fontFamily="system-ui, sans-serif"
                            >
                                {isMath ? "0" : `${DOT_RADIUS * 2}px`}
                            </text>
                        </g>
                    ))}

                    {/* Latest point with caliper */}
                    {latestPoint && (
                        <g data-concept={isMath ? "point0d_mathWidth" : "point0d_physicalWidth"}>
                            {/* The point/dot itself */}
                            <circle
                                cx={latestPoint.x}
                                cy={latestPoint.y}
                                r={isMath ? 1.5 : DOT_RADIUS}
                                fill={accentColor}
                            />
                            {/* Caliper measuring it */}
                            <Caliper
                                x={latestPoint.x}
                                y={latestPoint.y + (isMath ? 20 : DOT_RADIUS + 20)}
                                width={measurementWidth}
                                label={measurementLabel}
                                color={CALIPER_COLOR}
                                collapsed={isMath}
                            />
                        </g>
                    )}

                    {/* Instruction text when no points placed */}
                    {!hasPlacedPoint && (
                        <text
                            x={CANVAS_WIDTH / 2}
                            y={CANVAS_HEIGHT / 2}
                            textAnchor="middle"
                            fill="#94a3b8"
                            fontSize={13}
                            fontFamily="system-ui, sans-serif"
                        >
                            Click to place a point
                        </text>
                    )}
                </svg>

                {/* Live readouts */}
                <div className="mt-3 text-xs text-slate-600 space-y-1 w-full px-2">
                    {latestPoint && (
                        <>
                            <div className="flex justify-between">
                                <span>Position:</span>
                                <span className="font-mono">
                                    ({Math.round(latestPoint.x)}, {Math.round(latestPoint.y)})
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span>Measurable width:</span>
                                <span
                                    className="font-semibold"
                                    style={{ color: accentColor }}
                                    data-concept={isMath ? "point0d_mathWidth" : "point0d_physicalWidth"}
                                >
                                    {isMath ? "0" : `${DOT_RADIUS * 2} px`}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span>Area:</span>
                                <span
                                    className="font-semibold"
                                    style={{ color: accentColor }}
                                    data-concept={isMath ? "point0d_mathArea" : "point0d_physicalArea"}
                                >
                                    {isMath
                                        ? "0 sq units"
                                        : `${(Math.PI * DOT_RADIUS * DOT_RADIUS).toFixed(1)} px²`}
                                </span>
                            </div>
                        </>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="relative">
            <div className="flex gap-6 justify-center flex-wrap">
                <UniverseCanvas
                    title="Mathematical Universe"
                    isMath={true}
                    canvasId="math"
                />
                <UniverseCanvas
                    title="Physical Drawing Universe"
                    isMath={false}
                    canvasId="physical"
                />
            </div>

            {/* Interaction hint */}
            <InteractionHintSequence
                hintKey="point-0d-click-hint"
                steps={[
                    {
                        gesture: "click",
                        label: "Click anywhere on either canvas",
                        position: { x: "25%", y: "45%" },
                    },
                ]}
            />
        </div>
    );
}

// ══════════════════════════════════════════════════════════════════════════════
// REACTIVE FEEDBACK COMPONENT
// ══════════════════════════════════════════════════════════════════════════════

function PointCountReadout() {
    const count = useVar("point0dPointCount", 0) as number;
    if (count === 0) return null;
    return (
        <span className="text-slate-500 text-sm">
            {" "}(You have placed {count} point{count !== 1 ? "s" : ""})
        </span>
    );
}

// ══════════════════════════════════════════════════════════════════════════════
// EXPORTED BLOCKS
// ══════════════════════════════════════════════════════════════════════════════

export const point0dBlocks: ReactElement[] = [
    // ── Section Title ────────────────────────────────────────────────────────
    <StackLayout key="layout-point-title" maxWidth="xl">
        <Block id="point-title" padding="md">
            <EditableH2 id="h2-point-title" blockId="point-title">
                What is a Point?
            </EditableH2>
        </Block>
    </StackLayout>,

    // ── Introduction ─────────────────────────────────────────────────────────
    <StackLayout key="layout-point-intro" maxWidth="xl">
        <Block id="point-intro" padding="sm">
            <EditableParagraph id="para-point-intro" blockId="point-intro">
                Here is a strange idea: the dot you see on paper is not actually a{" "}
                <InlineTooltip
                    id="tooltip-point"
                    tooltip="In mathematics, a point is a precise location in space with no size, shape, or dimension."
                >
                    point
                </InlineTooltip>
                . The dot has width, area, and takes up space. A true mathematical point has{" "}
                <InlineSpotColor varName="point0dMathWidth" color={MATH_COLOR}>
                    none of these
                </InlineSpotColor>
                . So what is a point, really?
            </EditableParagraph>
        </Block>
    </StackLayout>,

    // ── Interactive Visualization ────────────────────────────────────────────
    <StackLayout key="layout-point-visualization" maxWidth="2xl">
        <Block id="point-visualization" padding="md" hasVisualization>
            <TwoUniversesVisualization />
        </Block>
    </StackLayout>,

    // ── Guided Exploration ───────────────────────────────────────────────────
    <StackLayout key="layout-point-exploration" maxWidth="xl">
        <Block id="point-exploration" padding="sm">
            <EditableParagraph id="para-point-exploration" blockId="point-exploration">
                Click anywhere on either canvas above. Both show a mark at the exact same position, but watch the{" "}
                <InlineSpotColor varName="point0dMathWidth" color={CALIPER_COLOR}>
                    measurement calipers
                </InlineSpotColor>{" "}
                that appear. The{" "}
                <InlineSpotColor varName="point0dMathWidth" color={MATH_COLOR}>
                    mathematical universe
                </InlineSpotColor>{" "}
                always reports zero width, while the{" "}
                <InlineSpotColor varName="point0dPhysicalWidth" color={PHYSICAL_COLOR}>
                    physical universe
                </InlineSpotColor>{" "}
                shows the actual pixel size of the ink.
                <PointCountReadout />
            </EditableParagraph>
        </Block>
    </StackLayout>,

    // ── Key Insight ──────────────────────────────────────────────────────────
    <StackLayout key="layout-point-insight" maxWidth="xl">
        <Block id="point-insight" padding="sm">
            <EditableParagraph id="para-point-insight" blockId="point-insight">
                No matter how many points you place, the pattern holds: the mathematical side measures{" "}
                <InlineSpotColor varName="point0dMathWidth" color={MATH_COLOR}>
                    zero
                </InlineSpotColor>{" "}
                every time, while the physical side measures something real. This reveals the truth: a mathematical point is not the visible mark.{" "}
                It is the{" "}
                <InlineSpotColor varName="point0dClickX" color="#62D0AD">
                    position
                </InlineSpotColor>{" "}
                that mark tries to represent.
            </EditableParagraph>
        </Block>
    </StackLayout>,

    // ── Assessment Question 1 ────────────────────────────────────────────────
    <StackLayout key="layout-point-question-dimension" maxWidth="xl">
        <Block id="point-question-dimension" padding="md">
            <EditableParagraph id="para-point-question-dimension" blockId="point-question-dimension">
                A mathematical point has{" "}
                <InlineFeedback
                    varName="answerPointDimension"
                    correctValue="zero"
                    position="mid"
                    successMessage="Exactly right!"
                    failureMessage="Not quite."
                    hint="Think about what the calipers measured in the mathematical universe"
                    reviewBlockId="point-visualization"
                    reviewLabel="Try placing more points"
                >
                    <InlineClozeChoice
                        varName="answerPointDimension"
                        correctAnswer="zero"
                        options={["zero", "one", "two", "three"]}
                        {...choicePropsFromDefinition(getVariableInfo("answerPointDimension"))}
                    />
                </InlineFeedback>{" "}
                dimensions.
            </EditableParagraph>
        </Block>
    </StackLayout>,

    // ── Assessment Question 2 ────────────────────────────────────────────────
    <StackLayout key="layout-point-question-meaning" maxWidth="xl">
        <Block id="point-question-meaning" padding="md">
            <EditableParagraph id="para-point-question-meaning" blockId="point-question-meaning">
                A mathematical point represents{" "}
                <InlineFeedback
                    varName="answerPointSize"
                    correctValue="position only"
                    position="terminal"
                    successMessage="— that is the key insight! A point is pure location with no size"
                    failureMessage="— think again."
                    hint="Remember, the mathematical width was always 0, but the position was always recorded"
                    reviewBlockId="point-insight"
                    reviewLabel="Review the key insight"
                >
                    <InlineClozeChoice
                        varName="answerPointSize"
                        correctAnswer="position only"
                        options={["a small dot", "position only", "a tiny circle", "an atom"]}
                        {...choicePropsFromDefinition(getVariableInfo("answerPointSize"))}
                    />
                </InlineFeedback>.
            </EditableParagraph>
        </Block>
    </StackLayout>,

    // ── Bridge to Next Section ───────────────────────────────────────────────
    <StackLayout key="layout-point-bridge" maxWidth="xl">
        <Block id="point-bridge" padding="sm">
            <EditableParagraph id="para-point-bridge" blockId="point-bridge">
                A point marks a position in space. It has{" "}
                <InlineSpotColor varName="point0dMathWidth" color={MATH_COLOR}>
                    zero dimensions
                </InlineSpotColor>
                : no length, no width, no depth. But what happens if we take this zero-dimensional point and drag it through space? We create something with{" "}
                <InlineSpotColor varName="pointToLineProgress" color="#62D0AD">
                    one dimension
                </InlineSpotColor>
                .
            </EditableParagraph>
        </Block>
    </StackLayout>,
];
