/**
 * Multiple Answers Migration Utility
 * 기존 단일 정답 데이터를 다중 정답 시스템으로 마이그레이션
 */

import { db, questions } from '../schema/questions';
import { eq } from 'drizzle-orm';

interface LegacyQuestion {
  id: string;
  category: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  code?: string;
  difficulty: string;
}

interface MultipleAnswerQuestion {
  id: string;
  category: string;
  question: string;
  options: string[];
  correctAnswers: number[];
  questionType: 'single' | 'multiple';
  explanation: string;
  code?: string;
  difficulty: string;
}

/**
 * 기존 문제를 다중 정답 형식으로 변환
 */
export function convertToMultipleAnswer(question: LegacyQuestion): MultipleAnswerQuestion {
  return {
    ...question,
    correctAnswers: [question.correctAnswer],
    questionType: 'single'
  };
}

/**
 * 다중 정답 문제 생성 (예시)
 */
export function createMultipleAnswerQuestion(
  baseQuestion: LegacyQuestion,
  additionalCorrectAnswers: number[]
): MultipleAnswerQuestion {
  const allCorrectAnswers = [baseQuestion.correctAnswer, ...additionalCorrectAnswers];
  
  return {
    ...baseQuestion,
    correctAnswers: allCorrectAnswers,
    questionType: 'multiple'
  };
}

/**
 * 데이터베이스 마이그레이션 실행
 */
export async function migrateToMultipleAnswers() {
  console.log('🔄 다중 정답 시스템으로 마이그레이션 시작...');

  try {
    // 1. 기존 데이터 가져오기
    console.log('📚 기존 문제 데이터 가져오는 중...');
    const existingQuestions = await db.select().from(questions);
    console.log(`✅ ${existingQuestions.length}개의 문제를 가져왔습니다.`);

    // 2. 각 문제를 다중 정답 형식으로 변환
    console.log('🔄 데이터 변환 중...');
    const convertedQuestions = existingQuestions.map(convertToMultipleAnswer);

    // 3. 데이터베이스 업데이트
    console.log('💾 데이터베이스 업데이트 중...');
    for (const question of convertedQuestions) {
      await db
        .update(questions)
        .set({
          correctAnswers: question.correctAnswers,
          questionType: question.questionType
        })
        .where(eq(questions.id, question.id));
    }

    console.log('✅ 마이그레이션 완료!');
    console.log(`   - 총 ${convertedQuestions.length}개 문제 처리`);
    console.log(`   - 모든 문제가 단일 정답으로 설정됨`);

    // 4. 통계 출력
    const singleCount = convertedQuestions.filter(q => q.questionType === 'single').length;
    const multipleCount = convertedQuestions.filter(q => q.questionType === 'multiple').length;
    
    console.log('\n📊 마이그레이션 통계:');
    console.log(`   - 단일 정답: ${singleCount}개`);
    console.log(`   - 다중 정답: ${multipleCount}개`);

  } catch (error) {
    console.error('❌ 마이그레이션 실패:', error);
    throw error;
  }
}

/**
 * 다중 정답 문제 생성 예시
 */
export async function createSampleMultipleAnswerQuestions() {
  console.log('🎯 다중 정답 문제 생성 예시...');

  try {
    // 예시: Python 문법 문제 (여러 정답 가능)
    const sampleQuestion: MultipleAnswerQuestion = {
      id: 'multi-001',
      category: 'Python 문법',
      question: 'Python에서 리스트를 생성하는 방법은? (모두 선택)',
      options: [
        'list()',
        '[]',
        'list([1, 2, 3])',
        '[1, 2, 3]',
        'new list()'
      ],
      correctAnswers: [0, 1, 2, 3], // list(), [], list([1, 2, 3]), [1, 2, 3] 모두 정답
      questionType: 'multiple',
      explanation: 'Python에서 리스트를 생성하는 방법은 다양합니다. list() 함수, [] 리터럴, 초기값과 함께 생성하는 방법 등이 모두 유효합니다.',
      code: '# 리스트 생성 방법들\nmy_list1 = list()\nmy_list2 = []\nmy_list3 = list([1, 2, 3])\nmy_list4 = [1, 2, 3]',
      difficulty: 'easy'
    };

    // 데이터베이스에 삽입
    await db.insert(questions).values({
      id: sampleQuestion.id,
      category: sampleQuestion.category,
      question: sampleQuestion.question,
      options: sampleQuestion.options,
      correctAnswer: sampleQuestion.correctAnswers[0], // 호환성을 위해 첫 번째 정답
      correctAnswers: sampleQuestion.correctAnswers,
      questionType: sampleQuestion.questionType,
      explanation: sampleQuestion.explanation,
      code: sampleQuestion.code,
      difficulty: sampleQuestion.difficulty
    });

    console.log('✅ 다중 정답 문제 생성 완료!');
    console.log(`   - 문제 ID: ${sampleQuestion.id}`);
    console.log(`   - 정답 개수: ${sampleQuestion.correctAnswers.length}개`);
    console.log(`   - 정답 인덱스: ${sampleQuestion.correctAnswers.join(', ')}`);

  } catch (error) {
    console.error('❌ 다중 정답 문제 생성 실패:', error);
    throw error;
  }
}

/**
 * 마이그레이션 검증
 */
export async function validateMigration() {
  console.log('🔍 마이그레이션 검증 중...');

  try {
    // 1. 모든 문제가 questionType을 가지고 있는지 확인
    const questionsWithType = await db
      .select()
      .from(questions)
      .where(eq(questions.questionType, 'single'));

    console.log(`✅ 단일 정답 문제: ${questionsWithType.length}개`);

    // 2. correctAnswers 배열이 올바르게 설정되었는지 확인
    const questionsWithCorrectAnswers = await db
      .select()
      .from(questions)
      .where(eq(questions.correctAnswers, JSON.stringify([0])));

    console.log(`✅ correctAnswers가 설정된 문제: ${questionsWithCorrectAnswers.length}개`);

    // 3. 데이터 무결성 확인
    const allQuestions = await db.select().from(questions);
    let validCount = 0;
    let invalidCount = 0;

    for (const question of allQuestions) {
      if (question.correctAnswers && Array.isArray(question.correctAnswers)) {
        validCount++;
      } else {
        invalidCount++;
      }
    }

    console.log(`✅ 유효한 문제: ${validCount}개`);
    console.log(`❌ 무효한 문제: ${invalidCount}개`);

    if (invalidCount === 0) {
      console.log('🎉 마이그레이션 검증 성공!');
    } else {
      console.log('⚠️ 일부 문제에 문제가 있습니다.');
    }

  } catch (error) {
    console.error('❌ 마이그레이션 검증 실패:', error);
    throw error;
  }
}

// 스크립트 실행
if (require.main === module) {
  async function runMigration() {
    try {
      await migrateToMultipleAnswers();
      await createSampleMultipleAnswerQuestions();
      await validateMigration();
      console.log('\n🎉 모든 마이그레이션 완료!');
    } catch (error) {
      console.error('💥 마이그레이션 실패:', error);
      process.exit(1);
    }
  }

  runMigration();
}


