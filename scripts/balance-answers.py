"""
정답 인덱스 밸런싱 스크립트
all-questions.json의 정답 분포를 균등하게 재조정합니다.
"""
import json
import random
import argparse
from collections import Counter
from pathlib import Path


def load_questions(input_file: str) -> list:
    """문제 데이터 로드"""
    with open(input_file, "r", encoding="utf-8") as f:
        return json.load(f)


def analyze_answer_distribution(questions: list) -> dict:
    """정답 분포 분석"""
    counter = Counter(q["correctAnswer"] for q in questions)
    total = len(questions)
    
    return {
        "distribution": dict(counter),
        "total": total,
        "ratio": {k: f"{(v/total)*100:.1f}%" for k, v in counter.items()}
    }


def balance_answers(questions: list, target_ratio: float = 0.5) -> list:
    """
    정답 인덱스를 균등하게 재분배
    
    Args:
        questions: 문제 리스트
        target_ratio: 목표 균등 비율 (기본값 0.5 = 50:50)
    
    Returns:
        정답 분포가 균형잡힌 문제 리스트
    """
    balanced = []
    
    for q in questions:
        # 딕셔너리 복사 (원본 보존)
        balanced_q = q.copy()
        
        # options가 2개가 아닌 경우 스킵
        if len(balanced_q.get("options", [])) != 2:
            balanced.append(balanced_q)
            continue
        
        # 50% 확률로 정답 위치 반전
        if random.random() < target_ratio:
            # 선택지 순서 교환 (리스트도 복사)
            balanced_q["options"] = balanced_q["options"].copy()
            balanced_q["options"].reverse()
            # 정답 인덱스 반전 (0 ↔ 1)
            balanced_q["correctAnswer"] = 1 - balanced_q["correctAnswer"]
        
        balanced.append(balanced_q)
    
    return balanced


def save_questions(questions: list, output_file: str):
    """문제 데이터 저장"""
    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(questions, f, ensure_ascii=False, indent=2)


def main():
    parser = argparse.ArgumentParser(description="정답 인덱스 밸런싱 도구")
    parser.add_argument(
        "--input",
        default="all-questions.json",
        help="입력 JSON 파일 경로"
    )
    parser.add_argument(
        "--output",
        default="balanced-questions.json",
        help="출력 JSON 파일 경로"
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="실제 변경 없이 분석만 수행"
    )
    parser.add_argument(
        "--seed",
        type=int,
        default=42,
        help="랜덤 시드 (재현 가능성을 위해)"
    )
    
    args = parser.parse_args()
    
    # 시드 설정
    random.seed(args.seed)
    
    print("=" * 60)
    print("📊 정답 인덱스 밸런싱 도구")
    print("=" * 60)
    
    # 1. 데이터 로드
    print(f"\n📁 입력 파일: {args.input}")
    questions = load_questions(args.input)
    print(f"✅ 총 {len(questions)}개 문제 로드 완료")
    
    # 2. 원본 분포 분석
    print("\n📈 [원본] 정답 분포 분석:")
    original_dist = analyze_answer_distribution(questions)
    print(f"   총 문제 수: {original_dist['total']}")
    print(f"   정답 인덱스 분포: {original_dist['distribution']}")
    print(f"   비율: {original_dist['ratio']}")
    
    # 3. 밸런싱 수행
    if args.dry_run:
        print("\n🔍 [DRY RUN] 변경 사항 미리보기:")
        # 샘플 10개만 보여줌
        sample = questions[:10]
        balanced_sample = balance_answers(sample.copy(), target_ratio=0.5)
        
        changes = sum(
            1 for orig, bal in zip(sample, balanced_sample)
            if orig["correctAnswer"] != bal["correctAnswer"]
        )
        print(f"   샘플 10개 중 변경 예상: {changes}개")
    else:
        print("\n🔄 정답 밸런싱 수행 중...")
        balanced_questions = balance_answers(questions, target_ratio=0.5)
        
        # 4. 결과 분포 분석
        print("\n📈 [밸런싱 후] 정답 분포 분석:")
        balanced_dist = analyze_answer_distribution(balanced_questions)
        print(f"   총 문제 수: {balanced_dist['total']}")
        print(f"   정답 인덱스 분포: {balanced_dist['distribution']}")
        print(f"   비율: {balanced_dist['ratio']}")
        
        # 5. 저장
        print(f"\n💾 출력 파일: {args.output}")
        save_questions(balanced_questions, args.output)
        print("✅ 밸런싱 완료!")
        
        # 6. 변경 통계
        changes = sum(
            1 for orig, bal in zip(questions, balanced_questions)
            if orig["correctAnswer"] != bal["correctAnswer"]
        )
        print(f"\n📊 변경 사항:")
        print(f"   변경된 문제 수: {changes}개")
        print(f"   변경 비율: {(changes/len(questions))*100:.1f}%")
    
    print("\n" + "=" * 60)


if __name__ == "__main__":
    main()
