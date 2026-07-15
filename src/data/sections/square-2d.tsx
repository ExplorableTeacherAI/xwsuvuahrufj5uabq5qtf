import { type ReactElement, useCallback, useState, useEffect, useRef } from "react";
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
    sweepLineX,
    sweptArea,
    positionsIncluded,
} from "../model";

// ══════════════════════════════════════════════════════════════════════════════
// SECTION: Line to Square (1D → 2D) - Predict the Swept Shape
// ══════════════════════════════════════════════════════════════════════════════
//
// Learning objective: Understand that dragging a line perpendicular to itself
// creates a square with two dimensions (length and width). The aha moment:
// the swept shape is filled solid everywhere between start and end because
// every intermediate position of the line contributed to building the 2D region.
//
// Design: Prediction-first. Students place 4 corner markers where they think
// the corners will be. Then "Reveal" sweeps the line, filling the interior.
// The contrast between their 4 corner prediction and the filled region
// exposes the misconception that you need to draw 4 lines vs sweep the whole line.
// ══════════════════════════════════════════════════════════════════════════════

// ── Constants ────────────────────────────────────────────────────────────────
const CANVAS_WIDTH = 340;
const CANVAS_HEIGHT = 340;
const LINE_START_X = 60;
const LINE_END_X = 280;
const LINE_Y1 = 60;
const LINE_Y2 = 280;
const ANIMATION_DURATION = 2500; // ms

// Colors from the muted palette
const INDIGO = "#8E90F5";       // Line color
const AMBER = "#F7B23B";        // Swept region
const RED = "#ef4444";          // Prediction markers
const TEAL = "#62D0AD";         // Accent

// ── Types ────────────────────────────────────────────────────────────────────
interface CornerMarker {
    x: number;
    y: number;
}

// ══════════════════════════════════════════════════════════════════════════════
// BESPOKE VISUALIZATION: Predict & Reveal Swept Shape
// ══════════════════════════════════════════════════════════════════════════════

