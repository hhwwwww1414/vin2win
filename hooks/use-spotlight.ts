'use client';

import { useEffect, useRef } from 'react';

type SpotlightConfig = {
  radius: number;
  brightness: number;
  color: string;
  smoothing: number;
};

type PointerTarget = {
  x: number;
  y: number;
  strength: number;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function hexToRgb(color: string) {
  const normalized = color.trim().replace('#', '');
  const hex = normalized.length === 3
    ? normalized
        .split('')
        .map((char) => `${char}${char}`)
        .join('')
    : normalized;

  if (!/^[\da-fA-F]{6}$/.test(hex)) {
    return { red: 255, green: 255, blue: 255 };
  }

  return {
    red: Number.parseInt(hex.slice(0, 2), 16),
    green: Number.parseInt(hex.slice(2, 4), 16),
    blue: Number.parseInt(hex.slice(4, 6), 16),
  };
}

function rgba(color: { red: number; green: number; blue: number }, alpha: number) {
  return `rgba(${color.red}, ${color.green}, ${color.blue}, ${alpha})`;
}

export default function useSpotlightEffect(config: SpotlightConfig) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const configRef = useRef(config);

  useEffect(() => {
    configRef.current = config;
  }, [config]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const container = canvas.parentElement;
    if (!container) {
      return;
    }

    const finePointerQuery = window.matchMedia('(hover: hover) and (pointer: fine)');
    const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

    if (!finePointerQuery.matches || reducedMotionQuery.matches) {
      const context = canvas.getContext('2d');
      context?.clearRect(0, 0, canvas.width, canvas.height);
      return;
    }

    const context = canvas.getContext('2d');
    if (!context) {
      return;
    }

    let animationFrame = 0;
    let devicePixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    let width = 0;
    let height = 0;

    const pointer = {
      x: 0,
      y: 0,
      strength: 0,
    };

    const target: PointerTarget = {
      x: 0,
      y: 0,
      strength: 0,
    };

    const resizeCanvas = () => {
      const rect = container.getBoundingClientRect();

      width = rect.width;
      height = rect.height;
      devicePixelRatio = Math.min(window.devicePixelRatio || 1, 2);

      canvas.width = Math.round(rect.width * devicePixelRatio);
      canvas.height = Math.round(rect.height * devicePixelRatio);
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;

      context.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
    };

    const syncPointer = (event: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      target.x = clamp(event.clientX - rect.left, 0, rect.width);
      target.y = clamp(event.clientY - rect.top, 0, rect.height);
      target.strength = 1;

      if (pointer.strength < 0.02) {
        pointer.x = target.x;
        pointer.y = target.y;
      }
    };

    const render = () => {
      const { radius, brightness, color, smoothing } = configRef.current;
      const colorChannels = hexToRgb(color);

      pointer.x += (target.x - pointer.x) * smoothing;
      pointer.y += (target.y - pointer.y) * smoothing;
      pointer.strength += (target.strength - pointer.strength) * smoothing;

      context.clearRect(0, 0, width, height);

      if (pointer.strength > 0.002) {
        const intensity = brightness * pointer.strength;
        const mainGradient = context.createRadialGradient(pointer.x, pointer.y, 0, pointer.x, pointer.y, radius);

        mainGradient.addColorStop(0, rgba(colorChannels, intensity * 1.35));
        mainGradient.addColorStop(0.22, rgba(colorChannels, intensity));
        mainGradient.addColorStop(0.52, rgba(colorChannels, intensity * 0.38));
        mainGradient.addColorStop(1, rgba(colorChannels, 0));

        context.fillStyle = mainGradient;
        context.fillRect(0, 0, width, height);

        const washGradient = context.createRadialGradient(
          pointer.x - radius * 0.14,
          pointer.y - radius * 0.1,
          0,
          pointer.x - radius * 0.14,
          pointer.y - radius * 0.1,
          radius * 1.65
        );

        washGradient.addColorStop(0, rgba(colorChannels, intensity * 0.3));
        washGradient.addColorStop(0.4, rgba(colorChannels, intensity * 0.12));
        washGradient.addColorStop(1, rgba(colorChannels, 0));

        context.fillStyle = washGradient;
        context.fillRect(0, 0, width, height);
      }

      animationFrame = window.requestAnimationFrame(render);
    };

    const handlePointerMove = (event: PointerEvent) => {
      syncPointer(event);
    };

    const handlePointerEnter = (event: PointerEvent) => {
      syncPointer(event);
    };

    const handlePointerLeave = () => {
      target.strength = 0;
    };

    resizeCanvas();

    const resizeObserver = new ResizeObserver(() => {
      resizeCanvas();
    });

    resizeObserver.observe(container);
    container.addEventListener('pointermove', handlePointerMove);
    container.addEventListener('pointerenter', handlePointerEnter);
    container.addEventListener('pointerleave', handlePointerLeave);
    window.addEventListener('resize', resizeCanvas);

    animationFrame = window.requestAnimationFrame(render);

    return () => {
      window.cancelAnimationFrame(animationFrame);
      resizeObserver.disconnect();
      container.removeEventListener('pointermove', handlePointerMove);
      container.removeEventListener('pointerenter', handlePointerEnter);
      container.removeEventListener('pointerleave', handlePointerLeave);
      window.removeEventListener('resize', resizeCanvas);
      context.clearRect(0, 0, width, height);
    };
  }, []);

  return canvasRef;
}
