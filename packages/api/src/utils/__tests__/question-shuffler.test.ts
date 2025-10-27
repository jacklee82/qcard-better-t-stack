/**
 * Question Shuffler Tests
 * 선택지 셔플 기능 테스트
 */

import { shuffleQuestion, shuffleQuestions, isCorrectAnswer } from '../question-shuffler';
import { Question } from '@my-better-t-app/db';

describe('Question Shuffler', () => {
  const mockQuestion: Question = {
    id: 'test-001',
    category: '테스트',
    question: '테스트 문제입니다',
    options: ['선택지 A', '선택지 B', '선택지 C', '선택지 D'],
    correctAnswer: 0, // A가 정답
    explanation: '테스트 해설',
    code: null,
    difficulty: 'easy',
    createdAt: new Date(),
  };

  describe('shuffleQuestion', () => {
    it('선택지가 셔플되어야 한다', () => {
      const shuffled = shuffleQuestion(mockQuestion);
      
      // 선택지 배열이 변경되었는지 확인
      expect(shuffled.options).not.toEqual(mockQuestion.options);
      
      // 선택지 개수는 동일해야 함
      expect(shuffled.options.length).toBe(mockQuestion.options.length);
      
      // 모든 선택지가 포함되어야 함
      expect(shuffled.options).toEqual(expect.arrayContaining(mockQuestion.options));
    });

    it('정답 인덱스가 올바르게 조정되어야 한다', () => {
      const shuffled = shuffleQuestion(mockQuestion);
      
      // 원본 정답 인덱스가 보존되어야 함
      expect(shuffled.originalCorrectAnswer).toBe(mockQuestion.correctAnswer);
      
      // 셔플된 정답 인덱스가 유효한 범위 내에 있어야 함
      expect(shuffled.correctAnswer).toBeGreaterThanOrEqual(0);
      expect(shuffled.correctAnswer).toBeLessThan(shuffled.options.length);
    });

    it('정답이 올바른 선택지를 가리켜야 한다', () => {
      const shuffled = shuffleQuestion(mockQuestion);
      
      // 원본 정답 선택지
      const originalCorrectOption = mockQuestion.options[mockQuestion.correctAnswer];
      
      // 셔플된 정답 선택지
      const shuffledCorrectOption = shuffled.options[shuffled.correctAnswer];
      
      // 두 선택지가 동일해야 함
      expect(shuffledCorrectOption).toBe(originalCorrectOption);
    });
  });

  describe('shuffleQuestions', () => {
    it('여러 문제를 셔플해야 한다', () => {
      const questions = [mockQuestion, { ...mockQuestion, id: 'test-002' }];
      const shuffled = shuffleQuestions(questions);
      
      expect(shuffled.length).toBe(questions.length);
      shuffled.forEach((q, index) => {
        expect(q.originalCorrectAnswer).toBe(questions[index].correctAnswer);
      });
    });
  });

  describe('isCorrectAnswer', () => {
    it('올바른 답안을 선택했을 때 true를 반환해야 한다', () => {
      const shuffled = shuffleQuestion(mockQuestion);
      const isCorrect = isCorrectAnswer(shuffled.correctAnswer, shuffled);
      
      expect(isCorrect).toBe(true);
    });

    it('잘못된 답안을 선택했을 때 false를 반환해야 한다', () => {
      const shuffled = shuffleQuestion(mockQuestion);
      const wrongAnswer = (shuffled.correctAnswer + 1) % shuffled.options.length;
      const isCorrect = isCorrectAnswer(wrongAnswer, shuffled);
      
      expect(isCorrect).toBe(false);
    });
  });

  describe('셔플 분포 테스트', () => {
    it('정답이 다양한 위치에 분포되어야 한다', () => {
      const results = new Map<number, number>();
      const iterations = 1000;
      
      for (let i = 0; i < iterations; i++) {
        const shuffled = shuffleQuestion(mockQuestion);
        const count = results.get(shuffled.correctAnswer) || 0;
        results.set(shuffled.correctAnswer, count + 1);
      }
      
      // 모든 위치에 정답이 나타났는지 확인
      expect(results.size).toBe(4);
      
      // 각 위치의 분포가 균등에 가까운지 확인 (20% 오차 허용)
      const expectedCount = iterations / 4;
      const tolerance = expectedCount * 0.2;
      
      for (let i = 0; i < 4; i++) {
        const count = results.get(i) || 0;
        expect(count).toBeGreaterThanOrEqual(expectedCount - tolerance);
        expect(count).toBeLessThanOrEqual(expectedCount + tolerance);
      }
    });
  });
});


