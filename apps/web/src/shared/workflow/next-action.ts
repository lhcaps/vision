/**
 * NextAction — what should the user do right now?
 *
 * Every page exposes one primary action. When a primary action is disabled,
 * the disabledReason field explains why so the user knows the recovery path.
 */

// SectionId must be kept in sync with App.tsx
export type ActionSectionId =
  | 'overview'
  | 'media'
  | 'datasets'
  | 'annotate'
  | 'pipeline'
  | 'jobs'
  | 'timeline'
  | 'diff';

export type ActionSeverity = 'primary' | 'warning' | 'danger' | 'neutral';

export type NextAction = {
  /** Short, actionable label */
  label: string;
  /** Why this action matters right now */
  description: string;
  /** Which UI section this action belongs to */
  targetSection: ActionSectionId;
  /** Visual weight — primary is the main CTA */
  severity: ActionSeverity;
  /** Whether the action is currently available */
  disabled?: boolean;
  /** Shown when disabled=true */
  disabledReason?: string;
};
