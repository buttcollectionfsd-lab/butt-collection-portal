import React from 'react';
import { AlertTriangle, Eraser } from 'lucide-react';

const MAX_LISTED_ISSUES = 4;

/**
 * Red banner listing every field that still contains Urdu / Arabic letters.
 * Used both inside data-entry forms (blocks saving) and above the app shell
 * (offers a one-click cleanup of already-saved records).
 */
export default function ScriptWarning({
  issues,
  title = 'Urdu / Arabic script is not allowed',
  description = 'PDF, Word and Excel exports only support English letters. Type English or Roman Urdu instead — e.g. "Gym Set" instead of "جم سیٹ".',
  actionLabel = 'Remove Urdu text',
  onAction,
  isBusy = false
}) {
  if (!issues || issues.length === 0) return null;

  const listed = issues.slice(0, MAX_LISTED_ISSUES);
  const hiddenCount = issues.length - listed.length;

  return (
    <div className="bg-rose-50 border-2 border-rose-300 rounded-xl p-4 flex flex-col sm:flex-row sm:items-start gap-3">
      <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />

      <div className="flex-1 min-w-0">
        <p className="font-bold text-rose-900 text-sm">{title}</p>
        <p className="text-[11px] text-rose-700 mt-1 leading-relaxed">{description}</p>

        <ul className="mt-2 space-y-1">
          {listed.map(issue => (
            <li key={issue.field || issue.label} className="text-[11px] text-rose-900 flex flex-wrap gap-1">
              <span className="font-bold">{issue.label}:</span>
              <span className="font-mono break-all" dir="auto">{issue.value}</span>
            </li>
          ))}
          {hiddenCount > 0 && (
            <li className="text-[11px] font-semibold text-rose-700">
              …and {hiddenCount} more field{hiddenCount === 1 ? '' : 's'}
            </li>
          )}
        </ul>
      </div>

      {onAction && (
        <button
          type="button"
          onClick={onAction}
          disabled={isBusy}
          className="flex items-center justify-center space-x-1.5 px-3.5 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 disabled:opacity-60 text-white text-xs font-bold shadow-sm transition shrink-0"
        >
          <Eraser className="w-3.5 h-3.5" />
          <span>{isBusy ? 'Cleaning…' : actionLabel}</span>
        </button>
      )}
    </div>
  );
}
