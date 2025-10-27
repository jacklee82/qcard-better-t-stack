/**
 * Answer Randomization Test Script
 * 정답 랜덤화 기능 테스트
 */

import { db, questions } from '@my-better-t-app/db';
import { randomizeQuestionsAnswers, testAnswerDistribution } from './answer-randomizer';

async function testAnswerRandomization() {
  console.log('🧪 정답 랜덤화 테스트 시작...\n');

  try {
    // 데이터베이스에서 문제 가져오기
    console.log('📚 데이터베이스에서 문제 가져오는 중...');
    const questionsData = await db.select().from(questions).limit(10);
    
    if (questionsData.length === 0) {
      console.log('❌ 데이터베이스에 문제가 없습니다.');
      return;
    }

    console.log(`✅ ${questionsData.length}개의 문제를 가져왔습니다.\n`);

    // 원본 문제 정보 출력
    console.log('📋 원본 문제 정보:');
    questionsData.forEach((q, index) => {
      console.log(`  ${index + 1}. ${q.question.substring(0, 50)}...`);
      console.log(`     선택지: ${q.options.join(', ')}`);
      console.log(`     원본 정답: ${q.correctAnswer + 1}번 (${q.options[q.correctAnswer]})`);
      console.log('');
    });

    // 정답 랜덤화 테스트
    console.log('🎲 정답 랜덤화 테스트 시작...\n');
    
    for (let round = 1; round <= 3; round++) {
      console.log(`--- 라운드 ${round} ---`);
      const randomized = randomizeQuestionsAnswers(questionsData);
      
      randomized.forEach((q, index) => {
        console.log(`  ${index + 1}. ${q.question.substring(0, 50)}...`);
        console.log(`     선택지: ${q.options.join(', ')}`);
        console.log(`     랜덤화된 정답: ${q.correctAnswer + 1}번 (${q.options[q.correctAnswer]})`);
        console.log(`     원본 정답: ${q.originalCorrectAnswer + 1}번`);
        console.log('');
      });
    }

    // 정답 분포 테스트
    console.log('📊 정답 분포 테스트...');
    const distribution = testAnswerDistribution(questionsData, 1000);
    
    console.log('정답 분포 통계:');
    console.log(`  총 문제 수: ${distribution.totalQuestions}개`);
    console.log(`  테스트 반복: ${distribution.iterations}회`);
    console.log(`  1번 정답: ${distribution.distribution.answer0}회 (${distribution.percentages.answer0.toFixed(1)}%)`);
    console.log(`  2번 정답: ${distribution.distribution.answer1}회 (${distribution.percentages.answer1.toFixed(1)}%)`);
    
    // 분포 균등성 검증
    const tolerance = 5; // 5% 오차 허용
    const expectedPercentage = 50;
    
    console.log('\n🔍 분포 균등성 검증:');
    console.log(`  예상 비율: 50% ± ${tolerance}%`);
    console.log(`  1번 정답 비율: ${distribution.percentages.answer0.toFixed(1)}%`);
    console.log(`  2번 정답 비율: ${distribution.percentages.answer1.toFixed(1)}%`);
    
    const isBalanced = 
      Math.abs(distribution.percentages.answer0 - expectedPercentage) <= tolerance &&
      Math.abs(distribution.percentages.answer1 - expectedPercentage) <= tolerance;
    
    if (isBalanced) {
      console.log('✅ 분포가 균등합니다! (50:50 비율)');
    } else {
      console.log('⚠️ 분포가 불균등합니다. 랜덤 함수를 확인해주세요.');
    }

    // 개별 문제 테스트
    console.log('\n🎯 개별 문제 테스트...');
    const testQuestion = questionsData[0];
    console.log(`테스트 문제: ${testQuestion.question.substring(0, 50)}...`);
    
    const testResults = { answer0: 0, answer1: 0 };
    for (let i = 0; i < 100; i++) {
      const randomized = randomizeQuestionsAnswers([testQuestion]);
      if (randomized[0].correctAnswer === 0) {
        testResults.answer0++;
      } else {
        testResults.answer1++;
      }
    }
    
    console.log(`  1번 정답: ${testResults.answer0}회 (${(testResults.answer0 / 100) * 100}%)`);
    console.log(`  2번 정답: ${testResults.answer1}회 (${(testResults.answer1 / 100) * 100}%)`);

    console.log('\n✅ 정답 랜덤화 테스트 완료!');

  } catch (error) {
    console.error('❌ 테스트 중 오류 발생:', error);
  }
}

// 스크립트 실행
if (require.main === module) {
  testAnswerRandomization().then(() => {
    console.log('\n🎉 모든 테스트 완료!');
    process.exit(0);
  }).catch((error) => {
    console.error('💥 테스트 실패:', error);
    process.exit(1);
  });
}

export { testAnswerRandomization };


