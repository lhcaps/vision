import { BoundingBoxIcon as BoundingBox } from '@phosphor-icons/react';
import { motion } from 'motion/react';
import { motionTokens } from '@visionflow/motion';
import { sections } from './nav-sections';
import type { SectionId } from './section.types';

interface NavRailProps {
  active: SectionId;
  onSelect: (section: SectionId) => void;
}

export function NavRail({ active, onSelect }: NavRailProps) {
  return (
    <aside className="nav-rail divider-right px-2.5 py-3">
      <div className="nav-logo mb-5 flex h-10 w-10 items-center justify-center rounded-md text-signal-300">
        <BoundingBox size={21} weight="duotone" />
      </div>
      <nav className="flex flex-col gap-1.5" aria-label="VisionFlow workbench">
        {sections.map((item, index) => {
          const Icon = item.icon;
          const selected = item.id === active;

          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{
                delay: index * 0.03,
                duration: motionTokens.durationFast,
                ease: motionTokens.easeScan,
              }}
            >
              <button
                type="button"
                title={item.label}
                aria-label={item.label}
                aria-pressed={selected}
                onClick={() => onSelect(item.id)}
                className="nav-button group relative flex h-10 w-10 items-center justify-center rounded-md text-sm transition active:translate-y-px"
              >
                {selected && (
                  <>
                    <motion.span
                      layoutId="nav-active"
                      className="nav-active-surface absolute inset-0 rounded-md"
                      transition={motionTokens.springFast}
                    />
                    <span className="nav-active-rail" />
                  </>
                )}
                <Icon
                  className="relative z-10"
                  size={21}
                  weight={selected ? 'duotone' : 'regular'}
                />
              </button>
            </motion.div>
          );
        })}
      </nav>
    </aside>
  );
}
