import React from 'react';
import { Wifi, WifiOff, AlertTriangle, RefreshCw } from 'lucide-react';
import { ConnectionStatus } from '../types';
import { useLanguage } from '../i18n/LanguageContext';

interface NetworkStatusBannerProps {
  status: ConnectionStatus;
  pingMs?: number | null;
  teammateDisconnected?: boolean;
  teammateMessage?: string;
  onDismissTeammateAlert?: () => void;
  onReconnect?: () => void;
}

export const NetworkStatusBanner: React.FC<NetworkStatusBannerProps> = ({
  status,
  pingMs,
  teammateDisconnected,
  teammateMessage,
  onDismissTeammateAlert,
  onReconnect,
}) => {
  const { t } = useLanguage();

  return (
    <>
      {/* Top Network Status Pill */}
      <div className="fixed top-3 left-3 z-50 flex items-center gap-2 pointer-events-auto">
        <div
          className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold backdrop-blur-md shadow-md transition-all duration-300 border ${
            status === 'connected'
              ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-600 dark:text-emerald-400'
              : status === 'connecting'
              ? 'bg-sky-500/15 border-sky-500/40 text-sky-600 dark:text-sky-400'
              : status === 'reconnecting'
              ? 'bg-amber-500/20 border-amber-500/50 text-amber-600 dark:text-amber-400 animate-pulse'
              : 'bg-rose-500/20 border-rose-500/50 text-rose-600 dark:text-rose-400'
          }`}
        >
          {status === 'connected' && (
            <>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping opacity-75" />
              <Wifi className="w-3.5 h-3.5" />
              <span>{t.network.connected}</span>
              {typeof pingMs === 'number' && (
                <span
                  className={`text-[11px] px-1.5 py-0.5 rounded font-mono ${
                    pingMs < 80
                      ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-300'
                      : pingMs < 180
                      ? 'bg-amber-500/20 text-amber-600 dark:text-amber-300'
                      : 'bg-rose-500/20 text-rose-600 dark:text-rose-300'
                  }`}
                >
                  {pingMs}ms
                </span>
              )}
            </>
          )}
          {status === 'connecting' && (
            <>
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>{t.network.connecting}</span>
            </>
          )}
          {status === 'reconnecting' && (
            <>
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>{t.network.reconnecting}</span>
            </>
          )}
          {status === 'disconnected' && (
            <>
              <WifiOff className="w-3.5 h-3.5" />
              <span>{t.network.disconnected}</span>
              {onReconnect && (
                <button
                  onClick={onReconnect}
                  className="ml-1 underline text-xs hover:text-rose-700 cursor-pointer"
                >
                  {t.network.retry}
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Teammate Disconnected Modal Alert */}
      {teammateDisconnected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border-2 border-amber-400 text-center space-y-4">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-100 dark:bg-amber-950/60 flex items-center justify-center text-amber-500 border border-amber-300">
              <AlertTriangle className="w-9 h-9 animate-bounce" />
            </div>

            <div className="space-y-1">
              <h3 className="text-xl font-black text-slate-800 dark:text-slate-100">
                {t.network.teammateDisconnectedTitle}
              </h3>
              <p className="text-sm font-semibold text-amber-600 dark:text-amber-400">
                {t.network.teammateDisconnectedSub}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 pt-1">
                {teammateMessage || t.network.teammateDisconnectedDesc}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 pt-2">
              <button
                id="btn-wait-teammate"
                onClick={onDismissTeammateAlert}
                className="w-full sm:w-auto h-12 px-6 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-white font-bold text-sm shadow-md transition-all active:scale-95 cursor-pointer"
              >
                {t.network.stayInRoomBtn}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
