"use client";

import { ContactShadows, Environment, Lightformer } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef, type RefObject } from "react";
import * as THREE from "three";

import type { RacketInputs } from "../lib/inputs";
import { HANDLE, HEAD, headHoles, headOutline } from "../lib/racket-shape";

/**
 * The 3D racket, modelled entirely in code: an extruded, perforated carbon face, a
 * glossy rim, a wrapped grip, and orange rings marking the logo's 21 holes. Loaded
 * lazily by RacketStage, only on capable devices that haven't asked for less motion.
 */

export type RacketColors = { carbon: string; accent: string; light: string };

// Idle motion sways around a three-quarter view instead of spinning, so the
// perforated face — the logo's holes — is what you see most; dragging turns it fully.
const SWAY = 0.55;
const SWAY_SPEED = 0.45;
const FACING = 0.35;
// The racket eases towards where it's dragged rather than snapping, which is what
// makes dragging feel smooth; the idle sway fades out meanwhile and returns later.
const FOLLOW_TIME = 0.12;
const MOMENTUM_TIME = 0.5;
const IDLE_RESUME_MS = 2500;
// The ball must stay inside this share of the frame (normalised device coordinates).
const FRAME_LIMIT = 0.8;
const BALL_PERIOD = 2.6;
const BALL_RADIUS = 0.33;
// How far the ball flies off the face. Kept short so that at any angle the racket is
// turned to, the ball stays inside the stage instead of swinging out of frame.
const BALL_REACH = 2;

/** A small woven-carbon texture drawn on a canvas — no image file to download. */
function carbonTexture() {
  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const cell = size / 8;
  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 8; x++) {
      // 2×2 twill: tows alternate direction, offset by one each row.
      const horizontal = (x + y) % 4 < 2;
      const g = ctx.createLinearGradient(
        x * cell,
        y * cell,
        horizontal ? x * cell + cell : x * cell,
        horizontal ? y * cell : y * cell + cell,
      );
      g.addColorStop(0, "#1c1c1c");
      g.addColorStop(0.5, "#3a3a3a");
      g.addColorStop(1, "#1c1c1c");
      ctx.fillStyle = g;
      ctx.fillRect(x * cell, y * cell, cell, cell);
    }
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(1.6, 1.6);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function useRacketGeometry() {
  return useMemo(() => {
    const outline = headOutline(96);
    const shape = new THREE.Shape(outline.map((p) => new THREE.Vector2(p.x, p.y)));
    const holes = headHoles();
    for (const h of holes) {
      const path = new THREE.Path();
      path.absarc(h.x, h.y, h.r, 0, Math.PI * 2, true);
      shape.holes.push(path);
    }
    const face = new THREE.ExtrudeGeometry(shape, {
      depth: HEAD.thickness,
      bevelEnabled: true,
      bevelThickness: 0.04,
      bevelSize: 0.03,
      bevelSegments: 3,
      curveSegments: 16,
    });
    face.translate(0, 0, -HEAD.thickness / 2);

    const rimCurve = new THREE.CatmullRomCurve3(
      outline.map((p) => new THREE.Vector3(p.x, p.y, 0)),
      true,
    );
    const rim = new THREE.TubeGeometry(rimCurve, 240, HEAD.thickness * 0.32, 12, true);

    const handleTop = HEAD.throatY + 0.05;
    const handle = new THREE.CylinderGeometry(
      HANDLE.radius,
      HANDLE.radius * 1.08,
      HANDLE.length,
      24,
    );
    handle.translate(0, handleTop - HANDLE.length / 2, 0);

    // Overgrip: a helix wound down the handle.
    const turns = 9;
    const gripCurve = new THREE.CatmullRomCurve3(
      Array.from({ length: turns * 16 + 1 }, (_, i) => {
        const t = i / (turns * 16);
        const a = t * turns * Math.PI * 2;
        const r = HANDLE.radius * 1.06;
        return new THREE.Vector3(
          Math.cos(a) * r,
          handleTop - 0.12 - t * (HANDLE.length - 0.3),
          Math.sin(a) * r,
        );
      }),
    );
    const grip = new THREE.TubeGeometry(gripCurve, turns * 32, 0.035, 8, false);

    const cap = new THREE.CylinderGeometry(HANDLE.radius * 1.25, HANDLE.radius * 1.2, 0.14, 24);
    cap.translate(0, handleTop - HANDLE.length - 0.04, 0);

    const logoHoles = holes.filter((h) => h.logo);
    return { face, rim, handle, grip, cap, logoHoles };
  }, []);
}

