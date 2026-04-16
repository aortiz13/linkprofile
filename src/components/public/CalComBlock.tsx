"use client";

import Cal, { getCalApi } from "@calcom/embed-react";
import { useEffect } from "react";

export interface CalComConfig {
  namespace?: string;
  calLink: string;
  config?: Record<string, any>;
  uiConfig?: Record<string, any>;
  title?: string;
  subtitle?: string;
  avatarUrl?: string;
  hideDetails?: boolean;
}

export function CalComBlock({
  namespace = "default",
  calLink,
  config = {},
  uiConfig = {},
  title,
  subtitle,
  avatarUrl,
  hideDetails,
}: CalComConfig) {
  useEffect(() => {
    (async function () {
      const cal = await getCalApi({ namespace });
      cal("ui", { hideEventTypeDetails: !!hideDetails, layout: "month_view", ...uiConfig });
    })();
  }, [namespace, uiConfig, hideDetails]);

  if (!calLink) {
    return (
      <div className="w-full h-48 flex items-center justify-center bg-[var(--bg-elevated)] rounded-[var(--radius-xl)] border border-[var(--border)]">
        <p className="text-[var(--text-muted)] text-sm">Configuración de Cal.com incompleta.</p>
      </div>
    );
  }

  return (
    <div className="w-full bg-[var(--bg-elevated)] rounded-[var(--radius-xl)] border border-[var(--border)] shadow-sm flex flex-col">
      {/* Header opcional */}
      {(title || subtitle || avatarUrl) && (
        <div className="p-4 sm:p-5 border-b border-[var(--border)] flex items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            {title && (
              <h3 className="text-base sm:text-lg font-bold text-[var(--text-primary)] truncate">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="text-sm text-[var(--text-muted)] truncate mt-0.5">
                {subtitle}
              </p>
            )}
          </div>
          {avatarUrl && (
            <div className="w-12 h-12 sm:w-14 sm:h-14 shrink-0 rounded-full overflow-hidden border border-[var(--border)]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
            </div>
          )}
        </div>
      )}

      {/* Calendario */}
      <div className="w-full relative z-10">
        <Cal
          namespace={namespace}
          calLink={calLink}
          style={{ width: "100%", overflow: "visible" }}
          config={{ layout: "month_view", useSlotsViewOnSmallScreen: "true", ...config }}
        />
      </div>
    </div>
  );
}
