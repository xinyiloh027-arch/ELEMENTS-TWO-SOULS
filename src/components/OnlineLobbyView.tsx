import React, { useState, useEffect, useRef } from 'react';
import {
  Users,
  PlusCircle,
  LogIn,
  ArrowLeft,
  Copy,
  Check,
  Sparkles,
  Loader2,
  ShieldCheck,
  RotateCcw,
} from 'lucide-react';
import { socketService } from '../services/socketService';
import { ConnectionStatus, PlayerId, RoomState } from '../types';
import { useLanguage } from '../i18n/LanguageContext';
import { LanguageSelector } from './LanguageSelector';
import { playUISound } from '../services/audioService';
import { triggerSparkleEffect } from '../services/sparkleEffect';

import skyTempleImg from '../assets/images/sky_temple_clouds_1793017137822.jpg';

interface OnlineLobbyViewProps {
  onBackToHome: () => void;
  onStartGame: (role: PlayerId, roomCode: string) => void;
}

export const OnlineLobbyView: React.FC<OnlineLobbyViewProps> = ({
  onBackToHome,
  onStartGame,
}) => {
  const { t } = useLanguage();
  const [subView, setSubView] = useState<'menu' | 'join' | 'waiting' | 'lobby'>('menu');
  const [roomCodeInput, setRoomCodeInput] = useState('');
  const [currentRoom, setCurrentRoom] = useState<RoomState | null>(null);
  const [myRole, setMyRole] = useState<PlayerId>('xinyi');
  const [isReady, setIsReady] = useState(false);
  const [copied, setCopied] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>(
    socketService.getStatus()
  );

  const currentRoomRef = useRef<RoomState | null>(null);
  currentRoomRef.current = currentRoom;
  const myRoleRef = useRef<PlayerId>(myRole);
  myRoleRef.current = myRole;
  const onStartGameRef = useRef(onStartGame);
  onStartGameRef.current = onStartGame;

  // Initialize Socket connection and listeners ONCE on mount
  useEffect(() => {
    socketService.connect();

    const unsubStatus = socketService.subscribeStatus((status) => {
      setConnectionStatus(status);
    });

    const unsubRoom = socketService.subscribeRoom((room) => {
      setCurrentRoom(room);
      const p1 = room.players.xinyi || room.players.lumi;
      const p2 = room.players.james || room.players.flare;
      const hasP1 = !!(p1 && p1.isConnected);
      const hasP2 = !!(p2 && p2.isConnected);
      if (hasP1 && hasP2) {
        setSubView('lobby');
      } else if (hasP1 && !hasP2) {
        setSubView('waiting');
      }
    });

    const unsubCountdown = socketService.subscribeCountdown((sec) => {
      if (sec === -1) {
        setCountdown(null);
      } else {
        setCountdown(sec);
      }
    });

    const unsubGameStart = socketService.subscribeGameStart(() => {
      if (currentRoomRef.current) {
        onStartGameRef.current?.(myRoleRef.current, currentRoomRef.current.roomCode);
      }
    });

    return () => {
      unsubStatus();
      unsubRoom();
      unsubCountdown();
      unsubGameStart();
    };
  }, []);

  // Handle Create Room
  const handleCreateRoom = async () => {
    playUISound('click');
    setIsLoading(true);
    setErrorMessage('');
    const res = await socketService.createRoom('Xinyi');
    setIsLoading(false);
    if (res.success && res.room && res.roomCode) {
      setCurrentRoom(res.room);
      setMyRole('xinyi');
      setSubView('waiting');
    } else {
      setErrorMessage(res.error || t.lobby.errorCreateFailed);
    }
  };

  // Handle Join Room
  const handleJoinRoom = async () => {
    if (roomCodeInput.trim().length !== 6) {
      setErrorMessage(t.lobby.errorInvalidCode);
      return;
    }
    playUISound('click');
    setIsLoading(true);
    setErrorMessage('');
    const res = await socketService.joinRoom(roomCodeInput.trim(), 'James');
    setIsLoading(false);
    if (res.success && res.room) {
      setCurrentRoom(res.room);
      setMyRole('james');
      setSubView('lobby');
    } else {
      setErrorMessage(res.error || t.lobby.errorJoinFailed);
    }
  };

  // Handle Toggle Ready Status
  const handleToggleReady = () => {
    if (!currentRoom) return;
    playUISound('toggle');
    const nextReady = !isReady;
    setIsReady(nextReady);
    socketService.setReady(nextReady);
  };

  // Handle Copy Room Code
  const handleCopyCode = async () => {
    if (!currentRoom) return;
    playUISound('click');
    try {
      await navigator.clipboard.writeText(currentRoom.roomCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  // Handle Leave Room
  const handleLeaveRoom = () => {
    playUISound('back');
    socketService.leaveRoom();
    setCurrentRoom(null);
    setIsReady(false);
    setCountdown(null);
    setSubView('menu');
  };

  const p1 = currentRoom?.players.xinyi || currentRoom?.players.lumi;
  const p2 = currentRoom?.players.james || currentRoom?.players.flare;
  const isBothReady = Boolean(p1?.isReady && p2?.isReady);

  return (
    <div className="relative min-h-screen w-full flex flex-col items-center justify-center p-4 sm:p-6 text-[#1e293b] overflow-hidden select-none">
      {/* 1. Cinematic Sky Background */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <img
          src={skyTempleImg}
          alt="Fantasy Sky Mountain Temple"
          className="w-full h-full object-cover object-center transform scale-105 will-change-transform"
          loading="eager"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a192f]/85 via-[#0a192f]/40 to-transparent pointer-events-none" />
        <div className="absolute inset-0 backdrop-blur-[2px] bg-slate-900/25 pointer-events-none" />
      </div>

      {/* 2. Top Header Bar: Language Switcher and Server Connection Indicator */}
      <div className="absolute top-3 sm:top-5 left-3 sm:left-6 z-20">
        <div className="backdrop-blur-md bg-white/80 hover:bg-white/95 rounded-full border border-white/60 shadow-[0_4px_16px_rgba(0,0,0,0.1)] transition-all">
          <LanguageSelector />
        </div>
      </div>

      <div className="absolute top-3 sm:top-5 right-3 sm:right-6 z-20">
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full backdrop-blur-md bg-white/80 border border-white/60 shadow-[0_4px_16px_rgba(0,0,0,0.1)] text-xs font-bold text-[#1e293b]">
          <span
            className={`w-2.5 h-2.5 rounded-full ${
              connectionStatus === 'connected'
                ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]'
                : connectionStatus === 'connecting'
                ? 'bg-amber-400 animate-ping'
                : 'bg-rose-500'
            }`}
          />
          <span className="hidden sm:inline">
            {connectionStatus === 'connected'
              ? t.lobby.serverConnected
              : connectionStatus === 'connecting'
              ? t.lobby.serverConnecting
              : t.lobby.serverUnconfigured}
          </span>
        </div>
      </div>

      {/* 3. Main Center Menu Container */}
      <div className="relative z-10 max-w-xl w-full flex flex-col items-center">
        {/* Error Alert Banner */}
        {errorMessage && (
          <div className="mb-4 w-full p-4 rounded-2xl bg-[#fee2e2]/95 border border-rose-300 text-[#991b1b] text-sm font-bold flex items-center justify-between shadow-lg animate-fade-in">
            <span>⚠️ {errorMessage}</span>
            <button
              onClick={() => setErrorMessage('')}
              className="text-xs underline hover:text-rose-900 cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {/* 1. Multiplayer Selection Menu */}
        {subView === 'menu' && (
          <div className="card-fantasy relative w-full p-6 sm:p-8 rounded-3xl space-y-6 text-center animate-fade-in">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-sky-100/90 border border-sky-300 text-[#0369a1] text-xs font-bold shadow-xs">
                <Users className="w-3.5 h-3.5" />
                <span>{t.lobby.badge}</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-black text-[#0f172a]">
                {t.lobby.title}
              </h2>
              <p className="text-sm text-[#475569] font-medium">
                {t.lobby.subtitle}
              </p>
            </div>

            {/* Two Main Choice Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              {/* Create Room Button (Sky Blue Fantasy Style) */}
              <button
                id="btn-create-room"
                onClick={(e) => {
                  triggerSparkleEffect(e);
                  handleCreateRoom();
                }}
                disabled={isLoading}
                className="btn-fantasy-secondary group flex flex-col items-center justify-center gap-2.5 p-6 rounded-3xl cursor-pointer disabled:opacity-50"
              >
                <div className="w-14 h-14 rounded-2xl bg-white text-[#0284c7] border border-sky-200 flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
                  <PlusCircle className="w-7 h-7" />
                </div>
                <div className="text-center leading-tight">
                  <span className="text-lg font-black text-[#0369a1] block">
                    {t.lobby.createRoom}
                  </span>
                  <span className="text-[11px] sm:text-xs font-extrabold tracking-wider text-[#0284c7] uppercase block mt-0.5">
                    {t.lobby.createRoomSub}
                  </span>
                  <span className="text-xs font-medium text-[#475569] block mt-1.5">
                    {t.lobby.createRoomHint}
                  </span>
                </div>
              </button>

              {/* Join Room Button (Warm Golden Fantasy Style) */}
              <button
                id="btn-join-room-nav"
                onClick={(e) => {
                  playUISound('click');
                  triggerSparkleEffect(e);
                  setErrorMessage('');
                  setSubView('join');
                }}
                disabled={isLoading}
                className="btn-fantasy-primary group flex flex-col items-center justify-center gap-2.5 p-6 rounded-3xl cursor-pointer disabled:opacity-50"
              >
                <div className="w-14 h-14 rounded-2xl bg-white text-[#ea580c] border border-amber-200 flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
                  <LogIn className="w-7 h-7" />
                </div>
                <div className="text-center leading-tight">
                  <span className="text-lg font-black text-[#78350f] block">
                    {t.lobby.joinRoom}
                  </span>
                  <span className="text-[11px] sm:text-xs font-extrabold tracking-wider text-[#b45309] uppercase block mt-0.5">
                    {t.lobby.joinRoomSub}
                  </span>
                  <span className="text-xs font-medium text-[#475569] block mt-1.5">
                    {t.lobby.joinRoomHint}
                  </span>
                </div>
              </button>
            </div>

            {/* Back to Home Button */}
            <div className="pt-2">
              <button
                id="btn-back-home"
                onClick={(e) => {
                  playUISound('back');
                  triggerSparkleEffect(e);
                  onBackToHome();
                }}
                className="btn-fantasy-utility inline-flex items-center justify-center gap-2 h-13 px-8 rounded-2xl font-bold text-base cursor-pointer"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>{t.lobby.backToHome}</span>
              </button>
            </div>
          </div>
        )}

        {/* 2. Join Room Input View */}
        {subView === 'join' && (
          <div className="card-fantasy relative w-full p-6 sm:p-8 rounded-3xl space-y-6 text-center animate-fade-in">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-amber-100/90 border border-amber-300 text-[#b45309] text-xs font-bold shadow-xs">
                <LogIn className="w-3.5 h-3.5" />
                <span>{t.lobby.joinRoomTitle}</span>
              </div>
              <h2 className="text-3xl font-black text-[#0f172a]">{t.lobby.joinRoomTitle}</h2>
              <p className="text-sm text-[#475569] font-medium">
                {t.lobby.joinRoomSubtitle}
              </p>
            </div>

            {/* 6-Digit Code Input */}
            <div className="space-y-3">
              <input
                id="input-room-code"
                type="text"
                maxLength={6}
                value={roomCodeInput}
                onChange={(e) => setRoomCodeInput(e.target.value.replace(/\D/g, ''))}
                placeholder={t.lobby.roomCodePlaceholder}
                className="w-full max-w-xs mx-auto h-16 text-center text-3xl font-mono font-black tracking-widest rounded-2xl border-2 border-amber-300/80 focus:border-amber-500 focus:ring-4 focus:ring-amber-200/50 bg-white/95 text-[#0f172a] placeholder:text-[#94a3b8] shadow-inner transition-all outline-none"
              />
            </div>

            {/* Action Buttons: Join and Cancel */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                id="btn-back-to-menu"
                onClick={(e) => {
                  playUISound('back');
                  triggerSparkleEffect(e);
                  setSubView('menu');
                }}
                className="btn-fantasy-utility w-full sm:w-auto h-13 px-8 rounded-2xl font-bold text-base cursor-pointer"
              >
                {t.lobby.backBtn}
              </button>

              <button
                id="btn-confirm-join"
                onClick={(e) => {
                  triggerSparkleEffect(e);
                  handleJoinRoom();
                }}
                disabled={roomCodeInput.length !== 6 || isLoading}
                className="btn-fantasy-primary w-full sm:w-auto min-w-[200px] h-13 px-8 rounded-2xl font-black text-lg transition-all cursor-pointer disabled:opacity-40 disabled:pointer-events-none flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <LogIn className="w-5 h-5" />
                )}
                <div className="flex flex-col items-center leading-tight">
                  <span className="font-black text-lg">{t.lobby.joinConfirmBtn}</span>
                  <span className="text-[10px] font-extrabold tracking-wider text-[#78350f] uppercase">
                    {t.lobby.joinConfirmBtnSub}
                  </span>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* 3. Waiting for Teammate View (Host waiting for Player 2) */}
        {subView === 'waiting' && currentRoom && (
          <div className="card-fantasy relative w-full p-6 sm:p-8 rounded-3xl space-y-6 text-center animate-fade-in">
            <div className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-[#0369a1] bg-sky-100/90 border border-sky-300 px-3.5 py-1 rounded-full shadow-xs">
                {t.lobby.roomCreatedBadge}
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-[#0f172a] pt-2">
                {t.lobby.shareCodeTitle}
              </h2>
            </div>

            {/* Ticket Code Display with Copy Button */}
            <div className="p-6 rounded-2xl bg-white/80 border border-sky-200/80 shadow-inner flex flex-col items-center gap-3 relative">
              <span className="text-xs font-bold text-[#64748b]">{t.lobby.roomCodeLabel}</span>
              <div className="text-4xl sm:text-5xl font-mono font-black tracking-widest text-[#0369a1] drop-shadow-sm">
                {currentRoom.roomCode}
              </div>

              {/* Copy Button */}
              <button
                id="btn-copy-code"
                onClick={(e) => {
                  triggerSparkleEffect(e);
                  handleCopyCode();
                }}
                className="btn-fantasy-secondary inline-flex items-center gap-2 h-11 px-6 rounded-2xl font-bold text-sm cursor-pointer"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? t.lobby.copiedText : t.lobby.copyCodeBtn}</span>
              </button>
            </div>

            {/* Waiting pulse indicator */}
            <div className="flex items-center justify-center gap-3 py-2 text-[#0369a1] font-medium">
              <Loader2 className="w-5 h-5 text-sky-500 animate-spin" />
              <span className="text-base font-bold animate-pulse">
                {t.lobby.waitingTeammate}
              </span>
            </div>

            {/* Leave Room Button */}
            <div className="pt-2">
              <button
                id="btn-leave-waiting-room"
                onClick={(e) => {
                  triggerSparkleEffect(e);
                  handleLeaveRoom();
                }}
                className="btn-fantasy-utility h-13 px-8 rounded-2xl font-bold text-base cursor-pointer"
              >
                {t.lobby.cancelAndReturn}
              </button>
            </div>
          </div>
        )}

        {/* 4. Room Lobby View (Both players present) */}
        {subView === 'lobby' && currentRoom && (
          <div className="card-fantasy relative w-full p-6 sm:p-8 rounded-3xl space-y-6 text-center animate-fade-in">
            {/* Header: Room Code Badge */}
            <div className="flex items-center justify-between border-b border-slate-200/70 pb-4">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[#64748b]">{t.lobby.roomCodeHeader}</span>
                <span className="text-xl font-mono font-black text-[#0f172a] tracking-wider">
                  #{currentRoom.roomCode}
                </span>
                <button
                  onClick={(e) => {
                    triggerSparkleEffect(e);
                    handleCopyCode();
                  }}
                  className="p-1 text-[#64748b] hover:text-[#0369a1] transition-colors cursor-pointer"
                  title={t.lobby.copyCodeBtn}
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>

              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100/90 border border-emerald-300 text-emerald-800 text-xs font-bold shadow-xs">
                <Users className="w-3.5 h-3.5" />
                <span>{t.lobby.playersReadyHeader}</span>
              </div>
            </div>

            {/* Two Players Status Cards */}
            <div className="grid grid-cols-2 gap-4">
              {/* Player 1 Card: Xinyi */}
              <div
                className={`p-4 rounded-2xl border transition-all ${
                  p1?.isReady
                    ? 'bg-sky-100/90 border-sky-300 shadow-md'
                    : 'bg-white/80 border-slate-200 shadow-xs'
                }`}
              >
                <div className="relative w-16 h-16 mx-auto mb-2 flex items-center justify-center">
                  <div className="w-14 h-14 rounded-2xl bg-[#e0f2fe] border border-sky-300 shadow-xs flex items-center justify-center text-2xl">
                    💧
                  </div>
                  {(myRole === 'xinyi' || myRole === 'lumi') && (
                    <span className="absolute -bottom-1 px-2 py-0.2 rounded-full bg-[#0284c7] text-[10px] font-black text-white shadow-xs">
                      {t.lobby.youBadge}
                    </span>
                  )}
                </div>

                <div className="text-center">
                  <div className="text-base font-black text-[#0369a1]">Xinyi (P1)</div>
                  <div className="text-xs text-[#64748b]">{t.lobby.p1HostBadge}</div>
                </div>

                {/* Ready Status Badge */}
                <div
                  className={`mt-2 px-3 py-1 rounded-full text-xs font-bold flex items-center justify-center gap-1 border ${
                    p1?.isReady
                      ? 'bg-emerald-500 text-white border-emerald-600 shadow-xs'
                      : 'bg-slate-100 text-[#64748b] border-slate-200'
                  }`}
                >
                  {p1?.isReady ? (
                    <>
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                      <span>{t.lobby.readyBadge}</span>
                    </>
                  ) : (
                    <span>{t.lobby.waitingReadyBadge}</span>
                  )}
                </div>
              </div>

              {/* Player 2 Card: James */}
              <div
                className={`p-4 rounded-2xl border transition-all ${
                  p2?.isReady
                    ? 'bg-amber-100/90 border-amber-300 shadow-md'
                    : 'bg-white/80 border-slate-200 shadow-xs'
                }`}
              >
                <div className="relative w-16 h-16 mx-auto mb-2 flex items-center justify-center">
                  <div className="w-14 h-14 rounded-2xl bg-[#ffedd5] border border-amber-300 shadow-xs flex items-center justify-center text-2xl">
                    🔥
                  </div>
                  {(myRole === 'james' || myRole === 'flare') && (
                    <span className="absolute -bottom-1 px-2 py-0.2 rounded-full bg-[#ea580c] text-[10px] font-black text-white shadow-xs">
                      {t.lobby.youBadge}
                    </span>
                  )}
                </div>

                <div className="text-center">
                  <div className="text-base font-black text-[#c2410c]">James (P2)</div>
                  <div className="text-xs text-[#64748b]">{t.lobby.p2TeammateBadge}</div>
                </div>

                {/* Ready Status Badge */}
                <div
                  className={`mt-2 px-3 py-1 rounded-full text-xs font-bold flex items-center justify-center gap-1 border ${
                    p2?.isReady
                      ? 'bg-emerald-500 text-white border-emerald-600 shadow-xs'
                      : 'bg-slate-100 text-[#64748b] border-slate-200'
                  }`}
                >
                  {p2?.isReady ? (
                    <>
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                      <span>{t.lobby.readyBadge}</span>
                    </>
                  ) : (
                    <span>{t.lobby.waitingReadyBadge}</span>
                  )}
                </div>
              </div>
            </div>

            {/* Tip Message */}
            <div className="text-xs font-semibold text-[#64748b]">
              {isBothReady ? t.lobby.bothReadyTip : t.lobby.notReadyTip}
            </div>

            {/* Actions: Toggle Ready & Leave Room */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                id="btn-leave-lobby"
                onClick={(e) => {
                  triggerSparkleEffect(e);
                  handleLeaveRoom();
                }}
                className="btn-fantasy-utility w-full sm:w-auto h-13 px-8 rounded-2xl font-bold text-base cursor-pointer"
              >
                {t.lobby.leaveRoomBtn}
              </button>

              <button
                id="btn-toggle-ready"
                onClick={(e) => {
                  triggerSparkleEffect(e);
                  handleToggleReady();
                }}
                className={`w-full sm:w-auto min-w-[200px] h-13 px-8 rounded-2xl font-black text-lg transition-all cursor-pointer flex items-center justify-center gap-2 shadow-lg active:scale-95 ${
                  isReady
                    ? 'btn-fantasy-utility bg-amber-100 hover:bg-amber-200 text-[#b45309] border-amber-300'
                    : 'btn-fantasy-primary'
                }`}
              >
                <ShieldCheck className="w-5 h-5" />
                <span>{isReady ? t.lobby.cancelReadyBtnText : t.lobby.readyBtnText}</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 5. Giant Countdown Overlay (3 -> 2 -> 1 -> START) */}
      {countdown !== null && countdown >= 0 && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-950/70 backdrop-blur-md animate-fade-in select-none">
          <div className="card-fantasy relative p-8 sm:p-12 rounded-3xl shadow-2xl flex flex-col items-center gap-4 animate-bounce border-2 border-amber-300">
            <span className="text-7xl sm:text-9xl font-black text-[#f59e0b] font-mono drop-shadow-[0_4px_16px_rgba(245,158,11,0.5)]">
              {countdown === 0 ? 'GO!' : countdown}
            </span>
            <div className="text-xl sm:text-2xl font-black text-[#0f172a]">
              {t.lobby.countdownTitle}
            </div>
            <p className="text-[#64748b] text-sm font-semibold">
              {t.lobby.countdownSubtitle}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