function Racket({ colors, inputs }: { colors: RacketColors; inputs: RefObject<RacketInputs> }) {
  const geo = useRacketGeometry();
  const spin = useRef<THREE.Group>(null);
  const ball = useRef<THREE.Mesh>(null);
  const rings = useRef<THREE.InstancedMesh>(null);
  const turn = useRef(0);
  const yaw = useRef(FACING);
  const pitch = useRef(0);
  const idle = useRef(1);
  const coast = useRef(0);
  const velocity = useRef(0);
  const wasDragging = useRef(false);
  const near = useMemo(() => new THREE.Vector3(), []);
  const far = useMemo(() => new THREE.Vector3(), []);

  const materials = useMemo(() => {
    const carbon = carbonTexture();
    return {
      face: new THREE.MeshPhysicalMaterial({
        color: colors.carbon,
        map: carbon,
        roughness: 0.45,
        metalness: 0.25,
        clearcoat: 1,
        clearcoatRoughness: 0.12,
      }),
      rim: new THREE.MeshStandardMaterial({
        color: colors.carbon,
        roughness: 0.25,
        metalness: 0.7,
      }),
      accent: new THREE.MeshStandardMaterial({ color: colors.accent, roughness: 0.45 }),
      ball: new THREE.MeshStandardMaterial({
        color: colors.accent,
        roughness: 0.6,
        emissive: colors.accent,
        emissiveIntensity: 0.15,
      }),
    };
  }, [colors]);
  useEffect(() => () => Object.values(materials).forEach((m) => m.dispose()), [materials]);

  // Orange rings around the logo holes, on both faces.
  useEffect(() => {
    const mesh = rings.current;
    if (!mesh) return;
    const m = new THREE.Matrix4();
    geo.logoHoles.forEach((h, i) => {
      for (const side of [0, 1]) {
        const z = (side ? -1 : 1) * (HEAD.thickness / 2 + 0.045);
        m.makeTranslation(h.x, h.y, z);
        mesh.setMatrixAt(i * 2 + side, m);
      }
    });
    mesh.instanceMatrix.needsUpdate = true;
  }, [geo]);

  useFrame((state, dt) => {
    const t = state.clock.elapsedTime;
    const input = inputs.current;
    // Let go with some spin and it carries on, slowing down.
    if (wasDragging.current && !input.dragging) velocity.current = input.velocity;
    wasDragging.current = input.dragging;
    if (!input.dragging && velocity.current) {
      coast.current += velocity.current * dt;
      velocity.current *= Math.exp(-dt / MOMENTUM_TIME);
      if (Math.abs(velocity.current) < 0.01) velocity.current = 0;
    }
    const resting = performance.now() - input.lastDrag > IDLE_RESUME_MS;
    idle.current += ((resting ? 1 : 0) - idle.current) * (1 - Math.exp(-dt / 0.6));
    turn.current += (input.nudge - turn.current) * (1 - Math.exp(-dt / 0.25));

    // Idle sway + keyboard turns + dragging + a turn tied to scrolling past, all eased.
    const yawTarget =
      FACING +
      Math.sin(t * SWAY_SPEED) * SWAY * idle.current +
      turn.current +
      input.dragYaw +
      coast.current +
      input.scroll * Math.PI * 0.5;
    const pitchTarget = -0.12 + Math.sin(t * 0.6) * 0.08 * idle.current + input.dragPitch;
    const follow = 1 - Math.exp(-dt / FOLLOW_TIME);
    yaw.current += (yawTarget - yaw.current) * follow;
    pitch.current += (pitchTarget - pitch.current) * follow;
    if (spin.current) {
      spin.current.rotation.y = yaw.current;
      spin.current.rotation.x = pitch.current;
      spin.current.position.y = Math.sin(t * 1.1) * 0.08 * idle.current;
    }

    // The ball flies in, meets the face at mid-cycle, and goes back out — never further
    // than the frame allows at the racket's current angle.
    const b = ball.current;
    if (!b) return;
    const p = (t % BALL_PERIOD) / BALL_PERIOD;
    const out = Math.abs(1 - 2 * p);
    const y = HEAD.centreY + 0.1 + out * 1.2 - out * out * 0.8;
    const faceZ = HEAD.thickness / 2 + BALL_RADIUS;
    const reach = out * BALL_REACH;
    const project = (z: number, into: THREE.Vector3) => {
      b.position.set(0.25, y, z);
      b.updateWorldMatrix(true, false);
      return into.setFromMatrixPosition(b.matrixWorld).project(state.camera);
    };
    project(faceZ, near);
    project(faceZ + reach, far);
    // Screen position moves almost linearly with the reach, so solve for the share of
    // it that keeps each axis inside the limit.
    let share = 1;
    for (const axis of ["x", "y"] as const) {
      const end = far[axis];
      if (Math.abs(end) <= FRAME_LIMIT) continue;
      const edge = Math.sign(end) * FRAME_LIMIT;
      share = Math.min(share, Math.max(0, (edge - near[axis]) / (end - near[axis] || 1)));
    }
    b.position.set(0.25, y, faceZ + reach * share);
    const squash = out < 0.04 ? 0.8 : 1;
    b.scale.set(1 / squash, 1 / squash, squash);
  });

  return (
    <group ref={spin}>
      {/* Centre the racket (top of head to butt cap) on the origin. */}
      <group position={[0, 0.75, 0]}>
        <mesh geometry={geo.face} material={materials.face} castShadow />
        <mesh geometry={geo.rim} material={materials.rim} />
        <mesh geometry={geo.handle} material={materials.rim} />
        <mesh geometry={geo.grip} material={materials.accent} />
        <mesh geometry={geo.cap} material={materials.rim} />
        <instancedMesh
          ref={rings}
          args={[undefined, undefined, geo.logoHoles.length * 2]}
          material={materials.accent}
        >
          <torusGeometry args={[0.1, 0.018, 8, 24]} />
        </instancedMesh>
        <mesh ref={ball} material={materials.ball}>
          <sphereGeometry args={[BALL_RADIUS, 32, 16]} />
        </mesh>
      </group>
    </group>
  );
}

