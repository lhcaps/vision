import { motion, useReducedMotion } from 'motion/react';
import { motionTokens } from '@visionflow/motion';
import { demoSnapshot } from '../../data/demo';

interface VisionPreviewProps {
  selectedAnnotation?: string;
  onSelectAnnotation?: (id: string) => void;
  running?: boolean;
}

export function VisionPreview({
  selectedAnnotation = 'ann_02',
  onSelectAnnotation,
  running = false,
}: VisionPreviewProps) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div className="vision-stage relative min-h-[420px] overflow-hidden bg-graphite-950">
      <div className="bg-[radial-gradient(circle_at_28%_22%,rgba(106,217,161,0.12),transparent_32%)]} absolute inset-0" />
      <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(5,13,12,0.88),transparent_30%),linear-gradient(to_bottom,transparent_0%,rgba(5,13,12,0.4)_12%),linear-gradient(to_left,rgba(5,13,12,0.88),transparent_18%),linear-gradient(to_right,rgba(5,13,12,0.88),transparent_18%)]" />
      <div
        className="absolute left-[8%] top-[22%] h-[42%] w-[84%]"
        style={{ boxShadow: 'inset 0 0 80px rgba(0,0,0,0.4)' }}
      >
        <div className="absolute inset-x-0 top-[55%] border-t border-dashed border-graphite-100" />
        <div className="absolute bottom-[18%] left-[7%] h-[12%] w-[86%] rounded-sm bg-white/[0.025]" />
        {demoSnapshot.annotations.map((annotation) => {
          const selected = annotation.id === selectedAnnotation;
          const style = {
            left: `${(annotation.geometry.x / 1920) * 100}%`,
            top: `${(annotation.geometry.y / 1080) * 100}%`,
            width: `${(annotation.geometry.width / 1920) * 100}%`,
            height: `${(annotation.geometry.height / 1080) * 100}%`,
            borderColor: annotation.color,
          };

          return (
            <motion.button
              key={annotation.id}
              type="button"
              title={annotation.label}
              aria-label={annotation.label}
              onClick={() => onSelectAnnotation?.(annotation.id)}
              className={[
                'bbox absolute rounded-sm border-2 text-left outline-none transition focus-visible:ring-2 focus-visible:ring-signal-300',
                selected ? 'bbox-selected' : '',
              ].join(' ')}
              style={style}
              initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: selected ? 1.02 : 1 }}
              transition={motionTokens.springSoft}
            >
              <span
                className="absolute -top-6 left-0 rounded-sm px-2 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-graphite-950"
                style={{ backgroundColor: annotation.color }}
              >
                {annotation.label}
              </span>
            </motion.button>
          );
        })}
        {(running || !shouldReduceMotion) && <div className="scanline" />}
      </div>
      <div className="inner-border-subtle bg-graphite-950/80 absolute bottom-4 left-4 right-4 flex flex-wrap items-center justify-between gap-2 rounded-md px-3 py-2 backdrop-blur">
        <span className="font-mono text-xs text-neutral-400">asset_frame_1482 / 1920 x 1080</span>
        <span className="font-mono text-xs text-signal-300">image-coordinate mode</span>
      </div>
    </div>
  );
}
