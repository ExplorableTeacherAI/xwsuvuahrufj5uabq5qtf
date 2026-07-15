import React, { type ReactElement, Suspense, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera, Line } from "@react-three/drei";
import { StackLayout } from "@/components/layouts";
import { Block } from "@/components/templates";
import {
    EditableH1,
    EditableParagraph,
} from "@/components/atoms";
import {
    tesseractVertices4D,
    tesseractEdges,
    rotateXW,
    rotateYW,
    project4Dto3D,
} from "../model";

// ══════════════════════════════════════════════════════════════════════════════
// SECTION: Intro Hook - Animated Tesseract
// ══════════════════════════════════════════════════════════════════════════════
//
// This hook section shows a rotating tesseract to spark curiosity before
// the lesson begins. The goal is to make students wonder: "How is this built?"
// ══════════════════════════════════════════════════════════════════════════════

const VIOLET = "#AC8BF9";

function RotatingTesseractScene() {
    const angleRef = useRef({ xw: 0, yw: 0 });
    const vertices4D = useMemo(() => tesseractVertices4D(), []);
    const edges = useMemo(() => tesseractEdges(), []);

    // Animate the rotation
    useFrame((_, delta) => {
        angleRef.current.xw += delta * 0.5;
        angleRef.current.yw += delta * 0.3;
    });

    // Force re-render on each frame
    const [, setTick] = useState(0);
    useFrame(() => setTick((t) => t + 1));

    const scale = 0.75; // Tesseract size
    const currentVertices = vertices4D.map((v) => {
        let rotated = rotateXW(v, angleRef.current.xw);
        rotated = rotateYW(rotated, angleRef.current.yw);
        const projected = project4Dto3D(rotated, 3);
        return [projected[0] * scale, projected[1] * scale, projected[2] * scale] as [number, number, number];
    });

    return (
        <>
            <ambientLight intensity={0.6} />
            <directionalLight position={[3, 4, 5]} intensity={0.7} />

            {/* Tesseract edges */}
            {edges.map(([i, j], idx) => (
                <Line
                    key={`edge-${idx}`}
                    points={[currentVertices[i], currentVertices[j]]}
                    color={VIOLET}
                    lineWidth={2}
                />
            ))}

            {/* Tesseract vertices */}
            {currentVertices.map((pos, i) => (
                <mesh key={`v-${i}`} position={pos}>
                    <sphereGeometry args={[0.05, 12, 12]} />
                    <meshStandardMaterial color={VIOLET} />
                </mesh>
            ))}
        </>
    );
}

function AnimatedTesseractHook() {
    return (
        <div className="flex flex-col items-center gap-4">
            <div className="relative bg-white rounded-lg w-full" style={{ height: 350 }}>
                <Canvas dpr={[1, 2]}>
                    <PerspectiveCamera makeDefault position={[0, 0, 5]} fov={45} />
                    <Suspense fallback={null}>
                        <RotatingTesseractScene />
                    </Suspense>
                    <OrbitControls enableDamping dampingFactor={0.1} />
                </Canvas>
            </div>
        </div>
    );
}

// ══════════════════════════════════════════════════════════════════════════════
// EXPORTED BLOCKS
// ══════════════════════════════════════════════════════════════════════════════

export const introHookBlocks: ReactElement[] = [
    // ── Lesson Title ──────────────────────────────────────────────────────────
    <StackLayout key="layout-intro-title" maxWidth="xl">
        <Block id="intro-title" padding="md">
            <EditableH1 id="h1-intro-title" blockId="intro-title">
                Tesseract
            </EditableH1>
        </Block>
    </StackLayout>,

    // ── Hook Question ─────────────────────────────────────────────────────────
    <StackLayout key="layout-intro-hook-question" maxWidth="xl">
        <Block id="intro-hook-question" padding="sm">
            <EditableParagraph id="para-intro-hook-question" blockId="intro-hook-question">
                Have you ever wondered how this mysterious 4D shape is constructed?
            </EditableParagraph>
        </Block>
    </StackLayout>,

    // ── Animated Tesseract ────────────────────────────────────────────────────
    <StackLayout key="layout-intro-animated-tesseract" maxWidth="xl">
        <Block id="intro-animated-tesseract" padding="md" hasVisualization>
            <AnimatedTesseractHook />
        </Block>
    </StackLayout>,

    // ── Invitation to Learn ───────────────────────────────────────────────────
    <StackLayout key="layout-intro-invitation" maxWidth="xl">
        <Block id="intro-invitation" padding="sm">
            <EditableParagraph id="para-intro-invitation" blockId="intro-invitation">
                This is a tesseract — the 4D version of a cube. Let's discover how to build one, starting from a single point.
            </EditableParagraph>
        </Block>
    </StackLayout>,
];
