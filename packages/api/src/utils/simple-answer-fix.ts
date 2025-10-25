/**
 * 단순한 정답 처리 수정
 * - 기존 복잡한 랜덤화 로직 제거
 * - 단순한 선택지 셔플만 적용
 */

import { Question } from "@my-better-t-app/db";

export interface SimpleShuffledQuestion extends Omit<Question, 'correctAnswer'> {
  correctAnswer: number;           // 셔플된 정답 인덱스
  originalCorrectAnswer: number;   // 원본 정답 인덱스 (디버깅용)
}

/**
 * 단순한 선택지 셔플 (정답 랜덤화 제거)
 * @param question 원본 문제
 * @returns 셔플된 문제
 */
export function simpleShuffleQuestion(question: Question): SimpleShuffledQuestion {
  const options = [...question.options];
  let correctAnswer = question.correctAnswer;
  
  // Fisher-Yates 셔플 (정답 인덱스 추적)
  for (let i = options.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    
    // 선택지 교환
    [options[i], options[j]] = [options[j], options[i]];
    
    // 정답 인덱스 추적
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
 * 여러 문제 셔플
 */
export function simpleShuffleQuestions(questions: Question[]): SimpleShuffledQuestion[] {
  return questions.map(simpleShuffleQuestion);
}

/**
 * 정답 확인 (단순)
 */
export function isCorrectAnswer(
  selectedAnswer: number,
  shuffledQuestion: SimpleShuffledQuestion
): boolean {
  return selectedAnswer === shuffledQuestion.correctAnswer;
}
