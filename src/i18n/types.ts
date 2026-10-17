export type Language = 'zh' | 'en';

export interface LevelI18nMeta {
  id: number;
  title: string;
  name: string;
  desc: string;
  difficulty: string;
}

export interface TranslationDictionary {
  languageName: string;
  langZh: string;
  langEn: string;
  selectorLabel: string;

  home: {
    badge: string;
    caption: string;
    description: string;
    subLore: string;
    onlineCoop: string;
    onlineCoopSub: string;
    startLevel1: string;
    startLevel1Sub: string;
    levelSelect: string;
    progress: string;
    coopMechanicTitle: string;
    coopMechanicDesc: string;
    p1CardTitle: string;
    p1CardSub: string;
    p1ControlsLabel: string;
    p1Keys: { left: string; right: string; jump: string };
    p2CardTitle: string;
    p2CardSub: string;
    p2ControlsLabel: string;
    p2Keys: { left: string; right: string; jump: string };
    footerTip: string;
    soundOn: string;
    soundMuted: string;
    p1Badge: string;
    p2Badge: string;
    coopBadge: string;
  };

  lobby: {
    badge: string;
    title: string;
    subtitle: string;
    createRoom: string;
    createRoomSub: string;
    createRoomHint: string;
    joinRoom: string;
    joinRoomSub: string;
    joinRoomHint: string;
    backToHome: string;
    joinRoomTitle: string;
    joinRoomSubtitle: string;
    roomCodePlaceholder: string;
    backBtn: string;
    joinConfirmBtn: string;
    joinConfirmBtnSub: string;
    roomCreatedBadge: string;
    shareCodeTitle: string;
    roomCodeLabel: string;
    copyCodeBtn: string;
    copiedText: string;
    waitingTeammate: string;
    cancelAndReturn: string;
    roomCodeHeader: string;
    playersReadyHeader: string;
    p1HostBadge: string;
    p2TeammateBadge: string;
    youBadge: string;
    readyBadge: string;
    waitingReadyBadge: string;
    bothReadyTip: string;
    notReadyTip: string;
    leaveRoomBtn: string;
    readyBtnText: string;
    cancelReadyBtnText: string;
    countdownTitle: string;
    countdownSubtitle: string;
    errorRateLimit: string;
    errorInvalidCode: string;
    errorCreateFailed: string;
    errorJoinFailed: string;
    errorRoomNotFound: string;
    serverConnected: string;
    serverConnecting: string;
    serverUnconfigured: string;
    serverReconnecting: string;
  };

  network: {
    connected: string;
    connecting: string;
    reconnecting: string;
    disconnected: string;
    retry: string;
    teammateDisconnectedTitle: string;
    teammateDisconnectedSub: string;
    teammateDisconnectedDesc: string;
    stayInRoomBtn: string;
  };

  header: {
    levelSelectTip: string;
    selectLevelPrompt: string;
    restartBtn: string;
    restartTip: string;
    soundNormal: string;
    soundMuted: string;
    settingsTip: string;
    touchControlsTip: string;
    helpTip: string;
    homeTip: string;
    reachedExit: string;
    youBadge: string;
    lives: string;
  };

  levelSelect: {
    modalTitle: string;
    modalBadge: string;
    modalSubtitle: string;
    completedBadge: string;
    currentBadge: string;
    levelPrefix: string;
  };

  settings: {
    modalTitle: string;
    modalSubtitle: string;
    audioTitle: string;
    masterMute: string;
    masterMuteActive: string;
    masterMuteInactive: string;
    mutedStatus: string;
    unmutedStatus: string;
    bgmTitle: string;
    bgmDesc: string;
    bgmOn: string;
    bgmOff: string;
    sfxTitle: string;
    sfxDesc: string;
    sfxOn: string;
    sfxOff: string;
    volumeLabel: string;
    controlsTitle: string;
    touchControlsTitle: string;
    touchControlsDesc: string;
    enabled: string;
    disabled: string;
    restartLevelTitle: string;
    restartLevelDesc: string;
    restartNowBtn: string;
    saveAndReturnBtn: string;
    languageOptionTitle: string;
    languageOptionDesc: string;
  };

  help: {
    title: string;
    p1Header: string;
    p2Header: string;
    moveLeft: string;
    moveRight: string;
    jump: string;
    switchesRuleTitle: string;
    switchesRuleDesc: string;
    exitRuleTitle: string;
    exitRuleDesc: string;
    controlsFeelTitle: string;
    controlsFeelDesc: string;
    confirmBtn: string;
  };

  gameOver: {
    title: string;
    subtitlePrefix: string;
    subtitleSuffix: string;
    restartBtn: string;
    homeBtn: string;
  };

  levelComplete: {
    ultimateBadge: string;
    normalBadge: string;
    ultimateHeading: string;
    normalHeading: string;
    ultimateMsg: string;
    normalMsgPrefix: string;
    normalMsgSuffix: string;
    reachedExit: string;
    autoAdvancePrompt: string;
    nextLevelBtn: string;
    replayBtn: string;
    levelSelectBtn: string;
    homeBtn: string;
  };

  touch: {
    jump: string;
    controllingP1: string;
    controllingP2: string;
    ariaMoveLeft: string;
    ariaMoveRight: string;
    ariaJump: string;
  };

  inGame: {
    xinyiSwitch: string;
    jamesSwitch: string;
    switchActivated: string;
    switchReleased: string;
    coopGate: string;
    gateOpenDesc: string;
    gateHoldDesc: string;
    gateClosingSoon: string;
    hintBothSwitches: string;
    hintWaitJames: string;
    hintWaitXinyi: string;
    warningStayClose: string;
    playerDownTitle: string;
    respawnCheckpoint: string;
    respawnInitial: string;
    victoryUltimate: string;
    victoryNormal: string;
    victorySubUltimate: string;
    victorySubNormal: string;
  };

  levels: LevelI18nMeta[];
}
