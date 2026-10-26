import React, { useEffect, useState } from 'react';
import { X, RotateCcw, Smartphone, Volume2, VolumeX, Music, Zap, Sparkles } from 'lucide-react';
import { soundManager, SoundSettings } from '../services/soundManager';
import { useLanguage } from '../i18n/LanguageContext';
import { LanguageSelector } from './LanguageSelector';
import { playUISound } from '../services/audioService';
import { triggerSparkleEffect } from '../services/sparkleEffect';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200 select-none">
      <div className="card-fantasy relative w-full max-w-lg p-6 sm:p-7 text-slate-800 max-h-[92vh] overflow-y-auto">
        {/* Close Button */}
        <button
          id="btn-settings-close"
          onClick={(e) => {
            playUISound('back');
            triggerSparkleEffect(e);
            onClose();
          }}
          className="btn-fantasy-utility absolute top-4 right-4 w-10 h-10 rounded-full flex items-center justify-center cursor-pointer"
          aria-label={t.settings.saveAndReturnBtn}
        >
          <X className="w-5 h-5 text-slate-600" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-5 pb-3 border-b border-sky-100">
          <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-200/60 flex items-center justify-center shadow-xs">
            <Sparkles className="w-5 h-5 text-amber-500" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight text-slate-800">{t.settings.modalTitle}</h2>
            <p className="text-xs text-slate-500 font-medium">{t.settings.modalSubtitle}</p>
          </div>
        </div>

        {/* Language Selection Row */}
        <div className="mb-4 p-3.5 rounded-2xl bg-white/70 border border-sky-100/80 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold text-slate-800">{t.settings.languageOptionTitle}</div>
            <div className="text-xs text-slate-500">{t.settings.languageOptionDesc}</div>
          </div>
          <LanguageSelector compact />
        </div>

        {/* Audio Controls Section */}
        <div className="mb-5 space-y-3">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 px-1">
            {t.settings.audioTitle}
          </div>

          {/* Master Sound Toggle */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-white/70 border border-sky-100/80 shadow-xs">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-xl border ${audioSettings.muted ? 'bg-red-50 border-red-200 text-red-500' : 'bg-emerald-50 border-emerald-200 text-emerald-600'}`}>
                {audioSettings.muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </div>
              <div>
                <div className="text-sm font-semibold text-slate-800">{t.settings.masterMute}</div>
                <div className="text-xs text-slate-500">
                  {audioSettings.muted ? t.settings.masterMuteActive : t.settings.masterMuteInactive}
                </div>
              </div>
            </div>
            <button
              id="btn-settings-toggle-mute"
              onClick={(e) => {
                playUISound('toggle');
                triggerSparkleEffect(e);
                soundManager.toggleMute();
              }}
              className={`h-9 px-4 rounded-xl font-semibold text-xs transition-all cursor-pointer shadow-xs active:scale-95 ${
                audioSettings.muted
                  ? 'bg-red-100 text-red-700 hover:bg-red-200'
                  : 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
              }`}
            >
              {audioSettings.muted ? t.settings.mutedStatus : t.settings.unmutedStatus}
            </button>
          </div>

          {/* Background Music (BGM) */}
          <div className="p-3.5 rounded-2xl bg-white/70 border border-sky-100/80 shadow-xs space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-purple-50 border border-purple-200 text-purple-600">
                  <Music className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-800">{t.settings.bgmTitle}</div>
                  <div className="text-xs text-slate-500">{t.settings.bgmDesc}</div>
                </div>
              </div>
              <button
                id="btn-settings-toggle-bgm"
                onClick={(e) => {
                  playUISound('toggle');
                  triggerSparkleEffect(e);
                  soundManager.toggleBgm();
                }}
                className={`h-8 px-3 rounded-xl font-semibold text-xs transition-all cursor-pointer active:scale-95 ${
                  audioSettings.bgmEnabled
                    ? 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {audioSettings.bgmEnabled ? t.settings.bgmOn : t.settings.bgmOff}
              </button>
            </div>
            {audioSettings.bgmEnabled && (
              <div className="flex items-center gap-3 pt-1">
                <span className="text-xs text-slate-500 font-medium w-12">{t.settings.volumeLabel}</span>
                <input
                  id="slider-bgm-volume"
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={audioSettings.bgmVolume}
                  onChange={(e) => soundManager.setBgmVolume(parseFloat(e.target.value))}
                  className="w-full accent-purple-600 cursor-pointer h-2 bg-slate-200 rounded-lg"
                />
                <span className="text-xs font-mono font-semibold text-purple-700 w-10 text-right">
                  {Math.round(audioSettings.bgmVolume * 100)}%
                </span>
              </div>
            )}
          </div>

          {/* Sound Effects (SFX) */}
          <div className="p-3.5 rounded-2xl bg-white/70 border border-sky-100/80 shadow-xs space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-600">
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-800">{t.settings.sfxTitle}</div>
                  <div className="text-xs text-slate-500">{t.settings.sfxDesc}</div>
                </div>
              </div>
              <button
                id="btn-settings-toggle-sfx"
                onClick={(e) => {
                  playUISound('toggle');
                  triggerSparkleEffect(e);
                  soundManager.toggleSfx();
                  if (!audioSettings.sfxEnabled) {
                    soundManager.playJump('xinyi');
                  }
                }}
                className={`h-8 px-3 rounded-xl font-semibold text-xs transition-all cursor-pointer active:scale-95 ${
                  audioSettings.sfxEnabled
                    ? 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {audioSettings.sfxEnabled ? t.settings.sfxOn : t.settings.sfxOff}
              </button>
            </div>
            {audioSettings.sfxEnabled && (
              <div className="flex items-center gap-3 pt-1">
                <span className="text-xs text-slate-500 font-medium w-12">{t.settings.volumeLabel}</span>
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
                  className="w-full accent-amber-500 cursor-pointer h-2 bg-slate-200 rounded-lg"
                />
                <span className="text-xs font-mono font-semibold text-amber-700 w-10 text-right">
                  {Math.round(audioSettings.sfxVolume * 100)}%
                </span>
              </div>
            )}
          </div>
        </div>

        {/* General Controls List */}
        <div className="space-y-3 mb-6">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 px-1">
            {t.settings.controlsTitle}
          </div>

          {/* Option 1: Mobile Touch Controls Toggle */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-white/70 border border-sky-100/80 shadow-xs">
            <div className="flex items-center gap-3">
              <Smartphone className="w-4 h-4 text-sky-600" />
              <div>
                <div className="text-sm font-semibold text-slate-800">{t.settings.touchControlsTitle}</div>
                <div className="text-xs text-slate-500">{t.settings.touchControlsDesc}</div>
              </div>
            </div>
            <button
              id="btn-settings-toggle-touch"
              onClick={(e) => {
                playUISound('toggle');
                triggerSparkleEffect(e);
                onToggleTouchControls();
              }}
              className={`h-9 px-4 rounded-xl font-semibold text-xs transition-all cursor-pointer active:scale-95 ${
                showTouchControls
                  ? 'bg-sky-100 text-sky-800 hover:bg-sky-200'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {showTouchControls ? t.settings.enabled : t.settings.disabled}
            </button>
          </div>

          {/* Option 2: Quick Reset Level */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-white/70 border border-sky-100/80 shadow-xs">
            <div className="flex items-center gap-3">
              <RotateCcw className="w-4 h-4 text-amber-600" />
              <div>
                <div className="text-sm font-semibold text-slate-800">{t.settings.restartLevelTitle}</div>
                <div className="text-xs text-slate-500">{t.settings.restartLevelDesc}</div>
              </div>
            </div>
            <button
              id="btn-settings-restart"
              onClick={(e) => {
                playUISound('click');
                triggerSparkleEffect(e);
                onRestart();
                onClose();
              }}
              className="btn-fantasy-utility h-9 px-4 rounded-xl font-semibold text-xs text-amber-700 hover:text-amber-800 cursor-pointer"
            >
              {t.settings.restartNowBtn}
            </button>
          </div>
        </div>

        {/* Big Bottom Confirm Button (Primary Fantasy) */}
        <button
          id="btn-settings-confirm"
          onClick={(e) => {
            playUISound('confirm');
            triggerSparkleEffect(e);
            onClose();
          }}
          className="btn-fantasy-primary w-full h-12 rounded-2xl font-bold text-sm tracking-wide cursor-pointer flex items-center justify-center uppercase"
        >
          {t.settings.saveAndReturnBtn}
        </button>
      </div>
    </div>
  );
};
