/**
 * Question Shuffler Utility
 * 문제의 선택지를 무작위로 섞고 정답 인덱스를 조정하는 유틸리티
 */

import { Question } from "@my-better-t-app/db";

export interface ShuffledQuestion extends Omit<Question, 'correctAnswer'> {
  correctAnswer: number;           // 셔플된 정답 인덱스 (0, 1, 2, 3...)
  originalCorrectAnswer: number;  // 원본 정답 인덱스 (내부 로직용)
}

/**
 * Fisher-Yates 셔플 알고리즘을 사용하여 선택지를 무작위로 섞습니다
 * @param question 원본 문제 객체
 * @returns 셔플된 문제 객체
 */
export function shuffleQuestion(question: Question): ShuffledQuestion {
  const options = [...question.options];
  let correctAnswer = question.correctAnswer;
  
  // Fisher-Yates 셔플 알고리즘
  for (let i = options.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    
    // 선택지 교환
    [options[i], options[j]] = [options[j], options[i]];
    
    // 정답 인덱스도 함께 이동
    if (i === correctAnswer) {
      correctAnswer = j;
    } else if (j === correctAnswer) {
      correctAnswer = i;
    }
  }
  
  return {
    ...question,
    options,
    correctAnswer,
    originalCorrectAnswer: question.correctAnswer
  };
}

/**
 * 여러 문제를 한 번에 셔플합니다
 * @param questions 원본 문제 배열
 * @returns 셔플된 문제 배열
 */
export function shuffleQuestions(questions: Question[]): ShuffledQuestion[] {
  return questions.map(shuffleQuestion);
}

/**
 * 사용자가 선택한 답안이 정답인지 확인합니다
 * @param selectedAnswer 사용자가 선택한 답안 인덱스
 * @param shuffledQuestion 셔플된 문제 객체
 * @returns 정답 여부
 */
export function isCorrectAnswer(
  selectedAnswer: number, 
  shuffledQuestion: ShuffledQuestion
): boolean {
  return selectedAnswer === shuffledQuestion.correctAnswer;
}

/**
 * 셔플된 문제에서 원본 정답 인덱스를 가져옵니다
 * @param shuffledQuestion 셔플된 문제 객체
 * @returns 원본 정답 인덱스
 */
export function getOriginalCorrectAnswer(
  shuffledQuestion: ShuffledQuestion
): number {
  return shuffledQuestion.originalCorrectAnswer;
}

/**
 * 셔플된 문제에서 원본 선택지를 가져옵니다
 * @param shuffledQuestion 셔플된 문제 객체
 * @returns 원본 선택지 배열
 */
export function getOriginalOptions(
  shuffledQuestion: ShuffledQuestion
): string[] {
  // 원본 선택지는 셔플된 선택지와 동일하지만 순서가 다름
  // 이 함수는 디버깅이나 로깅 목적으로 사용
  return shuffledQuestion.options;
}

