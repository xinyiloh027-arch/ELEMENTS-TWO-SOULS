import React, { useEffect, useState } from 'react';
import { X, RotateCcw, Smartphone, Volume2, VolumeX, Music, Zap, Sparkles, Globe } from 'lucide-react';
import { soundManager, SoundSettings } from '../services/soundManager';
import { useLanguage } from '../i18n/LanguageContext';
import { LanguageSelector } from './LanguageSelector';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  showTouchControls: boolean;
  onToggleTouchControls: () => void;
  onRestart: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  showTouchControls,
  onToggleTouchControls,
  onRestart,
}) => {
  const { t } = useLanguage();
  const [audioSettings, setAudioSettings] = useState<SoundSettings>(() => soundManager.getSettings());

  useEffect(() => {
    return soundManager.subscribe((settings) => {
      setAudioSettings(settings);
    });
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700 rounded-3xl p-6 shadow-2xl text-white max-h-[92vh] overflow-y-auto">
        {/* Close Button (Large 48x48) */}
        <button
          id="btn-settings-close"
          onClick={onClose}
          className="absolute top-4 right-4 w-12 h-12 rounded-2xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-300 hover:text-white flex items-center justify-center border border-slate-700 transition-all cursor-pointer"
          aria-label={t.settings.saveAndReturnBtn}
        >
          <X className="w-6 h-6" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-500 to-orange-500 flex items-center justify-center shadow-lg shadow-sky-500/20">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-black tracking-wide text-white">{t.settings.modalTitle}</h2>
            <p className="text-xs text-slate-400">{t.settings.modalSubtitle}</p>
          </div>
        </div>

        {/* Language Selection Row */}
        <div className="mb-5 p-3.5 rounded-2xl bg-slate-800/90 border border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-slate-100">{t.settings.languageOptionTitle}</div>
              <div className="text-xs text-slate-400">{t.settings.languageOptionDesc}</div>
            </div>
          </div>
          <LanguageSelector compact />
        </div>

        {/* Audio Controls Section */}
        <div className="mb-5 space-y-3">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400 px-1">
            {t.settings.audioTitle}
          </div>

          {/* Master Sound Toggle */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-800/90 border border-slate-700">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-xl ${audioSettings.muted ? 'bg-rose-500/20 text-rose-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                {audioSettings.muted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              </div>
              <div>
                <div className="text-sm font-bold text-slate-100">{t.settings.masterMute}</div>
                <div className="text-xs text-slate-400">
                  {audioSettings.muted ? t.settings.masterMuteActive : t.settings.masterMuteInactive}
                </div>
              </div>
            </div>
            <button
              id="btn-settings-toggle-mute"
              onClick={() => soundManager.toggleMute()}
              className={`h-11 px-4 rounded-xl font-bold text-sm border transition-all cursor-pointer active:scale-95 ${
                audioSettings.muted
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/50 hover:bg-rose-500/30'
                  : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 hover:bg-emerald-500/30'
              }`}
            >
              {audioSettings.muted ? t.settings.mutedStatus : t.settings.unmutedStatus}
            </button>
          </div>

          {/* Background Music (BGM) */}
          <div className="p-3.5 rounded-2xl bg-slate-800/70 border border-slate-700/80 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400">
                  <Music className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-200">{t.settings.bgmTitle}</div>
                  <div className="text-xs text-slate-400">{t.settings.bgmDesc}</div>
                </div>
              </div>
              <button
                id="btn-settings-toggle-bgm"
                onClick={() => soundManager.toggleBgm()}
                className={`h-9 px-3 rounded-lg font-bold text-xs border transition-all cursor-pointer active:scale-95 ${
                  audioSettings.bgmEnabled
                    ? 'bg-purple-500/20 text-purple-300 border-purple-500/40 hover:bg-purple-500/30'
                    : 'bg-slate-700 text-slate-400 border-slate-600 hover:text-white'
                }`}
              >
                {audioSettings.bgmEnabled ? t.settings.bgmOn : t.settings.bgmOff}
              </button>
            </div>
            {audioSettings.bgmEnabled && (
              <div className="flex items-center gap-3 pt-1">
                <span className="text-xs text-slate-400 w-12">{t.settings.volumeLabel}</span>
                <input
                  id="slider-bgm-volume"
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={audioSettings.bgmVolume}
                  onChange={(e) => soundManager.setBgmVolume(parseFloat(e.target.value))}
                  className="w-full accent-purple-500 cursor-pointer h-2 bg-slate-700 rounded-lg"
                />
                <span className="text-xs font-mono text-purple-300 w-10 text-right">
                  {Math.round(audioSettings.bgmVolume * 100)}%
                </span>
              </div>
            )}
          </div>

          {/* Sound Effects (SFX) */}
          <div className="p-3.5 rounded-2xl bg-slate-800/70 border border-slate-700/80 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-200">{t.settings.sfxTitle}</div>
                  <div className="text-xs text-slate-400">{t.settings.sfxDesc}</div>
                </div>
              </div>
              <button
                id="btn-settings-toggle-sfx"
                onClick={() => {
                  soundManager.toggleSfx();
                  if (!audioSettings.sfxEnabled) {
                    soundManager.playJump('xinyi');
                  }
                }}
                className={`h-9 px-3 rounded-lg font-bold text-xs border transition-all cursor-pointer active:scale-95 ${
                  audioSettings.sfxEnabled
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30'
                    : 'bg-slate-700 text-slate-400 border-slate-600 hover:text-white'
                }`}
              >
                {audioSettings.sfxEnabled ? t.settings.sfxOn : t.settings.sfxOff}
              </button>
            </div>
            {audioSettings.sfxEnabled && (
              <div className="flex items-center gap-3 pt-1">
                <span className="text-xs text-slate-400 w-12">{t.settings.volumeLabel}</span>
                <input
                  id="slider-sfx-volume"
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={audioSettings.sfxVolume}
                  onChange={(e) => {
                    soundManager.setSfxVolume(parseFloat(e.target.value));
                    soundManager.playJump('james');
                  }}
                  className="w-full accent-amber-500 cursor-pointer h-2 bg-slate-700 rounded-lg"
                />
                <span className="text-xs font-mono text-amber-300 w-10 text-right">
                  {Math.round(audioSettings.sfxVolume * 100)}%
                </span>
              </div>
            )}
          </div>
        </div>

        {/* General Controls List */}
        <div className="space-y-3 mb-6">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400 px-1">
            {t.settings.controlsTitle}
          </div>

          {/* Option 1: Mobile Touch Controls Toggle */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700/80">
            <div className="flex items-center gap-3">
              <Smartphone className="w-5 h-5 text-sky-400" />
              <div>
                <div className="text-sm font-bold text-slate-200">{t.settings.touchControlsTitle}</div>
                <div className="text-xs text-slate-400">{t.settings.touchControlsDesc}</div>
              </div>
            </div>
            <button
              id="btn-settings-toggle-touch"
              onClick={onToggleTouchControls}
              className={`h-11 px-4 rounded-xl font-bold text-sm border transition-all cursor-pointer active:scale-95 ${
                showTouchControls
                  ? 'bg-sky-500 text-white border-sky-400 shadow-md shadow-sky-500/30'
                  : 'bg-slate-700 text-slate-300 border-slate-600 hover:text-white'
              }`}
            >
              {showTouchControls ? t.settings.enabled : t.settings.disabled}
            </button>
          </div>

          {/* Option 2: Quick Reset Level */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700/80">
            <div className="flex items-center gap-3">
              <RotateCcw className="w-5 h-5 text-amber-400" />
              <div>
                <div className="text-sm font-bold text-slate-200">{t.settings.restartLevelTitle}</div>
                <div className="text-xs text-slate-400">{t.settings.restartLevelDesc}</div>
              </div>
            </div>
            <button
              id="btn-settings-restart"
              onClick={() => {
                onRestart();
                onClose();
              }}
              className="h-11 px-4 rounded-xl font-bold text-sm bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 transition-all cursor-pointer active:scale-95"
            >
              {t.settings.restartNowBtn}
            </button>
          </div>
        </div>

        {/* Big Bottom Confirm Button */}
        <button
          id="btn-settings-confirm"
          onClick={onClose}
          className="w-full h-14 rounded-2xl bg-gradient-to-r from-sky-500 to-orange-500 hover:from-sky-400 hover:to-orange-400 active:scale-98 text-white font-bold text-base shadow-lg shadow-sky-950/40 border border-white/20 transition-all cursor-pointer flex items-center justify-center"
        >
          {t.settings.saveAndReturnBtn}
        </button>
      </div>
    </div>
  );
};
