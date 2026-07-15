import { type ReactElement, useCallback, useState, useEffect } from "react";
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
    segmentLength,
    movementEfficiency,
    budgetColor,
} from "../model";

// ══════════════════════════════════════════════════════════════════════════════
// SECTION: Point to Line (0D → 1D) - Point Budget Game
// ══════════════════════════════════════════════════════════════════════════════
//
// Learning objective: Understand that dragging a point creates a line segment
// with one dimension (length). The segment's length depends only on where the
// point ends up relative to where it started, not on the path taken.
//
// Design: A "Point Budget" game where students have 100 movement units to spend.
// They move a point using arrow keys/buttons and see that wandering wastes budget
// but the final segment length only depends on displacement, not the path taken.
// ══════════════════════════════════════════════════════════════════════════════

// ── Constants ────────────────────────────────────────────────────────────────
const CANVAS_WIDTH = 340;
const CANVAS_HEIGHT = 280;
const STEP_SIZE = 20; // Each arrow press moves 20 units
const INITIAL_BUDGET = 100;
const POINT_RADIUS = 6;

// Colors from the muted palette
const TEAL = "#62D0AD";         // Start point / segment
const INDIGO = "#8E90F5";       // Segment length display
const AMBER = "#F7B23B";        // Distance traveled / path
const VIOLET = "#AC8BF9";       // Efficiency

// ── Types ────────────────────────────────────────────────────────────────────
interface PathPoint {
    x: number;
    y: number;
}

// ══════════════════════════════════════════════════════════════════════════════
// BESPOKE VISUALIZATION: Point Budget Game
// ══════════════════════════════════════════════════════════════════════════════