export default function RacketCanvas({
  colors,
  inputs,
  active,
  onReady,
}: {
  colors: RacketColors;
  inputs: RefObject<RacketInputs>;
  /** Off screen the render loop stops entirely. */
  active: boolean;
  onReady: () => void;
}) {
  return (
    <Canvas
      frameloop={active ? "always" : "never"}
      dpr={[1, 1.75]}
      camera={{ position: [0, 0, 9.5], fov: 35 }}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      onCreated={onReady}
    >
      <ambientLight intensity={0.45} />
      <directionalLight position={[3, 5, 4]} intensity={1.8} />
      {/* Studio light panels baked into a small environment map: reflections on the
          clear-coated carbon without downloading an HDR file. */}
      <Environment resolution={256}>
        <Lightformer
          form="rect"
          intensity={3}
          color={colors.light}
          position={[0, 4, 4]}
          scale={[8, 2, 1]}
        />
        <Lightformer
          form="rect"
          intensity={1.5}
          color={colors.light}
          position={[-5, 0, 2]}
          rotation-y={Math.PI / 2}
          scale={[6, 3, 1]}
        />
        <Lightformer
          form="rect"
          intensity={2}
          color={colors.accent}
          position={[5, -1, 1]}
          rotation-y={-Math.PI / 2}
          scale={[4, 2, 1]}
        />
      </Environment>
      <Racket colors={colors} inputs={inputs} />
      <ContactShadows position={[0, -3.1, 0]} opacity={0.45} blur={2.4} scale={8} far={5} />
    </Canvas>
  );
}
