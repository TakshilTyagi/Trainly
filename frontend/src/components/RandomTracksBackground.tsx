import React, { useEffect, useRef } from 'react';

interface BezierPoint {
  x: number;
  y: number;
  angle: number;
  dist: number;
}

interface TrainCar {
  type: 'lead_dtc' | 'coach' | 'pantograph_coach' | 'rear_dtc';
  length: number;
  width: number;
}

type TrainDirection = 'left_to_right' | 'right_to_left' | 'bottom_to_top' | 'top_to_bottom';

interface TrainInstance {
  id: number;
  direction: TrainDirection;
  baseSpeed: number;
  currentSpeed: number;
  cars: TrainCar[];
  totalTrainLength: number;
  leadTrackLength: number;
  tailTrackLength: number;
  pathPoints: BezierPoint[];
  totalPathLength: number;
  progress: number;
  variant: 'classic_white_blue' | 'saffron_grey';
  active: boolean;
  delayStart: number;
}

export const RandomTracksBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let lastTimestamp = performance.now();

    // Resize handler with HiDPI support
    const handleResize = () => {
      if (!canvas) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      ctx.resetTransform?.();
      ctx.scale(dpr, dpr);
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    // Generate dedicated screen-covering paths for each direction
    const generateDirectionalPath = (
      direction: TrainDirection,
      width: number,
      height: number
    ): BezierPoint[] => {
      const margin = 160;
      let p0 = { x: 0, y: 0 };
      let p1 = { x: 0, y: 0 };
      let p2 = { x: 0, y: 0 };
      let p3 = { x: 0, y: 0 };

      if (direction === 'left_to_right') {
        // Starts leftmost, sweeps across the upper screen
        const startY = height * (0.16 + Math.random() * 0.12);
        const endY = height * (0.16 + Math.random() * 0.12);
        p0 = { x: -margin, y: startY };
        p1 = { x: width * 0.33, y: height * (0.12 + Math.random() * 0.14) };
        p2 = { x: width * 0.67, y: height * (0.14 + Math.random() * 0.16) };
        p3 = { x: width + margin, y: endY };
      } else if (direction === 'right_to_left') {
        // Starts rightmost, sweeps across the lower screen
        const startY = height * (0.74 + Math.random() * 0.12);
        const endY = height * (0.74 + Math.random() * 0.12);
        p0 = { x: width + margin, y: startY };
        p1 = { x: width * 0.67, y: height * (0.72 + Math.random() * 0.14) };
        p2 = { x: width * 0.33, y: height * (0.76 + Math.random() * 0.14) };
        p3 = { x: -margin, y: endY };
      } else if (direction === 'bottom_to_top') {
        // Starts bottom, sweeps up the right side of the screen
        const startX = width * (0.84 + Math.random() * 0.08);
        const endX = width * (0.84 + Math.random() * 0.08);
        p0 = { x: startX, y: height + margin };
        p1 = { x: width * (0.88 + Math.random() * 0.08), y: height * 0.67 };
        p2 = { x: width * (0.82 + Math.random() * 0.08), y: height * 0.33 };
        p3 = { x: endX, y: -margin };
      } else {
        // 'top_to_bottom': Starts top, sweeps down the left side of the screen
        const startX = width * (0.08 + Math.random() * 0.08);
        const endX = width * (0.08 + Math.random() * 0.08);
        p0 = { x: startX, y: -margin };
        p1 = { x: width * (0.06 + Math.random() * 0.08), y: height * 0.33 };
        p2 = { x: width * (0.12 + Math.random() * 0.08), y: height * 0.67 };
        p3 = { x: endX, y: height + margin };
      }

      // Sample points along cubic Bezier
      const samples = 400;
      const rawPoints: { x: number; y: number }[] = [];

      for (let i = 0; i <= samples; i++) {
        const t = i / samples;
        const mt = 1 - t;
        const x =
          mt * mt * mt * p0.x +
          3 * mt * mt * t * p1.x +
          3 * mt * t * t * p2.x +
          t * t * t * p3.x;
        const y =
          mt * mt * mt * p0.y +
          3 * mt * mt * t * p1.y +
          3 * mt * t * t * p2.y +
          t * t * t * p3.y;
        rawPoints.push({ x, y });
      }

      // Convert to arc-length parameterized points
      const pathPoints: BezierPoint[] = [];
      let accumulatedDist = 0;

      for (let i = 0; i < rawPoints.length; i++) {
        let angle = 0;
        if (i < rawPoints.length - 1) {
          const dx = rawPoints[i + 1].x - rawPoints[i].x;
          const dy = rawPoints[i + 1].y - rawPoints[i].y;
          angle = Math.atan2(dy, dx);
          if (i > 0) {
            accumulatedDist += Math.hypot(
              rawPoints[i].x - rawPoints[i - 1].x,
              rawPoints[i].y - rawPoints[i - 1].y
            );
          }
        } else {
          angle = pathPoints[pathPoints.length - 1]?.angle ?? 0;
          accumulatedDist += Math.hypot(
            rawPoints[i].x - rawPoints[i - 1].x,
            rawPoints[i].y - rawPoints[i - 1].y
          );
        }

        pathPoints.push({
          x: rawPoints[i].x,
          y: rawPoints[i].y,
          angle,
          dist: accumulatedDist,
        });
      }

      return pathPoints;
    };

    // Helper: interpolate point & orientation on path by distance
    const getPointAtDist = (points: BezierPoint[], targetDist: number): BezierPoint => {
      if (points.length === 0) return { x: 0, y: 0, angle: 0, dist: 0 };
      if (targetDist <= 0) return points[0];
      const maxDist = points[points.length - 1].dist;
      if (targetDist >= maxDist) return points[points.length - 1];

      let low = 0;
      let high = points.length - 1;
      while (low <= high) {
        const mid = (low + high) >> 1;
        if (points[mid].dist < targetDist) {
          low = mid + 1;
        } else {
          high = mid - 1;
        }
      }

      const idx = Math.max(0, low - 1);
      const pA = points[idx];
      const pB = points[Math.min(idx + 1, points.length - 1)];
      const span = pB.dist - pA.dist;
      const ratio = span > 0 ? (targetDist - pA.dist) / span : 0;

      return {
        x: pA.x + (pB.x - pA.x) * ratio,
        y: pA.y + (pB.y - pA.y) * ratio,
        angle: pA.angle + (pB.angle - pA.angle) * ratio,
        dist: targetDist,
      };
    };

    // Create realistic Vande Bharat Train Instance
    const createVandeBharatTrain = (
      id: number,
      direction: TrainDirection,
      delay = 0
    ): TrainInstance => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const pathPoints = generateDirectionalPath(direction, w, h);
      const totalPathLength = pathPoints[pathPoints.length - 1].dist;

      const cars: TrainCar[] = [
        { type: 'lead_dtc', length: 64, width: 22 },
        { type: 'coach', length: 56, width: 21 },
        { type: 'pantograph_coach', length: 56, width: 21 },
        { type: 'coach', length: 56, width: 21 },
        { type: 'rear_dtc', length: 64, width: 22 },
      ];

      const gangwayBellowGap = 4;
      let totalTrainLength = 0;
      cars.forEach((car, i) => {
        totalTrainLength += car.length;
        if (i < cars.length - 1) totalTrainLength += gangwayBellowGap;
      });

      const baseSpeed = 165 + Math.random() * 35; // Semi-high-speed glide

      return {
        id,
        direction,
        baseSpeed,
        currentSpeed: baseSpeed,
        cars,
        totalTrainLength,
        leadTrackLength: 110,
        tailTrackLength: 150,
        pathPoints,
        totalPathLength,
        progress: 0,
        variant: id % 2 === 0 ? 'classic_white_blue' : 'saffron_grey',
        active: delay <= 0,
        delayStart: Math.max(0, delay),
      };
    };

    // Exactly 4 Trains starting from:
    // Train 0: Leftmost -> Right
    // Train 1: Rightmost -> Left
    // Train 2: Bottom -> Top
    // Train 3: Top -> Bottom

    const trains: TrainInstance[] = [
      createVandeBharatTrain(0, 'left_to_right', 0),
      createVandeBharatTrain(1, 'right_to_left', 1.8),
      createVandeBharatTrain(2, 'bottom_to_top', 3.6),
      createVandeBharatTrain(3, 'top_to_bottom', 5.4),
    ];

    // Main 60fps Animation Loop
    const render = (currentTimestamp: number) => {
      const dt = Math.min((currentTimestamp - lastTimestamp) / 1000, 0.1);
      lastTimestamp = currentTimestamp;

      const w = window.innerWidth;
      const h = window.innerHeight;
      const isDark = document.documentElement.classList.contains('dark');

      ctx.clearRect(0, 0, w, h);

      // ==============================================================
      // AUTOMATIC TRAIN PROTECTION (KAVACH / COLLISION PREVENTION)
      // ==============================================================
      // Calculate current head positions of all active trains
      const headPositions = trains.map((t) => {
        if (!t.active) return null;
        const pt = getPointAtDist(t.pathPoints, t.progress);
        return { id: t.id, x: pt.x, y: pt.y, progress: t.progress, total: t.totalPathLength };
      });

      // Check proximity between each pair of active trains
      for (let i = 0; i < trains.length; i++) {
        const trainA = trains[i];
        if (!trainA.active) continue;

        let shouldSlowDown = false;
        const posA = headPositions[i];

        if (posA) {
          for (let j = 0; j < trains.length; j++) {
            if (i === j) continue;
            const trainB = trains[j];
            const posB = headPositions[j];
            if (!trainB.active || !posB) continue;

            const distBetweenHeads = Math.hypot(posA.x - posB.x, posA.y - posB.y);

            // Safety collision zone: 210px
            if (distBetweenHeads < 210) {
              // Deterministic priority: lower ID proceeds, higher ID yields (Kavach brake)
              if (trainA.id > trainB.id) {
                shouldSlowDown = true;
              }
            }
          }
        }

        // Smooth deceleration / acceleration
        if (shouldSlowDown) {
          trainA.currentSpeed = Math.max(25, trainA.currentSpeed - 180 * dt);
        } else {
          trainA.currentSpeed = Math.min(trainA.baseSpeed, trainA.currentSpeed + 140 * dt);
        }
      }

      trains.forEach((train) => {
        if (!train.active) {
          train.delayStart -= dt;
          if (train.delayStart <= 0) {
            train.active = true;
          }
          return;
        }

        train.progress += train.currentSpeed * dt;

        const maxJourney =
          train.totalPathLength + train.totalTrainLength + train.tailTrackLength + 60;

        // Reset with new path in same designated direction once train and track finish
        if (train.progress >= maxJourney) {
          const nextTrain = createVandeBharatTrain(
            train.id,
            train.direction,
            0.6 + Math.random() * 1.2
          );
          Object.assign(train, nextTrain);
          return;
        }

        const headDist = train.progress;
        const tailDist = headDist - train.totalTrainLength;

        const trackStartDist = Math.max(0, tailDist - train.tailTrackLength);
        const trackEndDist = Math.min(train.totalPathLength, headDist + train.leadTrackLength);

        // Alpha calculation for dynamic track visibility
        const getTrackAlpha = (dist: number): number => {
          if (dist > headDist) {
            const forwardDelta = dist - headDist;
            return Math.max(0, 1 - forwardDelta / train.leadTrackLength);
          } else if (dist < tailDist) {
            const backwardDelta = tailDist - dist;
            return Math.max(0, 1 - backwardDelta / train.tailTrackLength);
          }
          return 1.0;
        };

        // ==========================================
        // 1. DRAW REALISTIC TRACKS (NO AESTHETIC TINT)
        // ==========================================
        if (trackEndDist > trackStartDist) {
          const trackGauge = 13;
          const sleeperLength = 26;
          const sleeperSpacing = 7;

          // --- Ballast Bed (Natural granite/crushed stone grey) ---
          ctx.save();
          ctx.lineWidth = 28;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          ctx.strokeStyle = isDark
            ? 'rgba(30, 41, 59, 0.45)'
            : 'rgba(203, 213, 225, 0.55)';

          ctx.beginPath();
          let started = false;
          for (let d = trackStartDist; d <= trackEndDist; d += 14) {
            const pt = getPointAtDist(train.pathPoints, d);
            if (!started) {
              ctx.moveTo(pt.x, pt.y);
              started = true;
            } else {
              ctx.lineTo(pt.x, pt.y);
            }
          }
          ctx.stroke();
          ctx.restore();

          // --- Pre-Stressed Concrete Sleepers with Pandrol Clips ---
          const sleeperColor = isDark ? '#475569' : '#94a3b8';
          const clipColor = '#64748b';

          for (let d = trackStartDist; d <= trackEndDist; d += sleeperSpacing) {
            const pt = getPointAtDist(train.pathPoints, d);
            const alpha = getTrackAlpha(d);
            if (alpha <= 0.02) continue;

            const perpAngle = pt.angle + Math.PI / 2;
            const halfTie = sleeperLength / 2;
            const x1 = pt.x + Math.cos(perpAngle) * halfTie;
            const y1 = pt.y + Math.sin(perpAngle) * halfTie;
            const x2 = pt.x - Math.cos(perpAngle) * halfTie;
            const y2 = pt.y - Math.sin(perpAngle) * halfTie;

            ctx.save();
            ctx.globalAlpha = alpha * (isDark ? 0.75 : 0.85);

            ctx.strokeStyle = sleeperColor;
            ctx.lineWidth = 3.2;
            ctx.lineCap = 'butt';
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();

            // Pandrol clips
            const halfG = trackGauge / 2;
            const c1x = pt.x + Math.cos(perpAngle) * halfG;
            const c1y = pt.y + Math.sin(perpAngle) * halfG;
            const c2x = pt.x - Math.cos(perpAngle) * halfG;
            const c2y = pt.y - Math.sin(perpAngle) * halfG;

            ctx.fillStyle = clipColor;
            ctx.fillRect(c1x - 1, c1y - 1, 2, 2);
            ctx.fillRect(c2x - 1, c2y - 1, 2, 2);

            ctx.restore();
          }

          // --- Dual Continuous Metallic Steel Rails ---
          const railStep = 6;
          const leftRailPoints: { x: number; y: number; alpha: number }[] = [];
          const rightRailPoints: { x: number; y: number; alpha: number }[] = [];

          const halfGauge = trackGauge / 2;
          for (let d = trackStartDist; d <= trackEndDist; d += railStep) {
            const pt = getPointAtDist(train.pathPoints, d);
            const alpha = getTrackAlpha(d);
            const perpAngle = pt.angle + Math.PI / 2;

            leftRailPoints.push({
              x: pt.x + Math.cos(perpAngle) * halfGauge,
              y: pt.y + Math.sin(perpAngle) * halfGauge,
              alpha,
            });

            rightRailPoints.push({
              x: pt.x - Math.cos(perpAngle) * halfGauge,
              y: pt.y - Math.sin(perpAngle) * halfGauge,
              alpha,
            });
          }

          const drawRealisticRails = (
            points: { x: number; y: number; alpha: number }[]
          ) => {
            for (let i = 0; i < points.length - 1; i++) {
              const pA = points[i];
              const pB = points[i + 1];
              const avgAlpha = (pA.alpha + pB.alpha) / 2;
              if (avgAlpha <= 0.02) continue;

              ctx.save();
              ctx.globalAlpha = avgAlpha * (isDark ? 0.9 : 0.95);
              ctx.strokeStyle = isDark ? '#64748b' : '#475569';
              ctx.lineWidth = 2.4;
              ctx.lineCap = 'round';
              ctx.beginPath();
              ctx.moveTo(pA.x, pA.y);
              ctx.lineTo(pB.x, pB.y);
              ctx.stroke();

              // Specular silver crown line
              ctx.strokeStyle = isDark ? '#cbd5e1' : '#f8fafc';
              ctx.lineWidth = 1;
              ctx.beginPath();
              ctx.moveTo(pA.x, pA.y);
              ctx.lineTo(pB.x, pB.y);
              ctx.stroke();

              ctx.restore();
            }
          };

          drawRealisticRails(leftRailPoints);
          drawRealisticRails(rightRailPoints);
        }

        // ==========================================
        // 2. DRAW REALISTIC VANDE BHARAT EXPRESS
        // ==========================================
        let currentHeadDist = headDist;
        const gangwayGap = 4;

        const isSaffron = train.variant === 'saffron_grey';
        const bodyWhite = isSaffron ? '#f97316' : '#ffffff';
        const roofGrey = isSaffron ? '#ea580c' : (isDark ? '#e2e8f0' : '#f1f5f9');
        const navyRibbon = isSaffron ? '#0f172a' : '#172554';
        const accentSaffron = isSaffron ? '#ffffff' : '#ea580c';
        const cockpitGlass = '#020617';
        const borderTone = isSaffron ? '#9a3412' : '#0f172a';

        train.cars.forEach((car, carIndex) => {
          const carCenterDist = currentHeadDist - car.length / 2;
          currentHeadDist -= car.length + gangwayGap;

          if (carCenterDist < 0 || carCenterDist > train.totalPathLength) return;

          const carPoint = getPointAtDist(train.pathPoints, carCenterDist);

          ctx.save();
          ctx.translate(carPoint.x, carPoint.y);
          ctx.rotate(carPoint.angle);

          const halfL = car.length / 2;
          const halfW = car.width / 2;

          // Bogies
          const drawBogies = (frontOffset: number, rearOffset: number) => {
            ctx.save();
            ctx.fillStyle = '#0f172a';
            ctx.fillRect(frontOffset - 6, -halfW - 1, 12, halfW * 2 + 2);
            ctx.fillRect(rearOffset - 6, -halfW - 1, 12, halfW * 2 + 2);
            ctx.restore();
          };

          // DTC - LEAD BULLET NOSE
          if (car.type === 'lead_dtc') {
            drawBogies(10, -halfL + 12);

            // Headlight searchlight beam cone
            ctx.save();
            const beamGrad = ctx.createLinearGradient(halfL + 2, 0, halfL + 190, 0);
            beamGrad.addColorStop(0, 'rgba(254, 240, 138, 0.85)');
            beamGrad.addColorStop(0.25, 'rgba(254, 240, 138, 0.4)');
            beamGrad.addColorStop(1, 'rgba(254, 240, 138, 0)');

            ctx.fillStyle = beamGrad;
            ctx.beginPath();
            ctx.moveTo(halfL + 5, -2);
            ctx.lineTo(halfL + 190, -50);
            ctx.lineTo(halfL + 190, 50);
            ctx.lineTo(halfL + 5, 2);
            ctx.closePath();
            ctx.fill();
            ctx.restore();

            // Aerodynamic bullet nose
            ctx.beginPath();
            ctx.moveTo(-halfL, -halfW);
            ctx.lineTo(halfL - 22, -halfW);
            ctx.quadraticCurveTo(halfL - 6, -halfW + 3, halfL + 4, 0);
            ctx.quadraticCurveTo(halfL - 6, halfW - 3, halfL - 22, halfW);
            ctx.lineTo(-halfL, halfW);
            ctx.closePath();

            ctx.fillStyle = bodyWhite;
            ctx.fill();
            ctx.strokeStyle = borderTone;
            ctx.lineWidth = 1.4;
            ctx.stroke();

            // Roof panel
            ctx.fillStyle = roofGrey;
            ctx.fillRect(-halfL + 2, -halfW + 4, car.length - 28, car.width - 8);

            // Panoramic dark ribbon
            ctx.fillStyle = navyRibbon;
            ctx.beginPath();
            ctx.moveTo(-halfL, -halfW + 1.5);
            ctx.lineTo(halfL - 26, -halfW + 1.5);
            ctx.lineTo(halfL - 26, -halfW + 6.5);
            ctx.lineTo(-halfL, -halfW + 6.5);
            ctx.closePath();
            ctx.fill();

            ctx.beginPath();
            ctx.moveTo(-halfL, halfW - 6.5);
            ctx.lineTo(halfL - 26, halfW - 6.5);
            ctx.lineTo(halfL - 26, halfW - 1.5);
            ctx.lineTo(-halfL, halfW - 1.5);
            ctx.closePath();
            ctx.fill();

            // Passenger lights
            ctx.fillStyle = '#fde047';
            for (let i = 0; i < 4; i++) {
              const wx = -halfL + 6 + i * 8;
              ctx.fillRect(wx, -halfW + 2.5, 5, 2.5);
              ctx.fillRect(wx, halfW - 5, 5, 2.5);
            }

            // Saffron speed line
            ctx.strokeStyle = accentSaffron;
            ctx.lineWidth = 1.4;
            ctx.beginPath();
            ctx.moveTo(-halfL, -halfW + 7);
            ctx.lineTo(halfL - 18, -halfW + 7);
            ctx.moveTo(-halfL, halfW - 7);
            ctx.lineTo(halfL - 18, halfW - 7);
            ctx.stroke();

            // Cockpit windshield
            ctx.beginPath();
            ctx.moveTo(halfL - 22, -halfW + 4);
            ctx.quadraticCurveTo(halfL - 6, -halfW + 5.5, halfL - 2, 0);
            ctx.quadraticCurveTo(halfL - 6, halfW - 5.5, halfL - 22, halfW - 4);
            ctx.closePath();
            ctx.fillStyle = cockpitGlass;
            ctx.fill();

            // Windshield highlight
            ctx.beginPath();
            ctx.moveTo(halfL - 20, -halfW + 5.5);
            ctx.quadraticCurveTo(halfL - 7, -halfW + 6.5, halfL - 4, 0);
            ctx.strokeStyle = 'rgba(56, 189, 248, 0.7)';
            ctx.lineWidth = 1.2;
            ctx.stroke();

            // Nose chevron emblem
            ctx.fillStyle = accentSaffron;
            ctx.beginPath();
            ctx.moveTo(halfL + 1, 0);
            ctx.lineTo(halfL - 4, -2.5);
            ctx.lineTo(halfL - 2.5, 0);
            ctx.lineTo(halfL - 4, 2.5);
            ctx.closePath();
            ctx.fill();

            // Twin LED headlights
            ctx.fillStyle = '#fef08a';
            ctx.beginPath();
            ctx.arc(halfL + 2, -3.2, 1.8, 0, Math.PI * 2);
            ctx.arc(halfL + 2, 3.2, 1.8, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = 'rgba(254, 240, 138, 0.4)';
            ctx.beginPath();
            ctx.arc(halfL + 2, 0, 8, 0, Math.PI * 2);
            ctx.fill();
          }

          // PASSENGER COACHES
          else if (car.type === 'coach' || car.type === 'pantograph_coach') {
            drawBogies(halfL - 10, -halfL + 10);

            ctx.beginPath();
            ctx.roundRect(-halfL, -halfW, car.length, car.width, 2.5);
            ctx.fillStyle = bodyWhite;
            ctx.fill();
            ctx.strokeStyle = borderTone;
            ctx.lineWidth = 1.4;
            ctx.stroke();

            // Roof panel
            ctx.fillStyle = roofGrey;
            ctx.fillRect(-halfL + 2, -halfW + 4, car.length - 4, car.width - 8);

            // Roof AC units
            ctx.fillStyle = isDark ? '#475569' : '#cbd5e1';
            ctx.fillRect(-halfL + 8, -4, 14, 8);
            ctx.fillRect(halfL - 22, -4, 14, 8);

            ctx.fillStyle = '#0f172a';
            ctx.fillRect(-halfL + 10, -2.5, 10, 5);
            ctx.fillRect(halfL - 20, -2.5, 10, 5);

            // Panoramic dark ribbon
            ctx.fillStyle = navyRibbon;
            ctx.fillRect(-halfL + 1, -halfW + 1.5, car.length - 2, 5);
            ctx.fillRect(-halfL + 1, halfW - 6.5, car.length - 2, 5);

            // Passenger lights
            ctx.fillStyle = '#fde047';
            const numSeats = 6;
            const seatSpacing = (car.length - 12) / numSeats;
            for (let s = 0; s < numSeats; s++) {
              const sx = -halfL + 5 + s * seatSpacing;
              ctx.fillRect(sx, -halfW + 2.5, 4.5, 2.5);
              ctx.fillRect(sx, halfW - 5, 4.5, 2.5);
            }

            // Saffron speed line
            ctx.strokeStyle = accentSaffron;
            ctx.lineWidth = 1.4;
            ctx.beginPath();
            ctx.moveTo(-halfL, -halfW + 7);
            ctx.lineTo(halfL, -halfW + 7);
            ctx.moveTo(-halfL, halfW - 7);
            ctx.lineTo(halfL, halfW - 7);
            ctx.stroke();

            // Plug doors
            ctx.fillStyle = '#0284c7';
            ctx.fillRect(-halfL + 2, -halfW + 1, 2.5, 5.5);
            ctx.fillRect(-halfL + 2, halfW - 6.5, 2.5, 5.5);
            ctx.fillRect(halfL - 4.5, -halfW + 1, 2.5, 5.5);
            ctx.fillRect(halfL - 4.5, halfW - 6.5, 2.5, 5.5);

            // Roof pantograph
            if (car.type === 'pantograph_coach') {
              ctx.save();
              ctx.fillStyle = '#ef4444';
              ctx.beginPath();
              ctx.arc(-2, -5, 1.2, 0, Math.PI * 2);
              ctx.arc(2, -5, 1.2, 0, Math.PI * 2);
              ctx.arc(-2, 5, 1.2, 0, Math.PI * 2);
              ctx.arc(2, 5, 1.2, 0, Math.PI * 2);
              ctx.fill();

              ctx.strokeStyle = '#334155';
              ctx.lineWidth = 1.8;
              ctx.beginPath();
              ctx.moveTo(-6, 0);
              ctx.lineTo(0, -3.5);
              ctx.lineTo(6, 0);
              ctx.stroke();

              ctx.strokeStyle = '#0f172a';
              ctx.lineWidth = 2.4;
              ctx.beginPath();
              ctx.moveTo(3, -5.5);
              ctx.lineTo(3, 5.5);
              ctx.stroke();
              ctx.restore();
            }
          }

          // REAR DTC
          else if (car.type === 'rear_dtc') {
            drawBogies(-10, halfL - 12);

            ctx.beginPath();
            ctx.moveTo(halfL, -halfW);
            ctx.lineTo(-halfL + 22, -halfW);
            ctx.quadraticCurveTo(-halfL + 6, -halfW + 3, -halfL - 4, 0);
            ctx.quadraticCurveTo(-halfL + 6, halfW - 3, -halfL + 22, halfW);
            ctx.lineTo(halfL, halfW);
            ctx.closePath();

            ctx.fillStyle = bodyWhite;
            ctx.fill();
            ctx.strokeStyle = borderTone;
            ctx.lineWidth = 1.4;
            ctx.stroke();

            ctx.fillStyle = roofGrey;
            ctx.fillRect(-halfL + 24, -halfW + 4, car.length - 28, car.width - 8);

            ctx.fillStyle = navyRibbon;
            ctx.beginPath();
            ctx.moveTo(-halfL + 26, -halfW + 1.5);
            ctx.lineTo(halfL, -halfW + 1.5);
            ctx.lineTo(halfL, -halfW + 6.5);
            ctx.lineTo(-halfL + 26, -halfW + 6.5);
            ctx.closePath();
            ctx.fill();

            ctx.beginPath();
            ctx.moveTo(-halfL + 26, halfW - 6.5);
            ctx.lineTo(halfL, halfW - 6.5);
            ctx.lineTo(halfL, -halfW + 1.5);
            ctx.lineTo(-halfL + 26, -halfW + 1.5);
            ctx.closePath();
            ctx.fill();

            ctx.fillStyle = '#fde047';
            for (let i = 0; i < 4; i++) {
              const wx = -halfL + 28 + i * 8;
              ctx.fillRect(wx, -halfW + 2.5, 5, 2.5);
              ctx.fillRect(wx, halfW - 5, 5, 2.5);
            }

            ctx.strokeStyle = accentSaffron;
            ctx.lineWidth = 1.4;
            ctx.beginPath();
            ctx.moveTo(-halfL + 18, -halfW + 7);
            ctx.lineTo(halfL, -halfW + 7);
            ctx.moveTo(-halfL + 18, halfW - 7);
            ctx.lineTo(halfL, halfW - 7);
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(-halfL + 22, -halfW + 4);
            ctx.quadraticCurveTo(-halfL + 6, -halfW + 5.5, -halfL + 2, 0);
            ctx.quadraticCurveTo(-halfL + 6, halfW - 5.5, -halfL + 22, halfW - 4);
            ctx.closePath();
            ctx.fillStyle = cockpitGlass;
            ctx.fill();

            // Pulsating red tail lamps
            const pulse = Math.sin(currentTimestamp * 0.007) > 0;
            ctx.save();
            ctx.fillStyle = pulse ? '#ef4444' : '#7f1d1d';
            ctx.beginPath();
            ctx.arc(-halfL - 1.5, -3.5, 2, 0, Math.PI * 2);
            ctx.arc(-halfL - 1.5, 3.5, 2, 0, Math.PI * 2);
            ctx.fill();

            if (pulse) {
              ctx.fillStyle = 'rgba(239, 68, 68, 0.45)';
              ctx.beginPath();
              ctx.arc(-halfL - 1.5, -3.5, 5, 0, Math.PI * 2);
              ctx.arc(-halfL - 1.5, 3.5, 5, 0, Math.PI * 2);
              ctx.fill();
            }
            ctx.restore();
          }

          // Gangway bellows
          if (carIndex < train.cars.length - 1) {
            ctx.save();
            ctx.fillStyle = '#0f172a';
            ctx.fillRect(-halfL - gangwayGap, -halfW + 2, gangwayGap, car.width - 4);
            ctx.strokeStyle = '#334155';
            ctx.lineWidth = 1;
            ctx.strokeRect(-halfL - gangwayGap, -halfW + 2, gangwayGap, car.width - 4);
            ctx.restore();
          }

          ctx.restore();
        });
      });

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none z-0 overflow-hidden"
    />
  );
};
