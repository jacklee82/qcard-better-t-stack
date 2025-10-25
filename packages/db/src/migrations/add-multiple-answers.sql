-- 다중 정답 지원을 위한 데이터베이스 마이그레이션
-- 기존 데이터의 호환성을 유지하면서 새로운 기능 추가

-- 1. 새로운 컬럼 추가
ALTER TABLE questions 
ADD COLUMN IF NOT EXISTS correct_answers JSON,
ADD COLUMN IF NOT EXISTS question_type VARCHAR(20) DEFAULT 'single' NOT NULL;

-- 2. 기존 데이터 마이그레이션
-- 모든 기존 문제를 단일 정답으로 설정하고 correct_answers 배열 생성
UPDATE questions 
SET 
    correct_answers = JSON_BUILD_ARRAY(correct_answer),
    question_type = 'single'
WHERE correct_answers IS NULL;

-- 3. 인덱스 추가 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_questions_question_type ON questions(question_type);
CREATE INDEX IF NOT EXISTS idx_questions_correct_answers ON questions USING GIN(correct_answers);

-- 4. 제약 조건 추가
-- question_type이 'single' 또는 'multiple'만 허용
ALTER TABLE questions 
ADD CONSTRAINT chk_question_type 
CHECK (question_type IN ('single', 'multiple'));

-- 5. 단일 정답 문제의 경우 correct_answers 배열이 1개 요소만 가져야 함
ALTER TABLE questions 
ADD CONSTRAINT chk_single_answer_length 
CHECK (
    question_type = 'single' AND JSON_ARRAY_LENGTH(correct_answers) = 1
    OR question_type = 'multiple'
);

-- 6. 다중 정답 문제의 경우 correct_answers 배열이 2개 이상 요소를 가져야 함
ALTER TABLE questions 
ADD CONSTRAINT chk_multiple_answer_length 
CHECK (
    question_type = 'multiple' AND JSON_ARRAY_LENGTH(correct_answers) >= 2
    OR question_type = 'single'
);

-- 7. correct_answers 배열의 모든 값이 유효한 인덱스인지 확인
-- (options 배열의 길이보다 작아야 함)
-- 이 제약 조건은 애플리케이션 레벨에서 검증하는 것이 더 적절함

