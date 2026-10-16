import React, { useEffect, useRef, useState, useCallback } from 'react';
import { GameEngine } from '../game/engine';
import { ConnectionStatus, GameMode, PlayerId, PlayerState } from '../types';
import { GameHeader } from './GameHeader';
import { LevelCompleteModal } from './LevelCompleteModal';
import { LevelSelectModal } from './LevelSelectModal';
import { TouchControls } from './TouchControls';
import { HelpModal } from './HelpModal';
import { SettingsModal } from './SettingsModal';
import { GameOverModal } from './GameOverModal';
import { NetworkStatusBanner } from './NetworkStatusBanner';
import { socketService } from '../services/socketService';
import { LEVEL_METADATA_LIST } from '../levels';

interface GameCanvasProps {
  onReturnHome: () => void;
  gameMode?: GameMode;
  onlineRole?: PlayerId;
  roomCode?: string;
  initialLevelId?: number;
  unlockedLevel?: number;
  onUpdateUnlockedLevel?: (level: number) => void;
  onLevelChanged?: (levelId: number) => void;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({
  onReturnHome,
  gameMode = 'local' as GameMode,
  onlineRole = 'xinyi' as PlayerId,
  roomCode = '',
  initialLevelId = 1,
  unlockedLevel = 1,
  onUpdateUnlockedLevel,
  onLevelChanged,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<GameEngine | null>(null);

  const [currentLevelId, setCurrentLevelId] = useState<number>(initialLevelId);
  const currentLevelIdRef = useRef<number>(initialLevelId);
  currentLevelIdRef.current = currentLevelId;

  const onUpdateUnlockedLevelRef = useRef(onUpdateUnlockedLevel);
  onUpdateUnlockedLevelRef.current = onUpdateUnlockedLevel;

  const onLevelChangedRef = useRef(onLevelChanged);
  onLevelChangedRef.current = onLevelChanged;

  const [xinyiState, setXinyiState] = useState<PlayerState | null>(null);
  const [jamesState, setJamesState] = useState<PlayerState | null>(null);
  const [isLevelComplete, setIsLevelComplete] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [lives, setLives] = useState(3);
  const [gemsCollected, setGemsCollected] = useState(0);
  const [totalGems, setTotalGems] = useState(0);
  const [autoAdvanceSeconds, setAutoAdvanceSeconds] = useState<number | null>(null);
  const autoAdvanceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const [showLevelSelect, setShowLevelSelect] = useState(false);
  const [showTouchControls, setShowTouchControls] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Online network states
  const [networkStatus, setNetworkStatus] = useState<ConnectionStatus>(
    socketService.getStatus()
  );
  const [pingMs, setPingMs] = useState<number | null>(null);
  const [teammateDisconnected, setTeammateDisconnected] = useState(false);
  const [teammateDisconnectMsg, setTeammateDisconnectMsg] = useState('');

  // Clear any active auto-advance timer
  const clearAutoAdvance = useCallback(() => {
    if (autoAdvanceTimerRef.current) {
      clearTimeout(autoAdvanceTimerRef.current);
      autoAdvanceTimerRef.current = null;
    }
    setAutoAdvanceSeconds(null);
  }, []);

  const handleSelectLevel = useCallback(
    (levelId: number) => {
      clearAutoAdvance();
      if (engineRef.current) {
        engineRef.current.loadLevel(levelId);
      }
      setCurrentLevelId(levelId);
      currentLevelIdRef.current = levelId;
      setIsLevelComplete(false);
      setIsGameOver(false);
      setShowLevelSelect(false);
      onLevelChangedRef.current?.(levelId);

      if (gameMode === 'online' && roomCode) {
        socketService.sendChangeLevel(roomCode, levelId);
      }
    },
    [clearAutoAdvance, gameMode, roomCode]
  );

  const handleNextLevel = useCallback(() => {
    clearAutoAdvance();
    const nextId = currentLevelIdRef.current + 1;
    if (nextId <= 20) {
      handleSelectLevel(nextId);
    }
  }, [clearAutoAdvance, handleSelectLevel]);

  const handleRestart = useCallback(() => {
    clearAutoAdvance();
    if (engineRef.current) {
      engineRef.current.resetLevel();
    }
    setIsLevelComplete(false);
    setIsGameOver(false);

    if (gameMode === 'online' && roomCode) {
      socketService.sendRestartLevel(roomCode);
    }
  }, [clearAutoAdvance, gameMode, roomCode]);

  // Detect touch screen device on mount to enable touch controls by default if mobile
  useEffect(() => {
    const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    if (isTouch) {
      setShowTouchControls(true);
    }
  }, []);

  // Initialize GameEngine and Online Sync Listeners
  // Note: Only depends on [gameMode, onlineRole, roomCode] to prevent unneeded engine teardown
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Set fixed coordinate dimensions for crisp 16:9 2D game rendering
    canvas.width = 1280;
    canvas.height = 720;

    const startLevel = currentLevelIdRef.current || initialLevelId || 1;

    const engine = new GameEngine(
      canvas,
      {
        onStateUpdate: (state) => {
          setXinyiState(state.xinyi || state.lumi);
          setJamesState(state.james || state.flare);
          setIsLevelComplete(state.isLevelComplete);
          if (typeof state.lives === 'number') setLives(state.lives);
          if (typeof state.isGameOver === 'boolean') setIsGameOver(state.isGameOver);
          if (typeof state.gemsCollected === 'number') setGemsCollected(state.gemsCollected);
          if (typeof state.totalGems === 'number') setTotalGems(state.totalGems);
          if (state.currentLevelId && state.currentLevelId !== currentLevelIdRef.current) {
            setCurrentLevelId(state.currentLevelId);
            currentLevelIdRef.current = state.currentLevelId;
          }
        },
        onGameOver: () => {
          clearAutoAdvance();
          setIsGameOver(true);
        },
        onLevelComplete: (levelId) => {
          setIsLevelComplete(true);
          const nextLevelId = levelId + 1;
          if (onUpdateUnlockedLevelRef.current && nextLevelId <= 20) {
            onUpdateUnlockedLevelRef.current(nextLevelId);
          }

          // Auto-advance rule: if next level exists (levelId < 20), countdown 2.5s and auto-advance
          if (levelId < 20) {
            clearAutoAdvance();
            setAutoAdvanceSeconds(3);

            const timerStep1 = setTimeout(() => {
              setAutoAdvanceSeconds(2);
            }, 800);

            const timerStep2 = setTimeout(() => {
              setAutoAdvanceSeconds(1);
            }, 1600);

            autoAdvanceTimerRef.current = setTimeout(() => {
              handleNextLevel();
            }, 2500);

            // Keep reference so cleanup can cancel all steps
            return () => {
              clearTimeout(timerStep1);
              clearTimeout(timerStep2);
              clearAutoAdvance();
            };
          }
        },
        onLevelChanged: (levelId) => {
          setCurrentLevelId(levelId);
          currentLevelIdRef.current = levelId;
          setIsLevelComplete(false);
          onLevelChangedRef.current?.(levelId);
        },
        onLocalPlayerSync: (payload) => {
          if (gameMode === 'online') {
            socketService.sendPlayerSync(payload);
          }
        },
        onLocalWorldSync: (payload) => {
          if (gameMode === 'online') {
            socketService.sendWorldSync(payload);
          }
        },
        onLocalPlayerDeath: (payload) => {
          if (gameMode === 'online') {
            socketService.sendDeathSync(payload);
          }
        },
        onLocalGemCollected: (payload) => {
          if (gameMode === 'online') {
            socketService.sendGemSync(payload);
          }
        },
        onLocalCheckpointActivated: (payload) => {
          if (gameMode === 'online') {
            socketService.sendCheckpointSync(payload);
          }
        },
        onLocalButtonSync: (payload) => {
          if (gameMode === 'online') {
            socketService.sendButtonSync(payload);
          }
        },
        onLocalGateSync: (payload) => {
          if (gameMode === 'online') {
            socketService.sendGateSync(payload);
          }
        },
        onLocalLevelComplete: (levelId) => {
          if (gameMode === 'online' && roomCode) {
            socketService.sendLevelComplete(roomCode);
          }
        },
      },
      {
        mode: gameMode,
        onlineRole,
        roomCode,
        initialLevelId: startLevel,
      }
    );

    engineRef.current = engine;
    engine.start();

    // In Online Mode: Subscribe to remote incoming events
    let unsubPlayerSync: (() => void) | null = null;
    let unsubWorldSync: (() => void) | null = null;
    let unsubDeathSync: (() => void) | null = null;
    let unsubGemSync: (() => void) | null = null;
    let unsubCheckpointSync: (() => void) | null = null;
    let unsubPing: (() => void) | null = null;
    let unsubButtonSync: (() => void) | null = null;
    let unsubGateSync: (() => void) | null = null;
    let unsubRestart: (() => void) | null = null;
    let unsubLevelComplete: (() => void) | null = null;
    let unsubChangeLevel: (() => void) | null = null;
    let unsubTeammateDisconnect: (() => void) | null = null;
    let unsubStatus: (() => void) | null = null;

    if (gameMode === 'online') {
      unsubStatus = socketService.subscribeStatus((status) => {
        setNetworkStatus(status);
      });

      unsubPing = socketService.subscribePing((ping) => {
        setPingMs(ping);
      });

      unsubPlayerSync = socketService.subscribePlayerSync((payload) => {
        if (engineRef.current) {
          engineRef.current.applyRemotePlayerSync(payload);
        }
      });

      unsubWorldSync = socketService.subscribeWorldSync((payload) => {
        if (engineRef.current) {
          engineRef.current.applyRemoteWorldSync(payload);
        }
      });

      unsubDeathSync = socketService.subscribeDeathSync((payload) => {
        if (engineRef.current) {
          engineRef.current.applyRemotePlayerDeath(payload);
        }
      });

      unsubGemSync = socketService.subscribeGemSync((payload) => {
        if (engineRef.current) {
          engineRef.current.applyRemoteGemSync(payload);
        }
      });

      unsubCheckpointSync = socketService.subscribeCheckpointSync((payload) => {
        if (engineRef.current) {
          engineRef.current.applyRemoteCheckpointSync(payload);
        }
      });

      unsubButtonSync = socketService.subscribeButtonSync((payload) => {
        if (engineRef.current) {
          engineRef.current.applyRemoteButtonSync(payload);
        }
      });

      unsubGateSync = socketService.subscribeGateSync((payload) => {
        if (engineRef.current) {
          engineRef.current.applyRemoteGateSync(payload);
        }
      });

      unsubRestart = socketService.subscribeRestart(() => {
        clearAutoAdvance();
        if (engineRef.current) {
          engineRef.current.resetLevel();
        }
        setIsLevelComplete(false);
      });

      unsubLevelComplete = socketService.subscribeLevelComplete(() => {
        setIsLevelComplete(true);
      });

      unsubChangeLevel = socketService.subscribeChangeLevel((data) => {
        clearAutoAdvance();
        if (engineRef.current) {
          engineRef.current.loadLevel(data.levelId);
        }
        setCurrentLevelId(data.levelId);
        currentLevelIdRef.current = data.levelId;
        setIsLevelComplete(false);
        onLevelChangedRef.current?.(data.levelId);
      });

      unsubTeammateDisconnect = socketService.subscribeTeammateDisconnect((data) => {
        setTeammateDisconnected(true);
        setTeammateDisconnectMsg(data.message || '对方连接已中断 (Teammate Disconnected)');
      });
    }

    return () => {
      clearAutoAdvance();
      engine.stop();
      engineRef.current = null;
      if (unsubPlayerSync) unsubPlayerSync();
      if (unsubWorldSync) unsubWorldSync();
      if (unsubDeathSync) unsubDeathSync();
      if (unsubGemSync) unsubGemSync();
      if (unsubCheckpointSync) unsubCheckpointSync();
      if (unsubPing) unsubPing();
      if (unsubButtonSync) unsubButtonSync();
      if (unsubGateSync) unsubGateSync();
      if (unsubRestart) unsubRestart();
      if (unsubLevelComplete) unsubLevelComplete();
      if (unsubChangeLevel) unsubChangeLevel();
      if (unsubTeammateDisconnect) unsubTeammateDisconnect();
      if (unsubStatus) unsubStatus();
    };
  }, [gameMode, onlineRole, roomCode, handleNextLevel, clearAutoAdvance]);