function PredictSweptShapeVisualization() {
    const setVar = useSetVar();

    // Read from store
    const sweepProgress = useVar("square2d_sweepProgress", 0) as number;
    const placedCornerCount = useVar("square2d_placedCornerCount", 0) as number;
    const isRevealed = useVar("square2d_isRevealed", false) as boolean;
    const isAnimating = useVar("square2d_isAnimating", false) as boolean;

    // Local state for corner markers
    const [corners, setCorners] = useState<CornerMarker[]>([]);

    // Animation ref
    const animationRef = useRef<number | null>(null);
    const startTimeRef = useRef<number | null>(null);

    // Current line X based on sweep progress
    const currentLineX = sweepLineX(LINE_START_X, LINE_END_X, sweepProgress);

    // Derived values
    const currentArea = sweptArea(LINE_START_X, LINE_END_X, LINE_Y1, LINE_Y2, sweepProgress);
    const currentPositions = positionsIncluded(sweepProgress, 100);

    // Update derived store variables
    useEffect(() => {
        setVar("square2d_sweptArea", Math.round(currentArea));
        setVar("square2d_positionsIncluded", currentPositions);
    }, [currentArea, currentPositions, setVar]);

    // Handle canvas click to place corner markers
    const handleCanvasClick = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
        if (isRevealed || placedCornerCount >= 4) return;

        const svg = e.currentTarget;
        const rect = svg.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const newCorner = { x, y };
        const newCorners = [...corners, newCorner];
        setCorners(newCorners);
        setVar("square2d_placedCornerCount", newCorners.length);
    }, [isRevealed, placedCornerCount, corners, setVar]);

    // Animation loop
    const animate = useCallback((timestamp: number) => {
        if (startTimeRef.current === null) {
            startTimeRef.current = timestamp;
        }

        const elapsed = timestamp - startTimeRef.current;
        const progress = Math.min(1, elapsed / ANIMATION_DURATION);

        // Easing: ease-out cubic
        const easedProgress = 1 - Math.pow(1 - progress, 3);

        setVar("square2d_sweepProgress", easedProgress);

        if (progress < 1) {
            animationRef.current = requestAnimationFrame(animate);
        } else {
            setVar("square2d_isAnimating", false);
            animationRef.current = null;
            startTimeRef.current = null;
        }
    }, [setVar]);

    // Start reveal animation
    const handleReveal = useCallback(() => {
        if (isRevealed || placedCornerCount < 4) return;

        setVar("square2d_isRevealed", true);
        setVar("square2d_isAnimating", true);
        setVar("square2d_sweepProgress", 0);

        animationRef.current = requestAnimationFrame(animate);
    }, [isRevealed, placedCornerCount, animate, setVar]);

    // Reset the visualization
    const handleReset = useCallback(() => {
        if (animationRef.current) {
            cancelAnimationFrame(animationRef.current);
        }

        setCorners([]);
        setVar("square2d_placedCornerCount", 0);
        setVar("square2d_isRevealed", false);
        setVar("square2d_isAnimating", false);
        setVar("square2d_sweepProgress", 0);
        setVar("square2d_sweptArea", 0);
        setVar("square2d_positionsIncluded", 0);
        startTimeRef.current = null;
    }, [setVar]);

    // Cleanup animation on unmount
    useEffect(() => {
        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, []);

    // Generate prediction outline path (connecting 4 corners)
    const predictionPath = corners.length === 4
        ? `M ${corners[0].x} ${corners[0].y} L ${corners[1].x} ${corners[1].y} L ${corners[2].x} ${corners[2].y} L ${corners[3].x} ${corners[3].y} Z`
        : corners.length > 1
            ? corners.map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x} ${c.y}`).join(' ')
            : '';

    return (
        <div className="flex flex-col items-center gap-4">
            {/* Stats Bar */}
            <div className="flex gap-6 text-sm flex-wrap justify-center">
                <div className="flex items-center gap-2">
                    <span className="text-slate-500">Corners placed:</span>
                    <span
                        className="font-bold text-lg"
                        style={{ color: RED }}
                        data-concept="square2d_placedCornerCount"
                    >
                        {placedCornerCount}/4
                    </span>
                </div>
                {isRevealed && (
                    <>
                        <div className="flex items-center gap-2">
                            <span className="text-slate-500">Positions:</span>
                            <span
                                className="font-semibold"
                                style={{ color: AMBER }}
                                data-concept="square2d_positionsIncluded"
                            >
                                {currentPositions}
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-slate-500">Filled area:</span>
                            <span
                                className="font-semibold"
                                style={{ color: AMBER }}
                                data-concept="square2d_sweptArea"
                            >
                                {Math.round(currentArea)}
                            </span>
                        </div>
                    </>
                )}
            </div>

            {/* Canvas */}
            <div className="relative">
                <svg
                    width={CANVAS_WIDTH}
                    height={CANVAS_HEIGHT}
                    className={`rounded-lg border border-slate-200 ${!isRevealed && placedCornerCount < 4 ? "cursor-crosshair" : ""}`}
                    style={{ backgroundColor: "#FAFAFA" }}
                    onClick={handleCanvasClick}
                >
                    {/* Grid */}
                    <defs>
                        <pattern
                            id="grid-square2d"
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
                        fill="url(#grid-square2d)"
                    />

                    {/* Target zone outline (subtle hint where square will be) */}
                    <rect
                        x={LINE_START_X}
                        y={LINE_Y1}
                        width={LINE_END_X - LINE_START_X}
                        height={LINE_Y2 - LINE_Y1}
                        fill="none"
                        stroke="#e2e8f0"
                        strokeWidth={1}
                        strokeDasharray="4 4"
                    />

                    {/* Swept region (fills in during animation) */}
                    {isRevealed && sweepProgress > 0 && (
                        <rect
                            x={LINE_START_X}
                            y={LINE_Y1}
                            width={(LINE_END_X - LINE_START_X) * sweepProgress}
                            height={LINE_Y2 - LINE_Y1}
                            fill={AMBER}
                            fillOpacity={0.3}
                            stroke={AMBER}
                            strokeWidth={2}
                            data-concept="square2d_sweptArea"
                        />
                    )}

                    {/* Prediction outline (dashed lines connecting placed corners) */}
                    {corners.length > 1 && (
                        <path
                            d={predictionPath}
                            fill={corners.length === 4 ? `${RED}15` : "none"}
                            stroke={RED}
                            strokeWidth={2}
                            strokeDasharray="6 3"
                            strokeOpacity={0.6}
                        />
                    )}

                    {/* Initial vertical line (at start position) */}
                    {!isRevealed && (
                        <line
                            x1={LINE_START_X}
                            y1={LINE_Y1}
                            x2={LINE_START_X}
                            y2={LINE_Y2}
                            stroke={INDIGO}
                            strokeWidth={4}
                            strokeLinecap="round"
                            data-concept="square2d_lineStartX"
                        />
                    )}

                    {/* Sweeping line (moves during animation) */}
                    {isRevealed && (
                        <line
                            x1={currentLineX}
                            y1={LINE_Y1}
                            x2={currentLineX}
                            y2={LINE_Y2}
                            stroke={INDIGO}
                            strokeWidth={4}
                            strokeLinecap="round"
                            data-concept="square2d_sweepProgress"
                        />
                    )}

                    {/* Corner markers */}
                    {corners.map((corner, index) => (
                        <g key={index}>
                            <circle
                                cx={corner.x}
                                cy={corner.y}
                                r={8}
                                fill={RED}
                                stroke="white"
                                strokeWidth={2}
                            />
                            <text
                                x={corner.x}
                                y={corner.y + 4}
                                textAnchor="middle"
                                fill="white"
                                fontSize={10}
                                fontWeight={600}
                                fontFamily="system-ui, sans-serif"
                            >
                                {index + 1}
                            </text>
                        </g>
                    ))}

                    {/* Line endpoint labels */}
                    {!isRevealed && (
                        <>
                            <circle
                                cx={LINE_START_X}
                                cy={LINE_Y1}
                                r={5}
                                fill={INDIGO}
                                stroke="white"
                                strokeWidth={2}
                            />
                            <circle
                                cx={LINE_START_X}
                                cy={LINE_Y2}
                                r={5}
                                fill={INDIGO}
                                stroke="white"
                                strokeWidth={2}
                            />
                        </>
                    )}

                    {/* Instruction text */}
                    {!isRevealed && placedCornerCount < 4 && (
                        <text
                            x={CANVAS_WIDTH / 2}
                            y={CANVAS_HEIGHT - 20}
                            textAnchor="middle"
                            fill="#94a3b8"
                            fontSize={13}
                            fontFamily="system-ui, sans-serif"
                        >
                            Click to place corner {placedCornerCount + 1} of 4
                        </text>
                    )}

                    {/* Ready to reveal message */}
                    {!isRevealed && placedCornerCount === 4 && (
                        <text
                            x={CANVAS_WIDTH / 2}
                            y={CANVAS_HEIGHT - 20}
                            textAnchor="middle"
                            fill={TEAL}
                            fontSize={13}
                            fontWeight={600}
                            fontFamily="system-ui, sans-serif"
                        >
                            All corners placed! Press Reveal to see the sweep.
                        </text>
                    )}

                    {/* Animation counter display */}
                    {isRevealed && isAnimating && (
                        <g>
                            <rect
                                x={CANVAS_WIDTH / 2 - 70}
                                y={20}
                                width={140}
                                height={30}
                                fill="white"
                                stroke={AMBER}
                                strokeWidth={2}
                                rx={6}
                            />
                            <text
                                x={CANVAS_WIDTH / 2}
                                y={40}
                                textAnchor="middle"
                                fill={AMBER}
                                fontSize={13}
                                fontWeight={600}
                                fontFamily="system-ui, sans-serif"
                            >
                                Positions: {currentPositions}...
                            </text>
                        </g>
                    )}

                    {/* Completion message */}
                    {isRevealed && !isAnimating && sweepProgress >= 1 && (
                        <g>
                            <rect
                                x={CANVAS_WIDTH / 2 - 90}
                                y={CANVAS_HEIGHT / 2 - 20}
                                width={180}
                                height={40}
                                fill="white"
                                stroke={TEAL}
                                strokeWidth={2}
                                rx={8}
                            />
                            <text
                                x={CANVAS_WIDTH / 2}
                                y={CANVAS_HEIGHT / 2 + 5}
                                textAnchor="middle"
                                fill={TEAL}
                                fontSize={13}
                                fontWeight={600}
                                fontFamily="system-ui, sans-serif"
                            >
                                The whole interior is filled!
                            </text>
                        </g>
                    )}
                </svg>

                {/* Interaction hint for placing corners */}
                {!isRevealed && placedCornerCount === 0 && (
                    <InteractionHintSequence
                        hintKey="square-2d-click-corners"
                        steps={[
                            {
                                gesture: "click",
                                label: "Click to place a corner prediction",
                                position: { x: "75%", y: "25%" },
                            },
                        ]}
                    />
                )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
                {!isRevealed && placedCornerCount === 4 && (
                    <button
                        onClick={handleReveal}
                        className="px-5 py-2 rounded-lg font-medium text-white transition-colors"
                        style={{ backgroundColor: TEAL }}
                    >
                        Reveal the Sweep
                    </button>
                )}

                {(placedCornerCount > 0 || isRevealed) && (
                    <button
                        onClick={handleReset}
                        className="px-4 py-2 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50 transition-colors text-sm"
                    >
                        Try again
                    </button>
                )}
            </div>
        </div>
    );
}


// ══════════════════════════════════════════════════════════════════════════════
// EXPORTED BLOCKS
// ══════════════════════════════════════════════════════════════════════════════

export const square2dBlocks: ReactElement[] = [
    // ── Section Title ────────────────────────────────────────────────────────
    <StackLayout key="layout-square-title" maxWidth="xl">
        <Block id="square-title" padding="md">
            <EditableH2 id="h2-square-title" blockId="square-title">
                From Line to Square: The Second Dimension
            </EditableH2>
        </Block>
    </StackLayout>,

    // ── Introduction ─────────────────────────────────────────────────────────
    <StackLayout key="layout-square-intro" maxWidth="xl">
        <Block id="square-intro" padding="sm">
            <EditableParagraph id="para-square-intro" blockId="square-intro">
                A line has{" "}
                <InlineSpotColor varName="line1d_segmentLength" color={INDIGO}>
                    length
                </InlineSpotColor>
                , but no width. What happens when we move the entire line{" "}
                <InlineTooltip
                    id="tooltip-perpendicular"
                    tooltip="Perpendicular means at a 90° angle. If the line is vertical, moving it perpendicular means moving it horizontally, sideways."
                >
                    perpendicular
                </InlineTooltip>
                {" "}to itself? Something remarkable fills in.
            </EditableParagraph>
        </Block>
    </StackLayout>,

    // ── Challenge Setup ──────────────────────────────────────────────────────
    <StackLayout key="layout-square-challenge" maxWidth="xl">
        <Block id="square-challenge" padding="sm">
            <EditableParagraph id="para-square-challenge" blockId="square-challenge">
                Here is your challenge: the{" "}
                <InlineSpotColor varName="square2d_lineStartX" color={INDIGO}>
                    blue line
                </InlineSpotColor>
                {" "}on the left is about to sweep rightward. Before it moves, predict where the{" "}
                <InlineSpotColor varName="square2d_placedCornerCount" color="#ef4444">
                    four corners
                </InlineSpotColor>
                {" "}of the final shape will be by clicking to place markers.
            </EditableParagraph>
        </Block>
    </StackLayout>,

    // ── Interactive Visualization ────────────────────────────────────────────
    <StackLayout key="layout-square-visualization" maxWidth="2xl">
        <Block id="square-visualization" padding="md" hasVisualization>
            <PredictSweptShapeVisualization />
        </Block>
    </StackLayout>,

    // ── Guided Exploration ───────────────────────────────────────────────────
    <StackLayout key="layout-square-exploration" maxWidth="xl">
        <Block id="square-exploration" padding="sm">
            <EditableParagraph id="para-square-exploration" blockId="square-exploration">
                Click four spots where you think the corners will end up. Watch the{" "}
                <InlineSpotColor varName="square2d_positionsIncluded" color={AMBER}>
                    positions counter
                </InlineSpotColor>
                {" "}during the sweep. It is counting the intermediate positions of the line, not just the start and end.{" "}
                <InlineTrigger varName="square2d_isRevealed" value={false} icon="refresh">
                    Reset and try again
                </InlineTrigger>
                {" "}to see the sweep from the beginning.
            </EditableParagraph>
        </Block>
    </StackLayout>,

    // ── Key Insight ──────────────────────────────────────────────────────────
    <StackLayout key="layout-square-insight" maxWidth="xl">
        <Block id="square-insight" padding="sm">
            <EditableParagraph id="para-square-insight" blockId="square-insight">
                The surprising discovery: the{" "}
                <InlineSpotColor varName="square2d_sweptArea" color={AMBER}>
                    filled region
                </InlineSpotColor>
                {" "}is not defined by just four corners. Every position of the line during its journey contributes to building the{" "}
                <em>entire interior</em>. A square has two dimensions because it takes two independent directions to reach any point inside it.
            </EditableParagraph>
        </Block>
    </StackLayout>,

    // ── Assessment Question 1 ────────────────────────────────────────────────
    <StackLayout key="layout-square-question-fills" maxWidth="xl">
        <Block id="square-question-fills" padding="md">
            <EditableParagraph id="para-square-question-fills" blockId="square-question-fills">
                The interior of the square is filled by{" "}
                <InlineFeedback
                    varName="answerSquare2dWhatFills"
                    correctValue="every position of the line"
                    position="terminal"
                    successMessage="— exactly! Each position of the sweeping line leaves behind a trace, filling the entire interior"
                    failureMessage="— not quite."
                    hint="Watch the positions counter during the sweep. What is being counted?"
                    reviewBlockId="square-visualization"
                    reviewLabel="Watch the sweep again"
                    visualizationHint={{
                        blockId: "square-visualization",
                        hintKey: "feedback-square-fills-hint",
                        steps: [
                            {
                                gesture: "click",
                                label: "Place four corners, then press Reveal to watch",
                                position: { x: "50%", y: "50%" },
                            },
                        ],
                        label: "See the sweep",
                        resetVars: { square2d_isRevealed: false, square2d_placedCornerCount: 0 },
                    }}
                >
                    <InlineClozeChoice
                        varName="answerSquare2dWhatFills"
                        correctAnswer="every position of the line"
                        options={["the four corners", "the edges only", "every position of the line", "nothing inside"]}
                        {...choicePropsFromDefinition(getVariableInfo("answerSquare2dWhatFills"))}
                    />
                </InlineFeedback>.
            </EditableParagraph>
        </Block>
    </StackLayout>,

    // ── Assessment Question 2 ────────────────────────────────────────────────
    <StackLayout key="layout-square-question-dimension" maxWidth="xl">
        <Block id="square-question-dimension" padding="md">
            <EditableParagraph id="para-square-question-dimension" blockId="square-question-dimension">
                A square has{" "}
                <InlineFeedback
                    varName="answerSquare2dDimension"
                    correctValue="two"
                    position="mid"
                    successMessage="✓"
                    failureMessage="✗"
                    hint="A line has one dimension (length). Moving the line adds what new direction?"
                    reviewBlockId="square-insight"
                    reviewLabel="Review the insight"
                >
                    <InlineClozeChoice
                        varName="answerSquare2dDimension"
                        correctAnswer="two"
                        options={["zero", "one", "two", "three"]}
                        {...choicePropsFromDefinition(getVariableInfo("answerSquare2dDimension"))}
                    />
                </InlineFeedback>{" "}
                dimensions.
            </EditableParagraph>
        </Block>
    </StackLayout>,

    // ── Bridge to Next Section ───────────────────────────────────────────────
    <StackLayout key="layout-square-bridge" maxWidth="xl">
        <Block id="square-bridge" padding="sm">
            <EditableParagraph id="para-square-bridge" blockId="square-bridge">
                We started with a line at{" "}
                <InlineSpotColor varName="line1d_segmentLength" color={INDIGO}>
                    one dimension
                </InlineSpotColor>
                . By sweeping it perpendicular to itself, we created a square with{" "}
                <InlineSpotColor varName="square2d_sweptArea" color={AMBER}>
                    two dimensions
                </InlineSpotColor>
                : length and width. What if we now take this square and move it in a{" "}
                <em>third</em> direction, perpendicular to its surface? We create the third dimension: a cube.
            </EditableParagraph>
        </Block>
    </StackLayout>,
];
