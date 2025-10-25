/**
 * Shuffle Test Script
 * 실제 데이터베이스에서 셔플 기능 테스트
 */

import { db, questions } from '@my-better-t-app/db';
import { shuffleQuestions } from './question-shuffler';

async function testShuffle() {
  console.log('🧪 셔플 기능 테스트 시작...\n');

  try {
    // 데이터베이스에서 문제 가져오기
    console.log('📚 데이터베이스에서 문제 가져오는 중...');
    const questionsData = await db.select().from(questions).limit(5);
    
    if (questionsData.length === 0) {
      console.log('❌ 데이터베이스에 문제가 없습니다.');
      return;
    }

    console.log(`✅ ${questionsData.length}개의 문제를 가져왔습니다.\n`);

    // 원본 문제 정보 출력
    console.log('📋 원본 문제 정보:');
    questionsData.forEach((q, index) => {
      console.log(`  ${index + 1}. ${q.question.substring(0, 50)}...}`);
      console.log(`     선택지: ${q.options.join(', ')}`);
      console.log(`     정답: ${q.correctAnswer + 1}번 (${q.options[q.correctAnswer]})`);
      console.log('');
    });

    // 셔플 테스트
    console.log('🔀 셔플 테스트 시작...\n');
    
    for (let round = 1; round <= 3; round++) {
      console.log(`--- 라운드 ${round} ---`);
      const shuffled = shuffleQuestions(questionsData);
      
      shuffled.forEach((q, index) => {
        console.log(`  ${index + 1}. ${q.question.substring(0, 50)}...`);
        console.log(`     셔플된 선택지: ${q.options.join(', ')}`);
        console.log(`     셔플된 정답: ${q.correctAnswer + 1}번 (${q.options[q.correctAnswer]})`);
        console.log(`     원본 정답: ${q.originalCorrectAnswer + 1}번`);
        console.log('');
      });
    }

    // 정답 분포 테스트
    console.log('📊 정답 분포 테스트...');
    const distribution = new Map<number, number>();
    const testRounds = 1000;
    
    for (let i = 0; i < testRounds; i++) {
      const shuffled = shuffleQuestions(questionsData);
      shuffled.forEach(q => {
        const count = distribution.get(q.correctAnswer) || 0;
        distribution.set(q.correctAnswer, count + 1);
      });
    }

    console.log('정답 위치별 분포:');
    for (let i = 0; i < 4; i++) {
      const count = distribution.get(i) || 0;
      const percentage = (count / (testRounds * questionsData.length)) * 100;
      console.log(`  ${i + 1}번 위치: ${count}회 (${percentage.toFixed(1)}%)`);
    }

    console.log('\n✅ 셔플 테스트 완료!');

  } catch (error) {
    console.error('❌ 테스트 중 오류 발생:', error);
  }
}

// 스크립트 실행
if (require.main === module) {
  testShuffle().then(() => {
    console.log('\n🎉 테스트 완료!');
    process.exit(0);
  }).catch((error) => {
    console.error('💥 테스트 실패:', error);
    process.exit(1);
  });
}

export { testShuffle };

