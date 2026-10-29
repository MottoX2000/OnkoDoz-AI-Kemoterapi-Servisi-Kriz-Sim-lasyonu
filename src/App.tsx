import React, { useState, useEffect } from 'react';
import {
  DecisionChoice,
  GameStateId,
  GoalType,
  LevelType,
  PlayerProfile,
  RoleType,
  STAGES,
} from './data/simulationData';
import { OnboardingScreen } from './components/OnboardingScreen';
import { CrisisStageScreen } from './components/CrisisStageScreen';
import { EndingScreen } from './components/EndingScreen';
import { EvalModal } from './components/EvalModal';

export default function App() {
  const [gameState, setGameState] = useState<GameStateId>('S0_Giris_Profil');

  const [profile, setProfile] = useState<PlayerProfile>({
    level: 'Deneyimliyim',
    role: 'Backend',
    goal: 'Mimari Dayanıklılık',
  });

  const [decisions, setDecisions] = useState<DecisionChoice[]>([]);
  const [selectedOption, setSelectedOption] = useState<DecisionChoice | null>(
    null
  );
  const [timedOut, setTimedOut] = useState(false);
  const [timer, setTimer] = useState<number>(60);
  const [isTutorOpen, setIsTutorOpen] = useState<boolean>(false);
  const [isEvalModalOpen, setIsEvalModalOpen] = useState<boolean>(false);

  const isDecisionStage =
    gameState === 'S1_Karar1_Mimari' ||
    gameState === 'S2_Karar2_Test' ||
    gameState === 'S3_Karar3_KVKK';

  // 60s Countdown Timer for 'Deneyimliyim' mode (pauses when Tutor is open or decision is made)
  useEffect(() => {
    if (!isDecisionStage) return;
    if (profile.level !== 'Deneyimliyim') return;
    if (selectedOption !== null) return;
    if (isTutorOpen) return;

    if (timer <= 0) {
      // Spec 4.1: TIMEOUT -> Automatically selects B (risky/faulty choice)
      setTimedOut(true);
      setSelectedOption('B');
      return;
    }

    const intervalId = window.setInterval(() => {
      setTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [isDecisionStage, profile.level, selectedOption, isTutorOpen, timer]);

  const handleStartGame = () => {
    setDecisions([]);
    setSelectedOption(null);
    setTimedOut(false);
    setTimer(60);
    setIsTutorOpen(false);
    setGameState('S1_Karar1_Mimari');
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  };

  const handleSelectOption = (choice: DecisionChoice) => {
    if (selectedOption !== null) return;
    setTimedOut(false);
    setSelectedOption(choice);
  };

  const handleNextStage = () => {
    const choiceToRecord: DecisionChoice = selectedOption ?? 'B';
    const nextDecisions = [...decisions, choiceToRecord];
    setDecisions(nextDecisions);
    setSelectedOption(null);
    setTimedOut(false);
    setTimer(60);
    setIsTutorOpen(false);

    if (gameState === 'S1_Karar1_Mimari') {
      setGameState('S2_Karar2_Test');
    } else if (gameState === 'S2_Karar2_Test') {
      setGameState('S3_Karar3_KVKK');
    } else if (gameState === 'S3_Karar3_KVKK') {
      const isAllA =
        nextDecisions.length === 3 &&
        nextDecisions.every((d) => d === 'A');
      setGameState(isAllA ? 'SON_A_IYI' : 'SON_B_KOTU');
    }
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  };

  const handleRestartGame = () => {
    setDecisions([]);
    setSelectedOption(null);
    setTimedOut(false);
    setTimer(60);
    setIsTutorOpen(false);
    setGameState('S0_Giris_Profil');
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  };

  const handleChangeLevel = (level: LevelType) => {
    setProfile((prev) => ({ ...prev, level }));
  };

  const handleChangeRole = (role: RoleType) => {
    setProfile((prev) => ({ ...prev, role }));
  };

  const handleChangeGoal = (goal: GoalType) => {
    setProfile((prev) => ({ ...prev, goal }));
  };

  const finalDecisionsTuple: [DecisionChoice, DecisionChoice, DecisionChoice] = [
    decisions[0] || 'A',
    decisions[1] || 'A',
    decisions[2] || 'A',
  ];

  return (
    <div className="min-h-dvh w-full bg-[#E3DBAE] flex justify-center items-start md:py-6">
      {/* Mobile-First Retro 70s Clinical Command Console Container */}
      <main className="w-full max-w-[440px] min-h-dvh md:min-h-[840px] bg-[#FFF9E9] md:rounded-[20px] md:border-[3px] md:border-[#2B1829] md:shadow-[8px_8px_0px_#2B1829] overflow-hidden flex flex-col">
        {gameState === 'S0_Giris_Profil' && (
          <OnboardingScreen
            profile={profile}
            onChangeLevel={handleChangeLevel}
            onChangeRole={handleChangeRole}
            onChangeGoal={handleChangeGoal}
            onStartGame={handleStartGame}
            onOpenEvalModal={() => setIsEvalModalOpen(true)}
          />
        )}

        {(gameState === 'S1_Karar1_Mimari' ||
          gameState === 'S2_Karar2_Test' ||
          gameState === 'S3_Karar3_KVKK') && (
          <CrisisStageScreen
            stage={STAGES[gameState]}
            profile={profile}
            previousChoice={
              decisions.length > 0 ? decisions[decisions.length - 1] : null
            }
            selectedOption={selectedOption}
            timedOut={timedOut}
            timer={timer}
            isTutorOpen={isTutorOpen}
            onToggleTutor={() => setIsTutorOpen((prev) => !prev)}
            onForceOpenTutor={() => setIsTutorOpen(true)}
            onSelectOption={handleSelectOption}
            onNextStage={handleNextStage}
            onRestart={handleRestartGame}
          />
        )}

        {(gameState === 'SON_A_IYI' || gameState === 'SON_B_KOTU') && (
          <EndingScreen
            profile={profile}
            decisions={finalDecisionsTuple}
            onRestart={handleRestartGame}
          />
        )}
      </main>

      <EvalModal
        isOpen={isEvalModalOpen}
        profile={profile}
        onClose={() => setIsEvalModalOpen(false)}
      />
    </div>
  );
}
