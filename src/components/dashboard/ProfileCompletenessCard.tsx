import Link from 'next/link';
import { ShieldAlert, ShieldCheck } from 'lucide-react';

type CompletenessResult = {
  isComplete: boolean;
  missingRequired: string[];
  missingRecommended: string[];
  displayName?: string;
};

export function ProfileCompletenessCard({
  completeness,
  emphasizeRequired = false,
}: {
  completeness: CompletenessResult;
  emphasizeRequired?: boolean;
}) {
  const { isComplete } = completeness;

  return (
    <div className="rounded-lg border bg-card p-6">
      <div className=" flex items-center gap-2">
        <h2 className="text-xl font-semibold">Profile Status</h2>
        <span
          className={`text-sm px-2.5 py-0.5 rounded-full uppercase tracking-wider font-bold ${
            isComplete
              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
              : emphasizeRequired
                ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
          }`}
        >
          {isComplete ? 'Complete' : 'Incomplete'}
        </span>
      </div>
    </div>
  );
}
