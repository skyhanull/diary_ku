const fortuneMessages = [
  '작은 기쁨을 놓치지 않을수록 오늘이 더 부드럽게 흘러가요.',
  '천천히 적어 내려간 한 줄이 마음을 예상보다 깊게 정리해줄 거예요.',
  '익숙한 하루 안에서도 반짝이는 장면을 발견할 가능성이 커요.',
  '마음을 서두르지 않으면 오늘의 답은 자연스럽게 따라와요.',
  '지나간 감정보다 지금 스치는 온도에 귀를 기울여보면 좋아요.',
  '조용한 순간에 남긴 기록이 오늘을 가장 선명하게 붙잡아줄 거예요.',
  '완벽한 문장보다 솔직한 한 문장이 오늘의 운을 더 좋게 만들어요.',
  '사소해 보여도 마음이 머문 장면은 오늘 꼭 기록할 가치가 있어요.'
] as const;

function hashDate(dateKey: string) {
  return Array.from(dateKey).reduce((acc, char) => acc + char.charCodeAt(0), 0);
}

export function getDailyFortune(dateKey: string) {
  const seed = hashDate(dateKey);
  const score = (seed % 51) + 50;
  const message = fortuneMessages[seed % fortuneMessages.length];

  return { score, message };
}
