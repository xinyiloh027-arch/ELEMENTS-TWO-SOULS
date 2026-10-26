import React from 'react';
import { Wifi, WifiOff, AlertTriangle, RefreshCw } from 'lucide-react';
import { ConnectionStatus } from '../types';
import { useLanguage } from '../i18n/LanguageContext';
import { playUISound } from '../services/audioService';
import { triggerSparkleEffect } from '../services/sparkleEffect';

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
      <div className="fixed top-3 left-3 z-50 flex items-center gap-2 pointer-events-auto select-none">
        <div
          className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-md shadow-xs border transition-all duration-200 ${
            status === 'connected'
              ? 'bg-emerald-500/90 text-white border-emerald-400'
              : status === 'connecting'
              ? 'bg-sky-500/90 text-white border-sky-400'
              : status === 'reconnecting'
              ? 'bg-amber-500/90 text-white border-amber-400 animate-pulse'
              : 'bg-red-500/90 text-white border-red-400'
          }`}
        >
          {status === 'connected' && (
            <>
              <Wifi className="w-3.5 h-3.5" />
              <span>{t.network.connected}</span>
              {typeof pingMs === 'number' && (
                <span className="text-[10px] px-1.5 py-0.2 rounded-full font-mono bg-white/20 text-white">
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
                  onClick={(e) => {
                    playUISound('click');
                    triggerSparkleEffect(e);
                    onReconnect();
                  }}
                  className="ml-1 underline font-bold text-xs hover:text-amber-200 cursor-pointer"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in select-none">
          <div className="card-fantasy relative w-full max-w-md p-6 sm:p-7 text-center space-y-4">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-500 shadow-sm">
              <AlertTriangle className="w-8 h-8 animate-bounce" />
            </div>

            <div className="space-y-1">
              <h3 className="text-xl font-bold text-slate-800">
                {t.network.teammateDisconnectedTitle}
              </h3>
              <p className="text-sm font-semibold text-amber-600">
                {t.network.teammateDisconnectedSub}
              </p>
              <p className="text-xs text-slate-500 font-medium pt-1">
                {teammateMessage || t.network.teammateDisconnectedDesc}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 pt-2">
              <button
                id="btn-wait-teammate"
                onClick={(e) => {
                  playUISound('confirm');
                  triggerSparkleEffect(e);
                  onDismissTeammateAlert?.();
                }}
                className="btn-fantasy-primary w-full sm:w-auto h-11 px-6 rounded-2xl font-bold text-xs sm:text-sm flex items-center justify-center cursor-pointer uppercase"
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