function PointBudgetVisualization() {
    const setVar = useSetVar();

    // Read from store
    const hasStarted = useVar("line1d_hasStarted", false) as boolean;
    const isComplete = useVar("line1d_isComplete", false) as boolean;
    const budget = useVar("line1d_budget", INITIAL_BUDGET) as number;
    const startX = useVar("line1d_startX", CANVAS_WIDTH / 2) as number;
    const startY = useVar("line1d_startY", CANVAS_HEIGHT / 2) as number;
    const currentX = useVar("line1d_currentX", CANVAS_WIDTH / 2) as number;
    const currentY = useVar("line1d_currentY", CANVAS_HEIGHT / 2) as number;
    const distanceTraveled = useVar("line1d_distanceTraveled", 0) as number;
    const segmentLen = useVar("line1d_segmentLength", 0) as number;
    const efficiency = useVar("line1d_efficiency", 0) as number;

    // Local state for path trail
    const [pathPoints, setPathPoints] = useState<PathPoint[]>([]);

    // Reset the game
    const resetGame = useCallback(() => {
        setVar("line1d_hasStarted", false);
        setVar("line1d_isComplete", false);
        setVar("line1d_budget", INITIAL_BUDGET);
        setVar("line1d_startX", CANVAS_WIDTH / 2);
        setVar("line1d_startY", CANVAS_HEIGHT / 2);
        setVar("line1d_currentX", CANVAS_WIDTH / 2);
        setVar("line1d_currentY", CANVAS_HEIGHT / 2);
        setVar("line1d_distanceTraveled", 0);
        setVar("line1d_segmentLength", 0);
        setVar("line1d_efficiency", 0);
        setPathPoints([]);
    }, [setVar]);

    // Handle canvas click to place starting point
    const handleCanvasClick = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
        if (hasStarted) return;

        const svg = e.currentTarget;
        const rect = svg.getBoundingClientRect();
        const x = Math.max(30, Math.min(CANVAS_WIDTH - 30, e.clientX - rect.left));
        const y = Math.max(30, Math.min(CANVAS_HEIGHT - 30, e.clientY - rect.top));

        setVar("line1d_startX", x);
        setVar("line1d_startY", y);
        setVar("line1d_currentX", x);
        setVar("line1d_currentY", y);
        setVar("line1d_hasStarted", true);
        setPathPoints([{ x, y }]);
    }, [hasStarted, setVar]);

    // Move in a direction
    const move = useCallback((dx: number, dy: number) => {
        if (!hasStarted || isComplete || budget < STEP_SIZE) return;

        const newX = Math.max(10, Math.min(CANVAS_WIDTH - 10, currentX + dx));
        const newY = Math.max(10, Math.min(CANVAS_HEIGHT - 10, currentY + dy));

        // If position didn't change (hit boundary), don't deduct budget
        if (newX === currentX && newY === currentY) return;

        const stepDistance = Math.sqrt(dx * dx + dy * dy);
        const newBudget = Math.max(0, budget - stepDistance);
        const newDistanceTraveled = distanceTraveled + stepDistance;
        const newSegmentLen = segmentLength(startX, startY, newX, newY);
        const newEfficiency = movementEfficiency(newSegmentLen, newDistanceTraveled);

        setVar("line1d_currentX", newX);
        setVar("line1d_currentY", newY);
        setVar("line1d_budget", Math.round(newBudget));
        setVar("line1d_distanceTraveled", Math.round(newDistanceTraveled));
        setVar("line1d_segmentLength", Math.round(newSegmentLen * 10) / 10);
        setVar("line1d_efficiency", Math.round(newEfficiency));

        setPathPoints(prev => [...prev, { x: newX, y: newY }]);

        if (newBudget <= 0) {
            setVar("line1d_isComplete", true);
        }
    }, [hasStarted, isComplete, budget, currentX, currentY, startX, startY, distanceTraveled, setVar]);

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!hasStarted || isComplete) return;

            switch (e.key) {
                case "ArrowUp":
                    e.preventDefault();
                    move(0, -STEP_SIZE);
                    break;
                case "ArrowDown":
                    e.preventDefault();
                    move(0, STEP_SIZE);
                    break;
                case "ArrowLeft":
                    e.preventDefault();
                    move(-STEP_SIZE, 0);
                    break;
                case "ArrowRight":
                    e.preventDefault();
                    move(STEP_SIZE, 0);
                    break;
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [hasStarted, isComplete, move]);

    // Generate path polyline
    const pathString = pathPoints.map((p, i) =>
        `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`
    ).join(" ");

    const currentBudgetColor = budgetColor(budget, INITIAL_BUDGET);

    return (
        <div className="flex flex-col items-center gap-4">
            {/* Stats Bar */}
            <div className="flex gap-6 text-sm flex-wrap justify-center">
                <div className="flex items-center gap-2">
                    <span className="text-slate-500">Budget:</span>
                    <span
                        className="font-bold text-lg"
                        style={{ color: currentBudgetColor }}
                        data-concept="line1d_budget"
                    >
                        {budget}
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-slate-500">Traveled:</span>
                    <span
                        className="font-semibold"
                        style={{ color: AMBER }}
                        data-concept="line1d_distanceTraveled"
                    >
                        {distanceTraveled}
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-slate-500">Segment:</span>
                    <span
                        className="font-semibold"
                        style={{ color: INDIGO }}
                        data-concept="line1d_segmentLength"
                    >
                        {segmentLen}
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-slate-500">Efficiency:</span>
                    <span
                        className="font-semibold"
                        style={{ color: VIOLET }}
                        data-concept="line1d_efficiency"
                    >
                        {efficiency}%
                    </span>
                </div>
            </div>

            {/* Canvas */}
            <div className="relative">
                <svg
                    width={CANVAS_WIDTH}
                    height={CANVAS_HEIGHT}
                    className={`rounded-lg border border-slate-200 ${!hasStarted ? "cursor-crosshair" : ""}`}
                    style={{ backgroundColor: "#FAFAFA" }}
                    onClick={handleCanvasClick}
                    tabIndex={0}
                >
                    {/* Grid */}
                    <defs>
                        <pattern
                            id="grid-line1d"
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
                        fill="url(#grid-line1d)"
                    />

                    {/* Path trail (thin, semi-transparent) */}
                    {pathPoints.length > 1 && (
                        <path
                            d={pathString}
                            fill="none"
                            stroke={AMBER}
                            strokeWidth={2}
                            strokeOpacity={0.4}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            data-concept="line1d_distanceTraveled"
                        />
                    )}

                    {/* Segment (thick, vibrant) - from start to current */}
                    {hasStarted && (
                        <line
                            x1={startX}
                            y1={startY}
                            x2={currentX}
                            y2={currentY}
                            stroke={INDIGO}
                            strokeWidth={4}
                            strokeDasharray="6 3"
                            strokeLinecap="round"
                            data-concept="line1d_segmentLength"
                        />
                    )}

                    {/* Start point */}
                    {hasStarted && (
                        <g data-concept="line1d_startPoint">
                            <circle
                                cx={startX}
                                cy={startY}
                                r={POINT_RADIUS}
                                fill={TEAL}
                                stroke="white"
                                strokeWidth={2}
                            />
                            <text
                                x={startX}
                                y={startY - 12}
                                textAnchor="middle"
                                fill="#64748b"
                                fontSize={10}
                                fontFamily="system-ui, sans-serif"
                            >
                                start
                            </text>
                        </g>
                    )}

                    {/* Current point (draggable appearance) */}
                    {hasStarted && (
                        <g data-concept="line1d_currentPoint">
                            <circle
                                cx={currentX}
                                cy={currentY}
                                r={POINT_RADIUS + 2}
                                fill="none"
                                stroke={TEAL}
                                strokeWidth={2}
                                opacity={0.5}
                            />
                            <circle
                                cx={currentX}
                                cy={currentY}
                                r={POINT_RADIUS}
                                fill={TEAL}
                                stroke="white"
                                strokeWidth={2}
                                style={{ cursor: hasStarted && !isComplete ? "grab" : "default" }}
                            />
                        </g>
                    )}

                    {/* Length label on segment */}
                    {hasStarted && segmentLen > 10 && (
                        <text
                            x={(startX + currentX) / 2}
                            y={(startY + currentY) / 2 - 10}
                            textAnchor="middle"
                            fill={INDIGO}
                            fontSize={12}
                            fontWeight={600}
                            fontFamily="system-ui, sans-serif"
                        >
                            {segmentLen} units
                        </text>
                    )}

                    {/* Instruction text */}
                    {!hasStarted && (
                        <text
                            x={CANVAS_WIDTH / 2}
                            y={CANVAS_HEIGHT / 2}
                            textAnchor="middle"
                            fill="#94a3b8"
                            fontSize={14}
                            fontFamily="system-ui, sans-serif"
                        >
                            Click to place your starting point
                        </text>
                    )}

                    {/* Game complete overlay */}
                    {isComplete && (
                        <g>
                            <rect
                                x={CANVAS_WIDTH / 2 - 80}
                                y={CANVAS_HEIGHT / 2 - 25}
                                width={160}
                                height={50}
                                fill="white"
                                stroke={INDIGO}
                                strokeWidth={2}
                                rx={8}
                            />
                            <text
                                x={CANVAS_WIDTH / 2}
                                y={CANVAS_HEIGHT / 2 - 5}
                                textAnchor="middle"
                                fill={INDIGO}
                                fontSize={13}
                                fontWeight={600}
                                fontFamily="system-ui, sans-serif"
                            >
                                Budget spent!
                            </text>
                            <text
                                x={CANVAS_WIDTH / 2}
                                y={CANVAS_HEIGHT / 2 + 15}
                                textAnchor="middle"
                                fill="#64748b"
                                fontSize={11}
                                fontFamily="system-ui, sans-serif"
                            >
                                Segment: {segmentLen} units
                            </text>
                        </g>
                    )}
                </svg>

                {/* Interaction hint */}
                {!hasStarted && (
                    <InteractionHintSequence
                        hintKey="line-1d-click-hint"
                        steps={[
                            {
                                gesture: "click",
                                label: "Click to place starting point",
                                position: { x: "50%", y: "50%" },
                            },
                        ]}
                    />
                )}
            </div>

            {/* Arrow controls */}
            {hasStarted && !isComplete && (
                <div className="flex flex-col items-center gap-1">
                    <button
                        onClick={() => move(0, -STEP_SIZE)}
                        className="w-10 h-10 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 font-bold text-lg transition-colors"
                        aria-label="Move up"
                    >
                        ↑
                    </button>
                    <div className="flex gap-1">
                        <button
                            onClick={() => move(-STEP_SIZE, 0)}
                            className="w-10 h-10 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 font-bold text-lg transition-colors"
                            aria-label="Move left"
                        >
                            ←
                        </button>
                        <button
                            onClick={() => move(STEP_SIZE, 0)}
                            className="w-10 h-10 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 font-bold text-lg transition-colors"
                            aria-label="Move right"
                        >
                            →
                        </button>
                    </div>
                    <button
                        onClick={() => move(0, STEP_SIZE)}
                        className="w-10 h-10 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 font-bold text-lg transition-colors"
                        aria-label="Move down"
                    >
                        ↓
                    </button>
                    <p className="text-xs text-slate-400 mt-1">
                        or use arrow keys
                    </p>
                </div>
            )}

            {/* Reset button */}
            {hasStarted && (
                <button
                    onClick={resetGame}
                    className="text-sm px-4 py-2 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50 transition-colors"
                >
                    Try again
                </button>
            )}
        </div>
    );
}


