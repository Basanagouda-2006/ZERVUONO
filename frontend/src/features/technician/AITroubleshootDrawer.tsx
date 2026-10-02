import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { X, Sparkles, AlertTriangle, ShieldCheck, CheckSquare, History } from 'lucide-react';
import { apiRequest } from '../../lib/api';

interface AITroubleshootDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  requestId: string;
}

interface TroubleshootingData {
  summary: string;
  likely_causes: string[];
  suggested_steps: string[];
  safety_precautions: string[];
  similar_past_issues: {
    request_number: string;
    title: string;
    resolution: string;
    closed_at: string;
  }[];
  is_available: boolean;
  provider_status: string;
}

export const AITroubleshootDrawer: React.FC<AITroubleshootDrawerProps> = ({
  isOpen,
  onClose,
  requestId,
}) => {
  const { data, isLoading, error } = useQuery<TroubleshootingData>({
    queryKey: ['ai-troubleshoot', requestId],
    queryFn: () =>
      apiRequest<TroubleshootingData>('/ai/troubleshoot', {
        method: 'POST',
        body: JSON.stringify({ request_id: requestId }),
      }),
    enabled: isOpen && !!requestId,
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-brand-forest/40 backdrop-blur-xs">
      <div className="absolute inset-0" onClick={onClose} />
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-lg bg-white dark:bg-brand-dark-card shadow-elevated border-l border-brand-evergreen/10 dark:border-brand-dark-border flex flex-col">
          {/* Header */}
          <div className="p-4 px-6 border-b border-brand-evergreen/10 dark:border-brand-dark-border flex items-center justify-between bg-brand-ivory/50 dark:bg-brand-dark-bg">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-brand-jade" />
              <h2 className="font-bold text-base text-brand-evergreen dark:text-brand-mint font-sans">
                AI Diagnostic & Troubleshooting Guide
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-brand-forest/60 hover:text-brand-forest dark:text-brand-dark-muted rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs">
            {isLoading ? (
              <div className="p-12 text-center text-brand-forest/60">
                <Sparkles className="w-8 h-8 text-brand-jade animate-spin mx-auto mb-3" />
                Analyzing equipment history and generating diagnostic checklist...
              </div>
            ) : error || !data ? (
              <div className="p-6 text-center text-red-600">
                Diagnostic assistance could not be loaded.
              </div>
            ) : (
              <>
                {/* Status indicator */}
                <div className="flex items-center justify-between text-[11px] px-3 py-1.5 rounded-lg bg-brand-ivory/80 dark:bg-brand-dark-bg border border-brand-evergreen/10">
                  <span className="font-semibold text-brand-forest/70 dark:text-brand-dark-muted">
                    Engine Mode:
                  </span>
                  <span className="font-mono text-brand-jade uppercase font-bold">
                    {data.provider_status === 'ready' ? 'Gemini 2.5 Flash' : 'Deterministic Heuristics'}
                  </span>
                </div>

                {/* Summary */}
                <div className="p-3.5 rounded-xl bg-brand-mint/15 dark:bg-brand-jade/10 border border-brand-mint/30 text-brand-evergreen dark:text-brand-mint leading-relaxed">
                  {data.summary}
                </div>

                {/* Safety Precautions */}
                {data.safety_precautions?.length > 0 && (
                  <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 space-y-2">
                    <span className="font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1.5 text-xs">
                      <AlertTriangle className="w-4 h-4 text-amber-600" /> Mandatory Safety Precautions
                    </span>
                    <ul className="space-y-1 text-amber-800 dark:text-amber-300 list-disc list-inside">
                      {data.safety_precautions.map((safe, idx) => (
                        <li key={idx}>{safe}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Likely Causes */}
                <div>
                  <h4 className="font-bold uppercase tracking-wider text-brand-forest/70 dark:text-brand-dark-muted mb-2 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-brand-coral" /> Likely Root Causes
                  </h4>
                  <ul className="space-y-1.5 pl-2">
                    {data.likely_causes?.map((cause, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-brand-forest dark:text-brand-dark-text">
                        <span className="w-1.5 h-1.5 rounded-full bg-brand-coral mt-1.5 flex-shrink-0" />
                        <span>{cause}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Suggested Steps */}
                <div>
                  <h4 className="font-bold uppercase tracking-wider text-brand-forest/70 dark:text-brand-dark-muted mb-2 flex items-center gap-1.5">
                    <CheckSquare className="w-3.5 h-3.5 text-brand-jade" /> Step-by-Step Inspection Checklist
                  </h4>
                  <div className="space-y-2">
                    {data.suggested_steps?.map((step, idx) => (
                      <div key={idx} className="p-2.5 rounded-xl bg-brand-ivory/50 dark:bg-brand-dark-bg border border-brand-evergreen/10 flex items-start gap-2.5">
                        <span className="w-5 h-5 rounded-full bg-brand-jade/20 text-brand-jade font-bold flex items-center justify-center flex-shrink-0 text-[10px]">
                          {idx + 1}
                        </span>
                        <span className="text-brand-forest dark:text-brand-dark-text leading-tight mt-0.5">
                          {step}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Similar Past Issues */}
                <div>
                  <h4 className="font-bold uppercase tracking-wider text-brand-forest/70 dark:text-brand-dark-muted mb-2 flex items-center gap-1.5">
                    <History className="w-3.5 h-3.5 text-brand-evergreen dark:text-brand-mint" /> Similar Resolved Issues in Organization
                  </h4>
                  {data.similar_past_issues?.length > 0 ? (
                    <div className="space-y-2">
                      {data.similar_past_issues.map((past, idx) => (
                        <div key={idx} className="p-3 rounded-xl bg-white dark:bg-brand-dark-bg border border-brand-evergreen/15 dark:border-brand-dark-border text-xs">
                          <div className="flex items-center justify-between font-bold text-brand-evergreen dark:text-brand-mint">
                            <span>{past.request_number}: {past.title}</span>
                            <span className="text-[10px] text-brand-forest/50 font-normal">{past.closed_at}</span>
                          </div>
                          <p className="mt-1 text-brand-forest/80 dark:text-brand-dark-muted italic">
                            Resolved by: {past.resolution}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-brand-forest/50 italic">No past issues match this equipment category yet.</p>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
