-- 문제 시스템 V2 마이그레이션
-- 기존 시스템과의 호환성을 유지하면서 새로운 시스템 구축

-- 1. 새로운 테이블 생성
CREATE TABLE IF NOT EXISTS questions_v2 (
    id TEXT PRIMARY KEY,
    category TEXT NOT NULL,
    question TEXT NOT NULL,
    explanation TEXT NOT NULL,
    code TEXT,
    difficulty TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    options JSON NOT NULL,
    correct_answer INTEGER NOT NULL,
    question_type VARCHAR(20) NOT NULL DEFAULT 'single',
    is_active BOOLEAN NOT NULL DEFAULT true,
    version INTEGER NOT NULL DEFAULT 1
);

-- 2. 문제 세션 테이블 생성
CREATE TABLE IF NOT EXISTS question_sessions (
    id TEXT PRIMARY KEY,
    question_id TEXT NOT NULL REFERENCES questions_v2(id),
    user_id TEXT,
    shuffled_options JSON NOT NULL,
    correct_answer_index INTEGER NOT NULL,
    session_type VARCHAR(20) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMP NOT NULL,
    validation_hash TEXT NOT NULL
);

-- 3. 답안 제출 테이블 생성
CREATE TABLE IF NOT EXISTS answer_submissions (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL REFERENCES question_sessions(id),
    user_id TEXT NOT NULL,
    question_id TEXT NOT NULL REFERENCES questions_v2(id),
    selected_answer_index INTEGER NOT NULL,
    is_correct BOOLEAN NOT NULL,
    submitted_at TIMESTAMP NOT NULL DEFAULT NOW(),
    validation_hash TEXT NOT NULL,
    processing_time_ms INTEGER
);

-- 4. 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_questions_v2_category ON questions_v2(category);
CREATE INDEX IF NOT EXISTS idx_questions_v2_difficulty ON questions_v2(difficulty);
CREATE INDEX IF NOT EXISTS idx_questions_v2_active ON questions_v2(is_active);

CREATE INDEX IF NOT EXISTS idx_question_sessions_question_id ON question_sessions(question_id);
CREATE INDEX IF NOT EXISTS idx_question_sessions_user_id ON question_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_question_sessions_expires_at ON question_sessions(expires_at);

CREATE INDEX IF NOT EXISTS idx_answer_submissions_session_id ON answer_submissions(session_id);
CREATE INDEX IF NOT EXISTS idx_answer_submissions_user_id ON answer_submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_answer_submissions_question_id ON answer_submissions(question_id);
CREATE INDEX IF NOT EXISTS idx_answer_submissions_submitted_at ON answer_submissions(submitted_at);

-- 5. 기존 데이터 마이그레이션 (선택적)
-- 기존 questions 테이블에서 questions_v2로 데이터 복사
INSERT INTO questions_v2 (
    id, category, question, explanation, code, difficulty, 
    options, correct_answer, question_type, is_active, version
)
SELECT 
    id, category, question, explanation, code, difficulty,
    options, correct_answer, 'single', true, 1
FROM questions
WHERE NOT EXISTS (SELECT 1 FROM questions_v2 WHERE questions_v2.id = questions.id);

-- 6. 만료된 세션 정리를 위한 함수 생성
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM question_sessions 
    WHERE expires_at < NOW();
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- 7. 정답 검증 함수 생성
CREATE OR REPLACE FUNCTION validate_answer(
    p_session_id TEXT,
    p_selected_index INTEGER
) RETURNS BOOLEAN AS $$
DECLARE
    session_record RECORD;
    is_valid BOOLEAN := FALSE;
BEGIN
    SELECT * INTO session_record 
    FROM question_sessions 
    WHERE id = p_session_id AND expires_at > NOW();
    
    IF FOUND THEN
        is_valid := (session_record.correct_answer_index = p_selected_index);
    END IF;
    
    RETURN is_valid;
END;
$$ LANGUAGE plpgsql;

-- 8. 통계 뷰 생성
CREATE OR REPLACE VIEW question_statistics AS
SELECT 
    q.id,
    q.category,
    q.difficulty,
    COUNT(s.id) as session_count,
    COUNT(a.id) as submission_count,
    COUNT(CASE WHEN a.is_correct THEN 1 END) as correct_count,
    ROUND(
        COUNT(CASE WHEN a.is_correct THEN 1 END)::DECIMAL / 
        NULLIF(COUNT(a.id), 0) * 100, 2
    ) as accuracy_percentage
FROM questions_v2 q
LEFT JOIN question_sessions s ON q.id = s.question_id
LEFT JOIN answer_submissions a ON s.id = a.session_id
WHERE q.is_active = true
GROUP BY q.id, q.category, q.difficulty;

-- 9. 자동 정리 스케줄러 (PostgreSQL 확장 필요)
-- CREATE EXTENSION IF NOT EXISTS pg_cron;
-- SELECT cron.schedule('cleanup-sessions', '0 * * * *', 'SELECT cleanup_expired_sessions();');

-- 10. 권한 설정
GRANT SELECT, INSERT, UPDATE, DELETE ON questions_v2 TO app_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON question_sessions TO app_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON answer_submissions TO app_user;
GRANT EXECUTE ON FUNCTION cleanup_expired_sessions() TO app_user;
GRANT EXECUTE ON FUNCTION validate_answer(TEXT, INTEGER) TO app_user;