// ══════════════════════════════════════════════════════════════════════════════
// EXPORTED BLOCKS
// ══════════════════════════════════════════════════════════════════════════════

export const line1dBlocks: ReactElement[] = [
    // ── Section Title ────────────────────────────────────────────────────────
    <StackLayout key="layout-line-title" maxWidth="xl">
        <Block id="line-title" padding="md">
            <EditableH2 id="h2-line-title" blockId="line-title">
                From Point to Line: The First Dimension
            </EditableH2>
        </Block>
    </StackLayout>,

    // ── Introduction ─────────────────────────────────────────────────────────
    <StackLayout key="layout-line-intro" maxWidth="xl">
        <Block id="line-intro" padding="sm">
            <EditableParagraph id="para-line-intro" blockId="line-intro">
                A point has no size, just position. But what happens when a point{" "}
                <InlineTooltip
                    id="tooltip-moves"
                    tooltip="Moving a point through space traces out a path. The key insight: the resulting line segment only cares about where you end up, not how you got there."
                >
                    moves
                </InlineTooltip>
                ? Something remarkable appears:{" "}
                <InlineSpotColor varName="line1d_segmentLength" color={INDIGO}>
                    length
                </InlineSpotColor>
                , the very first dimension.
            </EditableParagraph>
        </Block>
    </StackLayout>,

    // ── Challenge Setup ──────────────────────────────────────────────────────
    <StackLayout key="layout-line-challenge" maxWidth="xl">
        <Block id="line-challenge" padding="sm">
            <EditableParagraph id="para-line-challenge" blockId="line-challenge">
                Here is a challenge: you have exactly{" "}
                <InlineSpotColor varName="line1d_budget" color="#22c55e">
                    100 movement units
                </InlineSpotColor>
                {" "}to spend. Your goal is to create the{" "}
                <InlineSpotColor varName="line1d_segmentLength" color={INDIGO}>
                    longest possible line segment
                </InlineSpotColor>
                {" "}from your starting point. Will you move in a straight line, or wander around?
            </EditableParagraph>
        </Block>
    </StackLayout>,

    // ── Interactive Visualization ────────────────────────────────────────────
    <StackLayout key="layout-line-visualization" maxWidth="2xl">
        <Block id="line-visualization" padding="md" hasVisualization>
            <PointBudgetVisualization />
        </Block>
    </StackLayout>,

    // ── Guided Exploration ───────────────────────────────────────────────────
    <StackLayout key="layout-line-exploration" maxWidth="xl">
        <Block id="line-exploration" padding="sm">
            <EditableParagraph id="para-line-exploration" blockId="line-exploration">
                Click the canvas to place your starting point, then use the arrow buttons (or keyboard arrows) to move. Watch two numbers:{" "}
                <InlineSpotColor varName="line1d_distanceTraveled" color={AMBER}>
                    distance traveled
                </InlineSpotColor>
                {" "}(your total path) and{" "}
                <InlineSpotColor varName="line1d_segmentLength" color={INDIGO}>
                    segment length
                </InlineSpotColor>
                {" "}(the straight-line distance from start to finish).{" "}
                <InlineTrigger varName="line1d_hasStarted" value={false} icon="refresh">
                    Reset
                </InlineTrigger>
                {" "}and try different paths to the same endpoint.
            </EditableParagraph>
        </Block>
    </StackLayout>,

    // ── Key Insight ──────────────────────────────────────────────────────────
    <StackLayout key="layout-line-insight" maxWidth="xl">
        <Block id="line-insight" padding="sm">
            <EditableParagraph id="para-line-insight" blockId="line-insight">
                The surprising discovery: your{" "}
                <InlineSpotColor varName="line1d_segmentLength" color={INDIGO}>
                    segment length
                </InlineSpotColor>
                {" "}depends only on where you{" "}
                <InlineSpotColor varName="line1d_currentX" color={TEAL}>
                    end up
                </InlineSpotColor>
                {" "}relative to where you started, not on the path you took to get there. The wandering path and the straight path to the same endpoint create{" "}
                <em>exactly the same segment</em>. This is what dimension measures: extent in a direction, not the journey itself.
            </EditableParagraph>
        </Block>
    </StackLayout>,

    // ── Assessment Question 1 ────────────────────────────────────────────────
    <StackLayout key="layout-line-question-depends" maxWidth="xl">
        <Block id="line-question-depends" padding="md">
            <EditableParagraph id="para-line-question-depends" blockId="line-question-depends">
                The length of a line segment depends on{" "}
                <InlineFeedback
                    varName="answerLine1dSegmentDependsOn"
                    correctValue="endpoints only"
                    position="terminal"
                    successMessage="— exactly! The segment only cares about its endpoints, not how you traveled between them"
                    failureMessage="— not quite."
                    hint="Think about what stayed the same when you took different paths to the same place"
                    reviewBlockId="line-visualization"
                    reviewLabel="Try two paths to the same point"
                    visualizationHint={{
                        blockId: "line-visualization",
                        hintKey: "feedback-line-segment-hint",
                        steps: [
                            {
                                gesture: "click",
                                label: "Place a starting point",
                                position: { x: "50%", y: "50%" },
                            },
                        ],
                        label: "Try the game again",
                        resetVars: { line1d_hasStarted: false },
                    }}
                >
                    <InlineClozeChoice
                        varName="answerLine1dSegmentDependsOn"
                        correctAnswer="endpoints only"
                        options={["the path taken", "endpoints only", "total distance", "number of turns"]}
                        {...choicePropsFromDefinition(getVariableInfo("answerLine1dSegmentDependsOn"))}
                    />
                </InlineFeedback>.
            </EditableParagraph>
        </Block>
    </StackLayout>,

    // ── Assessment Question 2 ────────────────────────────────────────────────
    <StackLayout key="layout-line-question-dimension" maxWidth="xl">
        <Block id="line-question-dimension" padding="md">
            <EditableParagraph id="para-line-question-dimension" blockId="line-question-dimension">
                A line segment has{" "}
                <InlineFeedback
                    varName="answerLine1dDimension"
                    correctValue="one"
                    position="mid"
                    successMessage="Correct!"
                    failureMessage="Not quite."
                    hint="A point has zero dimensions. Moving it creates length, the first dimension"
                    reviewBlockId="line-insight"
                    reviewLabel="Review the insight"
                >
                    <InlineClozeChoice
                        varName="answerLine1dDimension"
                        correctAnswer="one"
                        options={["zero", "one", "two", "three"]}
                        {...choicePropsFromDefinition(getVariableInfo("answerLine1dDimension"))}
                    />
                </InlineFeedback>{" "}
                dimension.
            </EditableParagraph>
        </Block>
    </StackLayout>,

    // ── Bridge to Next Section ───────────────────────────────────────────────
    <StackLayout key="layout-line-bridge" maxWidth="xl">
        <Block id="line-bridge" padding="sm">
            <EditableParagraph id="para-line-bridge" blockId="line-bridge">
                We started with a point at{" "}
                <InlineSpotColor varName="point0dMathWidth" color="#8E90F5">
                    zero dimensions
                </InlineSpotColor>
                . By moving it, we created a line segment with{" "}
                <InlineSpotColor varName="line1d_segmentLength" color={INDIGO}>
                    one dimension
                </InlineSpotColor>
                : length. What if we now take this line and move it in a{" "}
                <em>new</em> direction, perpendicular to itself? We create the second dimension.
            </EditableParagraph>
        </Block>
    </StackLayout>,
];
