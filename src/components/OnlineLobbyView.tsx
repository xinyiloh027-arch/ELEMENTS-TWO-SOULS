import React, { useState, useEffect } from 'react';
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

interface OnlineLobbyViewProps {
  onBackToHome: () => void;
  onStartGame: (role: PlayerId, roomCode: string) => void;
}

export const OnlineLobbyView: React.FC<OnlineLobbyViewProps> = ({
  onBackToHome,
  onStartGame,
}) => {
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

  // Initialize Socket connection and listeners
  useEffect(() => {
    socketService.connect();

    const unsubStatus = socketService.subscribeStatus((status) => {
      setConnectionStatus(status);
    });

    const unsubRoom = socketService.subscribeRoom((room) => {
      setCurrentRoom(room);
      const hasP1 = !!(room.players.xinyi || room.players.lumi);
      const hasP2 = !!(room.players.james || room.players.flare);
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
      if (currentRoom) {
        onStartGame(myRole, currentRoom.roomCode);
      }
    });

    return () => {
      unsubStatus();
      unsubRoom();
      unsubCountdown();
      unsubGameStart();
    };
  }, [currentRoom, myRole, onStartGame]);

  // Handle Create Room
  const handleCreateRoom = async () => {
    setIsLoading(true);
    setErrorMessage('');
    const res = await socketService.createRoom('Xinyi');
    setIsLoading(false);
    if (res.success && res.room && res.roomCode) {
      setMyRole((res.player?.id as PlayerId) || 'xinyi');
      setCurrentRoom(res.room);
      setSubView('waiting');
    } else {
      setErrorMessage(res.error || '创建房间失败，请重试');
    }
  };

  // Handle Join Room
  const handleJoinRoom = async () => {
    const code = roomCodeInput.trim();
    if (code.length !== 6) {
      setErrorMessage('请输入正确的 6 位数字房间代码');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');
    const res = await socketService.joinRoom(code, 'James');
    setIsLoading(false);
    if (res.success && res.room) {
      setMyRole((res.player?.id as PlayerId) || 'james');
      setCurrentRoom(res.room);
      setSubView('lobby');
    } else {
      setErrorMessage(res.error || '加入房间失败，请检查房间号');
    }
  };

  // Toggle Ready
  const handleToggleReady = async () => {
    const nextState = !isReady;
    setIsReady(nextState);
    await socketService.setReady(nextState);
  };

  // Copy Room Code to clipboard
  const handleCopyCode = () => {
    if (!currentRoom?.roomCode) return;
    navigator.clipboard.writeText(currentRoom.roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Leave room and return to multiplayer menu
  const handleLeaveRoom = () => {
    socketService.leaveRoom();
    setCurrentRoom(null);
    setIsReady(false);
    setCountdown(null);
    setErrorMessage('');
    setSubView('menu');
  };

  const p1 = currentRoom?.players.xinyi || currentRoom?.players.lumi;
  const p2 = currentRoom?.players.james || currentRoom?.players.flare;
  const bothReady = !!(p1?.isReady && p2?.isReady);

  return (
    <div className="relative min-h-screen w-full flex flex-col items-center justify-center p-4 sm:p-6 bg-gradient-to-b from-sky-100 via-sky-50 to-amber-50 text-slate-800 select-none overflow-hidden">
      {/* Background glowing decorations */}
      <div className="absolute top-10 left-1/3 w-80 h-80 rounded-full bg-sky-200/40 blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-1/3 w-80 h-80 rounded-full bg-orange-200/40 blur-3xl pointer-events-none" />

      {/* Network status pill in top-right */}
      <div className="absolute top-4 right-4 z-20">
        <div
          className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold backdrop-blur-md shadow-xs border ${
            connectionStatus === 'connected'
              ? 'bg-emerald-100/90 border-emerald-300 text-emerald-700'
              : connectionStatus === 'connecting'
              ? 'bg-sky-100/90 border-sky-300 text-sky-700'
              : 'bg-amber-100/90 border-amber-300 text-amber-700'
          }`}
        >
          <span
            className={`w-2 h-2 rounded-full ${
              connectionStatus === 'connected'
                ? 'bg-emerald-500 animate-pulse'
                : 'bg-amber-500 animate-ping'
            }`}
          />
          <span>
            {connectionStatus === 'connected'
              ? '服务器已连接'
              : connectionStatus === 'connecting'
              ? '连接服务器中...'
              : '正在重连...'}
          </span>
        </div>
      </div>

      {/* Main Card Container */}
      <div className="relative z-10 max-w-xl w-full flex flex-col items-center">
        {/* Error message banner */}
        {errorMessage && (
          <div className="w-full mb-4 px-4 py-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-sm font-semibold flex items-center justify-between shadow-sm animate-fade-in">
            <span>{errorMessage}</span>
            <button
              onClick={() => setErrorMessage('')}
              className="text-rose-500 hover:text-rose-700 font-bold ml-2 text-base cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {/* 1. Multiplayer Selection Menu */}
        {subView === 'menu' && (
          <div className="w-full bg-white/95 backdrop-blur-md p-6 sm:p-8 rounded-3xl border-2 border-sky-200/80 shadow-2xl space-y-6 text-center animate-fade-in">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-100 text-sky-700 text-xs font-bold">
                <Users className="w-3.5 h-3.5" />
                <span>双人在线联机 (Online Co-op)</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-black text-slate-800">
                双人冒险房间
              </h2>
              <p className="text-sm text-slate-500 font-medium">
                创建专属房间号，或输入好友分享的 6 位房间代码加入游戏
              </p>
            </div>

            {/* Two Main Choice Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              {/* Create Room Button (Min 56px height) */}
              <button
                id="btn-create-room"
                onClick={handleCreateRoom}
                disabled={isLoading}
                className="group flex flex-col items-center justify-center gap-2.5 p-6 rounded-2xl bg-gradient-to-b from-sky-50 to-sky-100 hover:from-sky-100 hover:to-sky-200 border-2 border-sky-300 hover:border-sky-500 shadow-md hover:shadow-lg transition-all duration-200 active:scale-95 cursor-pointer disabled:opacity-50"
              >
                <div className="w-14 h-14 rounded-2xl bg-sky-500 text-white flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
                  <PlusCircle className="w-7 h-7" />
                </div>
                <div className="text-center">
                  <span className="text-lg font-black text-sky-700 block">
                    创建房间
                  </span>
                  <span className="text-xs font-medium text-slate-500">
                    成为主机并扮演 Xinyi 🔵
                  </span>
                </div>
              </button>

              {/* Join Room Button (Min 56px height) */}
              <button
                id="btn-join-room-nav"
                onClick={() => {
                  setErrorMessage('');
                  setSubView('join');
                }}
                disabled={isLoading}
                className="group flex flex-col items-center justify-center gap-2.5 p-6 rounded-2xl bg-gradient-to-b from-orange-50 to-orange-100 hover:from-orange-100 hover:to-orange-200 border-2 border-orange-300 hover:border-orange-500 shadow-md hover:shadow-lg transition-all duration-200 active:scale-95 cursor-pointer disabled:opacity-50"
              >
                <div className="w-14 h-14 rounded-2xl bg-orange-500 text-white flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
                  <LogIn className="w-7 h-7" />
                </div>
                <div className="text-center">
                  <span className="text-lg font-black text-orange-700 block">
                    加入房间
                  </span>
                  <span className="text-xs font-medium text-slate-500">
                    输入代码扮演 James 🟠
                  </span>
                </div>
              </button>
            </div>

            {/* Back to Home Button */}
            <div className="pt-2">
              <button
                id="btn-back-home"
                onClick={onBackToHome}
                className="inline-flex items-center justify-center gap-2 h-14 px-8 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-base transition-all active:scale-95 cursor-pointer"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>返回主页</span>
              </button>
            </div>
          </div>
        )}

        {/* 2. Join Room Input View */}
        {subView === 'join' && (
          <div className="w-full bg-white/95 backdrop-blur-md p-6 sm:p-8 rounded-3xl border-2 border-orange-200/80 shadow-2xl space-y-6 text-center animate-fade-in">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-100 text-orange-700 text-xs font-bold">
                <LogIn className="w-3.5 h-3.5" />
                <span>加入好友的房间</span>
              </div>
              <h2 className="text-3xl font-black text-slate-800">输入 6 位房间代码</h2>
              <p className="text-sm text-slate-500 font-medium">
                向好友获取 6 位数字代码并填入下方
              </p>
            </div>

            {/* 6-Digit Code Input (Large typography) */}
            <div className="space-y-3">
              <input
                id="input-room-code"
                type="text"
                maxLength={6}
                value={roomCodeInput}
                onChange={(e) => setRoomCodeInput(e.target.value.replace(/\D/g, ''))}
                placeholder="6 位数字代码"
                className="w-full max-w-xs mx-auto h-16 text-center text-3xl font-mono font-black tracking-widest rounded-2xl border-2 border-orange-300 focus:border-orange-500 focus:ring-4 focus:ring-orange-200 bg-orange-50/50 text-slate-800 placeholder:text-slate-300 transition-all outline-none"
              />
            </div>

            {/* Action Buttons: Join and Cancel */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                id="btn-back-to-menu"
                onClick={() => setSubView('menu')}
                className="w-full sm:w-auto h-14 px-8 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-base transition-all active:scale-95 cursor-pointer"
              >
                返回
              </button>

              <button
                id="btn-confirm-join"
                onClick={handleJoinRoom}
                disabled={roomCodeInput.length !== 6 || isLoading}
                className="w-full sm:w-auto min-w-[200px] h-14 px-8 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-white font-black text-lg shadow-lg shadow-orange-500/30 transition-all active:scale-95 cursor-pointer disabled:opacity-40 disabled:pointer-events-none flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <LogIn className="w-5 h-5" />
                )}
                <span>立即加入</span>
              </button>
            </div>
          </div>
        )}

        {/* 3. Waiting for Teammate View (Host waiting for Player 2) */}
        {subView === 'waiting' && currentRoom && (
          <div className="w-full bg-white/95 backdrop-blur-md p-6 sm:p-8 rounded-3xl border-2 border-sky-200/80 shadow-2xl space-y-6 text-center animate-fade-in">
            <div className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-sky-600 bg-sky-100 px-3 py-1 rounded-full">
                房间已创建
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-800 pt-2">
                分享房间代码给好友
              </h2>
            </div>

            {/* Big Room Code Display with Copy Button */}
            <div className="p-6 rounded-2xl bg-gradient-to-b from-sky-50 to-white border-2 border-sky-300 shadow-inner flex flex-col items-center gap-3">
              <span className="text-xs font-bold text-slate-500">房间代码 (ROOM CODE)</span>
              <div className="text-4xl sm:text-5xl font-mono font-black tracking-widest text-sky-600">
                {currentRoom.roomCode}
              </div>

              {/* Copy Button (Min 48px) */}
              <button
                id="btn-copy-code"
                onClick={handleCopyCode}
                className="inline-flex items-center gap-2 h-12 px-6 rounded-xl bg-sky-500 hover:bg-sky-600 active:scale-95 text-white font-bold text-sm shadow-md transition-all cursor-pointer"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? '已复制到剪贴板！' : '复制房间代码'}</span>
              </button>
            </div>

            {/* Waiting pulse indicator */}
            <div className="flex items-center justify-center gap-3 py-2 text-slate-600 font-medium">
              <Loader2 className="w-5 h-5 text-sky-500 animate-spin" />
              <span className="text-base font-bold animate-pulse text-sky-600">
                Waiting for teammate… (等待队友加入)
              </span>
            </div>

            {/* Leave Room Button */}
            <div className="pt-2">
              <button
                id="btn-leave-waiting-room"
                onClick={handleLeaveRoom}
                className="h-14 px-8 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-base transition-all active:scale-95 cursor-pointer"
              >
                取消并返回
              </button>
            </div>
          </div>
        )}

        {/* 4. Room Lobby View (Both players present) */}
        {subView === 'lobby' && currentRoom && (
          <div className="w-full bg-white/95 backdrop-blur-md p-6 sm:p-8 rounded-3xl border-2 border-sky-300 shadow-2xl space-y-6 text-center animate-fade-in">
            {/* Header: Room Code Badge */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-400">房间号:</span>
                <span className="text-xl font-mono font-black text-slate-800 tracking-wider">
                  #{currentRoom.roomCode}
                </span>
                <button
                  onClick={handleCopyCode}
                  className="p-1 text-slate-400 hover:text-sky-600 transition-colors cursor-pointer"
                  title="复制房间号"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>

              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold">
                <Users className="w-3.5 h-3.5" />
                <span>2/2 玩家就绪中</span>
              </div>
            </div>

            {/* Two Players Status Cards */}
            <div className="grid grid-cols-2 gap-4">
              {/* Player 1 Card: Xinyi */}
              <div
                className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all ${
                  p1?.isReady
                    ? 'bg-sky-50/90 border-sky-500 shadow-md ring-2 ring-sky-300/60'
                    : 'bg-white border-slate-200 shadow-sm'
                }`}
              >
                <div className="relative w-16 h-16 flex items-center justify-center">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-sky-500 to-sky-400 shadow-md flex items-center justify-center border-2 border-sky-600">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-slate-900" />
                      <div className="w-2 h-2 rounded-full bg-slate-900" />
                    </div>
                  </div>
                  {(myRole === 'xinyi' || myRole === 'lumi') && (
                    <span className="absolute -bottom-1 px-2 py-0.2 rounded-full bg-sky-600 text-[10px] font-black text-white">
                      YOU
                    </span>
                  )}
                </div>

                <div className="text-center">
                  <div className="text-base font-black text-sky-600">🔵 Xinyi (P1)</div>
                  <div className="text-xs text-slate-400">房主</div>
                </div>

                {/* Ready Status Badge */}
                <div
                  className={`mt-1 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${
                    p1?.isReady
                      ? 'bg-emerald-500 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-400'
                  }`}
                >
                  {p1?.isReady ? (
                    <>
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                      <span>已准备 (READY)</span>
                    </>
                  ) : (
                    <span>等待准备中...</span>
                  )}
                </div>
              </div>

              {/* Player 2 Card: James */}
              <div
                className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all ${
                  p2?.isReady
                    ? 'bg-orange-50/90 border-orange-500 shadow-md ring-2 ring-orange-300/60'
                    : 'bg-white border-slate-200 shadow-sm'
                }`}
              >
                <div className="relative w-16 h-16 flex items-center justify-center">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-orange-500 to-amber-400 shadow-md flex items-center justify-center border-2 border-orange-600">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-slate-900" />
                      <div className="w-2 h-2 rounded-full bg-slate-900" />
                    </div>
                  </div>
                  {(myRole === 'james' || myRole === 'flare') && (
                    <span className="absolute -bottom-1 px-2 py-0.2 rounded-full bg-orange-600 text-[10px] font-black text-white">
                      YOU
                    </span>
                  )}
                </div>

                <div className="text-center">
                  <div className="text-base font-black text-orange-600">🟠 James (P2)</div>
                  <div className="text-xs text-slate-400">队友</div>
                </div>

                {/* Ready Status Badge */}
                <div
                  className={`mt-1 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${
                    p2?.isReady
                      ? 'bg-emerald-500 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-400'
                  }`}
                >
                  {p2?.isReady ? (
                    <>
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                      <span>已准备 (READY)</span>
                    </>
                  ) : (
                    <span>等待准备中...</span>
                  )}
                </div>
              </div>
            </div>

            {/* Ready Status Tip */}
            <div className="text-xs font-semibold text-slate-500">
              {bothReady
                ? '两位冒险家均已准备就绪！'
                : '请点击下方【READY】按钮，双方均准备后将自动倒计时开始游戏'}
            </div>

            {/* Action: Giant READY Button (Min 56px height) */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                id="btn-leave-lobby"
                onClick={handleLeaveRoom}
                className="w-full sm:w-auto h-16 px-8 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-base transition-all active:scale-95 cursor-pointer"
              >
                离开房间
              </button>

              <button
                id="btn-toggle-ready"
                onClick={handleToggleReady}
                className={`w-full sm:w-auto min-w-[240px] h-16 px-10 rounded-2xl font-black text-xl shadow-xl transition-all duration-200 active:scale-95 cursor-pointer border-2 flex items-center justify-center gap-3 ${
                  isReady
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white border-white/50 shadow-emerald-500/30'
                    : 'bg-gradient-to-r from-sky-500 via-indigo-500 to-orange-500 hover:from-sky-400 hover:to-orange-400 text-white border-white/40 shadow-sky-500/30'
                }`}
              >
                {isReady ? (
                  <>
                    <Check className="w-6 h-6 stroke-[3]" />
                    <span>已准备 (取消)</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-6 h-6 fill-white" />
                    <span>READY (准备就绪)</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 5. Giant Countdown Overlay (3 -> 2 -> 1 -> START) */}
      {countdown !== null && countdown >= 0 && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-950/80 backdrop-blur-md animate-fade-in select-none">
          <div className="text-center space-y-4">
            <span className="text-sm sm:text-base font-bold uppercase tracking-widest text-sky-400">
              两名玩家均已就绪
            </span>

            <div className="text-8xl sm:text-9xl font-black text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-amber-300 to-orange-500 animate-bounce drop-shadow-2xl">
              {countdown === 0 ? 'START!' : countdown}
            </div>

            <p className="text-slate-300 text-sm font-semibold">
              即将进入 Level 01 · 携手配合！
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
