import {
  ActivityIcon as Activity,
  ArrowsLeftRightIcon as ArrowsLeftRight,
  BoundingBoxIcon as BoundingBox,
  GitBranchIcon as GitBranch,
  GraphIcon as Graph,
  ImageSquareIcon as ImageSquare,
  PlayCircleIcon as PlayCircle,
  TimerIcon as Timer,
} from '@phosphor-icons/react';

import type { SectionId } from './section.types';

export const sections: Array<{
  id: SectionId;
  label: string;
  icon: typeof Activity;
}> = [
  { id: 'overview', label: 'Command', icon: Activity },
  { id: 'media', label: 'Media', icon: ImageSquare },
  { id: 'datasets', label: 'Versions', icon: GitBranch },
  { id: 'annotate', label: 'Annotate', icon: BoundingBox },
  { id: 'pipeline', label: 'Pipeline', icon: Graph },
  { id: 'jobs', label: 'Jobs', icon: Timer },
  { id: 'timeline', label: 'Replay', icon: PlayCircle },
  { id: 'diff', label: 'Diff', icon: ArrowsLeftRight },
];