  const handleTouchInput = useCallback(
    (player: PlayerId, key: 'left' | 'right' | 'jump', isPressed: boolean) => {
      if (engineRef.current) {
        // In online mode, direct all inputs to assigned player
        const targetPlayer = gameMode === 'online' ? onlineRole : player;
        engineRef.current.setPlayerInput(targetPlayer, key, isPressed);
      }
    },
    [gameMode, onlineRole]
  );

  const currentMeta = LEVEL_METADATA_LIST.find((l) => l.id === currentLevelId);
  const levelTitle = currentMeta ? currentMeta.title : `LEVEL ${currentLevelId < 10 ? '0' + currentLevelId : currentLevelId}`;

  return (
    <div className="relative w-screen h-screen bg-slate-950 flex flex-col overflow-hidden select-none">
      {/* Online Network Health Banner */}
      {gameMode === 'online' && (
        <NetworkStatusBanner
          status={networkStatus}
          pingMs={pingMs}
          teammateDisconnected={teammateDisconnected}
          teammateMessage={teammateDisconnectMsg}
          onDismissTeammateAlert={() => setTeammateDisconnected(false)}
          onReconnect={() => socketService.connect()}
        />
      )}

      {/* Top UI Bar with dynamic level title & Level Select modal trigger */}
      <GameHeader
        xinyi={xinyiState}
        james={jamesState}
        lumi={xinyiState}
        flare={jamesState}
        levelTitle={levelTitle}
        gameMode={gameMode}
        onlineRole={onlineRole}
        roomCode={roomCode}
        lives={lives}
        gemsCollected={gemsCollected}
        totalGems={totalGems}
        onRestart={handleRestart}
        onHome={onReturnHome}
        onOpenLevelSelect={() => setShowLevelSelect(true)}
        showTouchControls={showTouchControls}
        onToggleTouchControls={() => setShowTouchControls((prev) => !prev)}
        onToggleHelp={() => setShowHelp(true)}
        onOpenSettings={() => setShowSettings(true)}
      />

      {/* Main Game Stage - Centered & Responsive 16:9 Canvas */}
      <main className="relative flex-1 w-full h-full flex items-center justify-center p-1 sm:p-4 bg-radial from-slate-900 to-slate-950 overflow-hidden">
        <div className="relative w-full h-full max-w-[1280px] max-h-[720px] aspect-[16/9] flex items-center justify-center shadow-2xl rounded-2xl overflow-hidden border border-slate-800 bg-slate-900">
          <canvas
            ref={canvasRef}
            className="w-full h-full object-contain block bg-sky-200"
            style={{ imageRendering: 'pixelated' }}
          />

          {/* Touch Controls Overlay if enabled */}
          {showTouchControls && (
            <TouchControls
              onInput={handleTouchInput}
              gameMode={gameMode}
              assignedPlayer={onlineRole}
            />
          )}
        </div>
      </main>

      {/* Level Complete Celebration Modal */}
      {isLevelComplete && (
        <LevelCompleteModal
          currentLevelId={currentLevelId}
          hasNextLevel={currentLevelId < 20}
          autoAdvanceSeconds={autoAdvanceSeconds}
          onNextLevel={handleNextLevel}
          onSelectLevel={() => setShowLevelSelect(true)}
          onRestart={handleRestart}
          onHome={onReturnHome}
        />
      )}

      {/* Game Over Modal */}
      {isGameOver && (
        <GameOverModal
          currentLevelId={currentLevelId}
          onRestart={handleRestart}
          onHome={onReturnHome}
        />
      )}

      {/* Level Select Modal */}
      {showLevelSelect && (
        <LevelSelectModal
          currentLevelId={currentLevelId}
          unlockedLevel={unlockedLevel}
          onSelectLevel={handleSelectLevel}
          onClose={() => setShowLevelSelect(false)}
        />
      )}

      {/* Settings Modal */}
      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        showTouchControls={showTouchControls}
        onToggleTouchControls={() => setShowTouchControls((prev) => !prev)}
        onRestart={handleRestart}
      />

      {/* Help / Controls modal */}
      {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}
    </div>
  );
};
