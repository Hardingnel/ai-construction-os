'use client';
import { type RemoteCursor } from '@/hooks/useCollaboration';
import { useEffect, useRef } from 'react';

interface CursorOverlayProps {
  cursors: RemoteCursor[];
  containerRef: React.RefObject<HTMLDivElement | null>;
}

const COLORS = ['#ff6b6b', '#feca57', '#48dbfb', '#ff9ff3', '#54a0ff', '#5f27cd', '#01a3a4', '#f368e0', '#ff9f43', '#00d2d3'];

function hashColor(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) { hash = id.charCodeAt(i) + ((hash << 5) - hash); }
  return COLORS[Math.abs(hash) % COLORS.length];
}

export function CursorOverlay({ cursors, containerRef }: CursorOverlayProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const svg = svgRef.current;
    const container = containerRef.current;
    if (!svg || !container) return;
    const ro = new ResizeObserver(() => {
      svg.setAttribute('width', String(container.scrollWidth));
      svg.setAttribute('height', String(container.scrollHeight));
    });
    ro.observe(container);
    return () => ro.disconnect();
  }, [containerRef]);

  return (
    <svg ref={svgRef} className="absolute inset-0 pointer-events-none z-50" style={{ width: '100%', height: '100%' }}>
      {cursors.map(cursor => {
        const color = hashColor(cursor.userId);
        return (
          <g key={cursor.userId} transform={`translate(${cursor.x},${cursor.y})`}>
            <path d="M0 0 L0 16 L4 12 L8 18 L12 15 L8 10 L16 10 Z" fill={color} opacity={0.9} />
            <rect x={18} y={-4} rx={4} ry={4} width={6 * cursor.userName.length + 12} height={20} fill={color} opacity={0.9} />
            <text x={24} y={10} fill="white" fontSize={11} fontWeight="bold" fontFamily="sans-serif">
              {cursor.userName}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
