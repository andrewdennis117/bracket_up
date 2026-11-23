import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

interface Step {
  label: string;
  /** Renders this node's label muted even if it's behind the current step
   *  (e.g. "Teams" for a singles tournament, which skips straight to Prizes). */
  skipped?: boolean;
}

interface StepIndicatorProps {
  steps: Step[];
  currentStep: number; // 0-indexed
}

/**
 * The bracket motif applied to wizard progress: numbered nodes joined by a
 * line, done steps get a check, current gets the brand glow, upcoming is a
 * hollow ring — same visual language as PhaseRail, just 4 nodes instead of 3
 * and always fully stepped (no in-between segment fill).
 */
export default function StepIndicator({ steps, currentStep }: StepIndicatorProps) {
  return (
    <div className="flex w-full items-center px-2">
      {steps.map((step, i) => {
        // A skipped step (Teams, for a singles tournament) never gets the
        // done/current treatment even while the wizard is positioned at its
        // index — it's passed through, not actually filled in.
        const isDone = !step.skipped && i < currentStep;
        const isCurrent = !step.skipped && i === currentStep;

        return (
          <div key={i} className="flex flex-1 items-center last:flex-none">
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  'flex h-6 w-6 items-center justify-center rounded-full font-mono text-xs font-bold transition-all',
                  isDone
                    ? 'bg-brand text-white'
                    : isCurrent
                      ? 'bg-brand text-white shadow-node'
                      : 'border-2 border-line-strong bg-bg text-fg-muted'
                )}
              >
                {isDone ? <Check className="h-3.5 w-3.5" /> : i + 1}
              </div>
              <span
                className={cn(
                  'mt-1 whitespace-nowrap text-[10px] font-medium',
                  isCurrent ? 'text-fg' : 'text-fg-muted',
                  step.skipped && 'italic'
                )}
              >
                {step.label}
              </span>
            </div>

            {i < steps.length - 1 && (
              <div className={cn('mx-2 mb-4 h-0.5 flex-1 transition-all', isDone ? 'bg-brand' : 'bg-line-strong')} />
            )}
          </div>
        );
      })}
    </div>
  );
}
