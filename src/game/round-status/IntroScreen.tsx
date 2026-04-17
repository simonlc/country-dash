import { GameStatusIntroContent } from '@/components/game-status/GameStatusIntroContent';

interface IntroScreenProps {
  storedDailyResult: {
    correctCount: number;
    totalCount: number;
  } | null;
}

export function IntroScreen({ storedDailyResult }: IntroScreenProps) {
  return <GameStatusIntroContent storedDailyResult={storedDailyResult} />;
}
