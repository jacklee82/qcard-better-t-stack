/**
 * Multiple Answer Shuffler Utility
 * 다중 정답 문제의 선택지를 무작위로 섞고 정답 인덱스들을 조정하는 유틸리티
 */

import { Question } from "@my-better-t-app/db";

export interface ShuffledMultipleAnswerQuestion {
  id: string;
  category: string;
  question: string;
  options: string[];
  correctAnswers: number[];           // 셔플된 정답 인덱스 배열
  originalCorrectAnswers: number[];   // 원본 정답 인덱스 배열
  questionType: 'single' | 'multiple';
  explanation: string;
  code?: string;
  difficulty: string;
  createdAt: Date;
}

/**
 * 다중 정답 문제를 셔플합니다
 * @param question 원본 문제 객체
 * @returns 셔플된 문제 객체
 */
export function shuffleMultipleAnswerQuestion(question: Question): ShuffledMultipleAnswerQuestion {
  const options = [...question.options];
  let correctAnswers = question.correctAnswers ? [...question.correctAnswers] : [question.correctAnswer];
  
  // Fisher-Yates 셔플 알고리즘
  for (let i = options.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    
    // 선택지 교환
    [options[i], options[j]] = [options[j], options[i]];
    
    // 모든 정답 인덱스 업데이트
    correctAnswers = correctAnswers.map(answer => {
      if (answer === i) return j;
      if (answer === j) return i;
      return answer;
    });
  }
  
  return {
    ...question,
    options,
    correctAnswers,
    originalCorrectAnswers: question.correctAnswers || [question.correctAnswer],
    questionType: question.questionType as 'single' | 'multiple' || 'single'
  };
}

/**
 * 여러 다중 정답 문제를 한 번에 셔플합니다
 * @param questions 원본 문제 배열
 * @returns 셔플된 문제 배열
 */
export function shuffleMultipleAnswerQuestions(questions: Question[]): ShuffledMultipleAnswerQuestion[] {
  return questions.map(shuffleMultipleAnswerQuestion);
}

/**
 * 사용자가 선택한 답안들이 정답인지 확인합니다
 * @param selectedAnswers 사용자가 선택한 답안 인덱스 배열
 * @param shuffledQuestion 셔플된 문제 객체
 * @returns 정답 여부
 */
export function areCorrectAnswers(
  selectedAnswers: number[], 
  shuffledQuestion: ShuffledMultipleAnswerQuestion
): boolean {
  if (selectedAnswers.length !== shuffledQuestion.correctAnswers.length) {
    return false;
  }
  
  // 정렬하여 비교
  const sortedSelected = [...selectedAnswers].sort();
  const sortedCorrect = [...shuffledQuestion.correctAnswers].sort();
  
  return sortedSelected.every((answer, index) => answer === sortedCorrect[index]);
}

/**
 * 부분 점수를 계산합니다
 * @param selectedAnswers 사용자가 선택한 답안 인덱스 배열
 * @param shuffledQuestion 셔플된 문제 객체
 * @returns 부분 점수 (0-1)
 */
export function calculatePartialScore(
  selectedAnswers: number[],
  shuffledQuestion: ShuffledMultipleAnswerQuestion
): number {
  const correctAnswers = shuffledQuestion.correctAnswers;
  const totalCorrect = correctAnswers.length;
  
  if (totalCorrect === 0) return 0;
  
  // 정답 중에서 사용자가 맞힌 개수
  const correctSelected = selectedAnswers.filter(answer => 
    correctAnswers.includes(answer)
  ).length;
  
  // 오답 중에서 사용자가 선택한 개수
  const incorrectSelected = selectedAnswers.filter(answer => 
    !correctAnswers.includes(answer)
  ).length;
  
  // 부분 점수 계산 (정답은 +1, 오답은 -0.5)
  const score = (correctSelected - (incorrectSelected * 0.5)) / totalCorrect;
  
  return Math.max(0, Math.min(1, score));
}

/**
 * 답안 검증 결과를 반환합니다
 * @param selectedAnswers 사용자가 선택한 답안 인덱스 배열
 * @param shuffledQuestion 셔플된 문제 객체
 * @returns 검증 결과
 */
export function validateAnswers(
  selectedAnswers: number[],
  shuffledQuestion: ShuffledMultipleAnswerQuestion
): {
  isCorrect: boolean;
  isPartial: boolean;
  score: number;
  correctCount: number;
  incorrectCount: number;
  missingCount: number;
} {
  const correctAnswers = shuffledQuestion.correctAnswers;
  const totalCorrect = correctAnswers.length;
  
  // 정답 중에서 사용자가 맞힌 개수
  const correctSelected = selectedAnswers.filter(answer => 
    correctAnswers.includes(answer)
  ).length;
  
  // 오답 중에서 사용자가 선택한 개수
  const incorrectSelected = selectedAnswers.filter(answer => 
    !correctAnswers.includes(answer)
  ).length;
  
  // 선택하지 않은 정답 개수
  const missingCount = totalCorrect - correctSelected;
  
  // 완전 정답 여부
  const isCorrect = correctSelected === totalCorrect && incorrectSelected === 0;
  
  // 부분 점수 여부
  const isPartial = correctSelected > 0 && !isCorrect;
  
  // 점수 계산
  const score = calculatePartialScore(selectedAnswers, shuffledQuestion);
  
  return {
    isCorrect,
    isPartial,
    score,
    correctCount: correctSelected,
    incorrectCount: incorrectSelected,
    missingCount
  };
}

/**
 * 셔플된 문제에서 원본 정답 인덱스들을 가져옵니다
 * @param shuffledQuestion 셔플된 문제 객체
 * @returns 원본 정답 인덱스 배열
 */
export function getOriginalCorrectAnswers(
  shuffledQuestion: ShuffledMultipleAnswerQuestion
): number[] {
  return shuffledQuestion.originalCorrectAnswers;
}

/**
 * 문제 유형을 확인합니다
 * @param question 문제 객체
 * @returns 문제 유형
 */
export function getQuestionType(question: Question): 'single' | 'multiple' {
  if (question.questionType) {
    return question.questionType as 'single' | 'multiple';
  }
  
  // 기존 데이터의 경우 correctAnswers 배열 길이로 판단
  const correctAnswers = question.correctAnswers || [question.correctAnswer];
  return correctAnswers.length > 1 ? 'multiple' : 'single';
}


