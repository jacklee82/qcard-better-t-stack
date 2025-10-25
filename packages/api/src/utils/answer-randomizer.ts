/**
 * Answer Randomizer Utility
 * 문제의 정답을 1번과 2번 사이에서 랜덤하게 배치하는 유틸리티
 */

import { Question } from "@my-better-t-app/db";

export interface RandomizedQuestion extends Omit<Question, 'correctAnswer'> {
  correctAnswer: number;           // 랜덤화된 정답 (0 또는 1)
  originalCorrectAnswer: number;   // 원본 정답 (항상 0)
}

/**
 * 문제의 정답을 50% 확률로 1번과 2번 사이에서 랜덤하게 배치합니다
 * @param question 원본 문제 객체
 * @returns 랜덤화된 문제 객체
 */
export function randomizeQuestionAnswer(question: Question): RandomizedQuestion {
  // 50% 확률로 정답을 0 또는 1로 설정
  const randomizedAnswer = Math.random() < 0.5 ? 0 : 1;
  
  return {
    ...question,
    correctAnswer: randomizedAnswer,
    originalCorrectAnswer: question.correctAnswer
  };
}

/**
 * 여러 문제의 정답을 한 번에 랜덤화합니다
 * @param questions 원본 문제 배열
 * @returns 랜덤화된 문제 배열
 */
export function randomizeQuestionsAnswers(questions: Question[]): RandomizedQuestion[] {
  return questions.map(randomizeQuestionAnswer);
}

/**
 * 사용자가 선택한 답안이 정답인지 확인합니다
 * @param selectedAnswer 사용자가 선택한 답안 인덱스
 * @param randomizedQuestion 랜덤화된 문제 객체
 * @returns 정답 여부
 */
export function isCorrectAnswer(
  selectedAnswer: number, 
  randomizedQuestion: RandomizedQuestion
): boolean {
  return selectedAnswer === randomizedQuestion.correctAnswer;
}

/**
 * 랜덤화된 문제에서 원본 정답 인덱스를 가져옵니다
 * @param randomizedQuestion 랜덤화된 문제 객체
 * @returns 원본 정답 인덱스
 */
export function getOriginalCorrectAnswer(
  randomizedQuestion: RandomizedQuestion
): number {
  return randomizedQuestion.originalCorrectAnswer;
}

/**
 * 정답 분포를 테스트합니다
 * @param questions 문제 배열
 * @param iterations 테스트 반복 횟수
 * @returns 분포 통계
 */
export function testAnswerDistribution(
  questions: Question[], 
  iterations: number = 1000
): {
  totalQuestions: number;
  iterations: number;
  distribution: {
    answer0: number;  // 1번 정답인 경우
    answer1: number;  // 2번 정답인 경우
  };
  percentages: {
    answer0: number;
    answer1: number;
  };
} {
  const distribution = { answer0: 0, answer1: 0 };
  
  for (let i = 0; i < iterations; i++) {
    const randomized = randomizeQuestionsAnswers(questions);
    randomized.forEach(question => {
      if (question.correctAnswer === 0) {
        distribution.answer0++;
      } else {
        distribution.answer1++;
      }
    });
  }
  
  const totalAnswers = distribution.answer0 + distribution.answer1;
  
  return {
    totalQuestions: questions.length,
    iterations,
    distribution,
    percentages: {
      answer0: (distribution.answer0 / totalAnswers) * 100,
      answer1: (distribution.answer1 / totalAnswers) * 100
    }
  };
}

/**
 * 랜덤 시드를 사용하여 재현 가능한 랜덤화를 수행합니다
 * @param question 원본 문제 객체
 * @param seed 랜덤 시드
 * @returns 랜덤화된 문제 객체
 */
export function randomizeQuestionAnswerWithSeed(
  question: Question, 
  seed: number
): RandomizedQuestion {
  // 간단한 시드 기반 랜덤 함수
  const seededRandom = (seed: number) => {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
  };
  
  const randomValue = seededRandom(seed);
  const randomizedAnswer = randomValue < 0.5 ? 0 : 1;
  
  return {
    ...question,
    correctAnswer: randomizedAnswer,
    originalCorrectAnswer: question.correctAnswer
  };
}

/**
 * 문제 ID를 기반으로 일관된 랜덤화를 수행합니다
 * 같은 문제 ID는 항상 같은 정답을 가집니다
 * @param question 원본 문제 객체
 * @returns 랜덤화된 문제 객체
 */
export function randomizeQuestionAnswerConsistent(question: Question): RandomizedQuestion {
  // 문제 ID를 해시하여 시드로 사용
  let hash = 0;
  for (let i = 0; i < question.id.length; i++) {
    const char = question.id.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // 32비트 정수로 변환
  }
  
  // 절댓값을 사용하여 양수 시드 생성
  const seed = Math.abs(hash);
  return randomizeQuestionAnswerWithSeed(question, seed);
}

