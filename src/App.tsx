import React, { useState, useCallback } from 'react';
import { TitleScreen } from './components/TitleScreen';
import { HomeScreen } from './components/HomeScreen';
import { GameCanvas } from './components/GameCanvas';
import { OnlineLobbyView } from './components/OnlineLobbyView';
import { LevelSelectModal } from './components/LevelSelectModal';
import { GameMode, PlayerId } from './types';
import { socketService } from './services/socketService';
import { LanguageProvider } from './i18n/LanguageContext';

export default function App() {
  const [currentView, setCurrentView] = useState<'title' | 'home' | 'online-lobby' | 'game'>('title');
  const [gameMode, setGameMode] = useState<GameMode>('local');
  const [onlineRole, setOnlineRole] = useState<PlayerId>('xinyi');
  const [roomCode, setRoomCode] = useState<string>('');
  const [showHomeLevelSelect, setShowHomeLevelSelect] = useState<boolean>(false);

  // Persistent unlocked progress: Level 1 is always unlocked; max 20
  const [unlockedLevel, setUnlockedLevel] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('twinquest_unlocked_level');
      return saved ? Math.max(1, Math.min(20, parseInt(saved, 10))) : 1;
    } catch {
      return 1;
    }
  });

  // Persistent active/selected level (defaults to 1 or last played level up to unlockedLevel)
  const [selectedLevelId, setSelectedLevelId] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('twinquest_current_level');
      return saved ? Math.max(1, Math.min(20, parseInt(saved, 10))) : 1;
    } catch {
      return 1;
    }
  });

  const handleUpdateUnlockedLevel = useCallback((newUnlocked: number) => {
    setUnlockedLevel((prev) => {
      const updated = Math.max(prev, Math.min(20, newUnlocked));
      try {
        localStorage.setItem('twinquest_unlocked_level', updated.toString());
      } catch {
        // Ignore local storage errors
      }
      return updated;
    });
  }, []);

  const handleLevelChanged = useCallback((levelId: number) => {
    setSelectedLevelId(levelId);
    try {
      localStorage.setItem('twinquest_current_level', levelId.toString());
    } catch {
      // Ignore local storage errors
    }
  }, []);

  const handleStartLocalGame = () => {
    setGameMode('local');
    const startLevel = Math.min(selectedLevelId || 1, unlockedLevel);
    setSelectedLevelId(startLevel);
    setCurrentView('game');
  };

  const handleStartWithLevel = (levelId: number) => {
    setGameMode('local');
    setSelectedLevelId(levelId);
    try {
      localStorage.setItem('twinquest_current_level', levelId.toString());
    } catch {}
    setShowHomeLevelSelect(false);
    setCurrentView('game');
  };

  const handleOpenOnlineLobby = () => {
    setCurrentView('online-lobby');
  };

  const handleStartOnlineGame = (role: PlayerId, code: string) => {
    setGameMode('online');
    setOnlineRole(role);
    setRoomCode(code);
    setSelectedLevelId(1);
    setCurrentView('game');
  };

  const handleReturnHome = () => {
    if (gameMode === 'online') {
      socketService.leaveRoom();
    }
    setCurrentView('home');
  };

  return (
    <LanguageProvider>
      <div className="w-full h-full min-h-screen bg-[#fbf6ee] font-sans text-[#3a2d24]">
        {currentView === 'title' && (
          <TitleScreen onStartGame={() => setCurrentView('home')} />
        )}

        {currentView === 'home' && (
          <>
            <HomeScreen
              onStartLocalGame={handleStartLocalGame}
              onOpenOnlineLobby={handleOpenOnlineLobby}
              onOpenLevelSelect={() => setShowHomeLevelSelect(true)}
              onReturnToTitle={() => setCurrentView('title')}
              unlockedLevel={unlockedLevel}
            />
            {showHomeLevelSelect && (
              <LevelSelectModal
                currentLevelId={selectedLevelId}
                unlockedLevel={unlockedLevel}
                onSelectLevel={handleStartWithLevel}
                onClose={() => setShowHomeLevelSelect(false)}
              />
            )}
          </>
        )}

        {currentView === 'online-lobby' && (
          <OnlineLobbyView
            onBackToHome={() => setCurrentView('home')}
            onStartGame={handleStartOnlineGame}
          />
        )}

        {currentView === 'game' && (
          <GameCanvas
            onReturnHome={handleReturnHome}
            gameMode={gameMode}
            onlineRole={onlineRole}
            roomCode={roomCode}
            initialLevelId={selectedLevelId}
            unlockedLevel={unlockedLevel}
            onUpdateUnlockedLevel={handleUpdateUnlockedLevel}
            onLevelChanged={handleLevelChanged}
          />
        )}
      </div>
    </LanguageProvider>
  );
}
