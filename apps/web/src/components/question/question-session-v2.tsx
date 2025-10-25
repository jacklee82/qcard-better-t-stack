/**
 * 개선된 문제 세션 컴포넌트
 * - 세션 기반 문제 관리
 * - 정확한 정답 검증
 * - 사용자 경험 개선
 */

import React, { useState, useEffect } from 'react';
import { trpc } from '@/utils/trpc';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';

interface QuestionSessionV2Props {
  questionId: string;
  sessionType?: 'study' | 'review' | 'test';
  onComplete?: (result: { isCorrect: boolean; explanation: string }) => void;
  onNext?: () => void;
}

interface QuestionData {
  id: string;
  category: string;
  question: string;
  options: string[];
  explanation: string;
  code?: string;
  difficulty: string;
}

interface SessionData {
  sessionId: string;
  question: QuestionData;
  expiresAt: string;
}

export function QuestionSessionV2({
  questionId,
  sessionType = 'study',
  onComplete,
  onNext,
}: QuestionSessionV2Props) {
  // 상태 관리
  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [result, setResult] = useState<{
    isCorrect: boolean;
    correctAnswerIndex: number;
    explanation: string;
  } | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(0);

  // tRPC 훅
  const createSession = trpc.questionV2.createSession.useMutation({
    onSuccess: (data) => {
      setSessionData(data);
      const expiresAt = new Date(data.expiresAt);
      setTimeLeft(Math.max(0, Math.floor((expiresAt.getTime() - Date.now()) / 1000)));
    },
    onError: (error) => {
      console.error('세션 생성 실패:', error);
    },
  });

  const submitAnswer = trpc.questionV2.submitAnswer.useMutation({
    onSuccess: (data) => {
      setResult(data);
      setIsSubmitted(true);
      onComplete?.(data);
    },
    onError: (error) => {
      console.error('답안 제출 실패:', error);
    },
  });

  // 세션 생성
  useEffect(() => {
    if (!sessionData) {
      createSession.mutate({
        questionId,
        sessionType,
        userId: 'current-user-id', // 실제로는 인증된 사용자 ID
      });
    }
  }, [questionId, sessionType, sessionData]);

  // 타이머
  useEffect(() => {
    if (timeLeft > 0 && !isSubmitted) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && !isSubmitted) {
      // 시간 만료 시 자동 제출
      handleSubmit();
    }
  }, [timeLeft, isSubmitted]);

  // 답안 선택
  const handleAnswerSelect = (index: number) => {
    if (isSubmitted) return;
    setSelectedAnswer(index);
  };

  // 답안 제출
  const handleSubmit = () => {
    if (selectedAnswer === null || !sessionData) return;
    
    submitAnswer.mutate({
      sessionId: sessionData.sessionId,
      selectedAnswerIndex: selectedAnswer,
    });
  };

  // 다음 문제
  const handleNext = () => {
    onNext?.();
  };

  // 로딩 상태
  if (createSession.isPending || !sessionData) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="p-6">
          <div className="flex items-center justify-center space-x-2">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span>문제를 불러오는 중...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const { question } = sessionData;

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Badge variant="outline">{question.category}</Badge>
            <Badge variant="secondary">{question.difficulty}</Badge>
          </div>
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>{timeLeft}초 남음</span>
          </div>
        </div>
        <CardTitle className="text-lg">{question.question}</CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* 선택지 */}
        <div className="space-y-2">
          {question.options.map((option, index) => {
            const isSelected = selectedAnswer === index;
            const isCorrect = result?.isCorrect && result.correctAnswerIndex === index;
            const isWrong = result && !result.isCorrect && selectedAnswer === index;
            const isCorrectAnswer = result && result.correctAnswerIndex === index;

            return (
              <Button
                key={index}
                variant={isSelected ? "default" : "outline"}
                className={`w-full justify-start h-auto p-4 text-left ${
                  isCorrect ? "bg-green-100 border-green-500" :
                  isWrong ? "bg-red-100 border-red-500" :
                  isCorrectAnswer ? "bg-green-100 border-green-500" :
                  ""
                }`}
                onClick={() => handleAnswerSelect(index)}
                disabled={isSubmitted}
              >
                <div className="flex items-center space-x-3">
                  <span className="font-medium">{String.fromCharCode(65 + index)}.</span>
                  <span className="flex-1">{option}</span>
                  {isSubmitted && (
                    <div className="ml-2">
                      {isCorrect ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : isWrong ? (
                        <XCircle className="h-5 w-5 text-red-600" />
                      ) : isCorrectAnswer ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : null}
                    </div>
                  )}
                </div>
              </Button>
            );
          })}
        </div>

        {/* 제출 버튼 */}
        {!isSubmitted && (
          <Button
            onClick={handleSubmit}
            disabled={selectedAnswer === null || submitAnswer.isPending}
            className="w-full"
          >
            {submitAnswer.isPending ? "제출 중..." : "답안 제출"}
          </Button>
        )}

        {/* 결과 표시 */}
        {result && (
          <div className="space-y-4">
            <div className={`p-4 rounded-lg ${
              result.isCorrect 
                ? "bg-green-50 border border-green-200" 
                : "bg-red-50 border border-red-200"
            }`}>
              <div className="flex items-center space-x-2">
                {result.isCorrect ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-600" />
                )}
                <span className={`font-medium ${
                  result.isCorrect ? "text-green-800" : "text-red-800"
                }`}>
                  {result.isCorrect ? "정답입니다! 🎉" : "틀렸습니다 😢"}
                </span>
              </div>
            </div>

            {/* 설명 */}
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">설명</h4>
              <p className="text-blue-800">{result.explanation}</p>
              {question.code && (
                <pre className="mt-2 p-2 bg-gray-100 rounded text-sm overflow-x-auto">
                  <code>{question.code}</code>
                </pre>
              )}
            </div>

            {/* 다음 버튼 */}
            <Button onClick={handleNext} className="w-full">
              다음 문제
            </Button>
          </div>
        )}

        {/* 오류 메시지 */}
        {submitAnswer.error && (
          <div className="flex items-center space-x-2 text-red-600">
            <AlertCircle className="h-4 w-4" />
            <span>{submitAnswer.error.message}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
