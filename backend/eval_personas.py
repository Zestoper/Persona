"""
캐릭터 품질 기준점 측정 스크립트 (DB는 읽기만 함).

    cd backend
    source venv/bin/activate
    python eval_personas.py --limit 5                 # 공개 캐릭터 5개
    python eval_personas.py --ids 1 7 21              # 특정 캐릭터
    python eval_personas.py --limit 5 --tag baseline  # 결과 파일 이름 꼬리표

결과
- eval_reports/<날짜>_<tag>.json  : 질문·응답·점수·이유 전체
- eval_reports/<날짜>_<tag>.md    : 영역별 점수 표 + 낮은 점수 사례

캐릭터 1개당 Groq 호출 약 23회 (질문 생성 1 + 질문 11개 × 응답·채점 2 + 긴 대화 요약 1)
"""
import argparse
import asyncio
import json
import logging
import os

os.environ.setdefault("DEBUG", "false")   # DEBUG=True면 SQL 로그가 화면을 덮는다
from datetime import datetime
from pathlib import Path

from sqlalchemy import select

from app.db.database import AsyncSessionLocal
from app.models.persona import Persona
from app.services.persona_eval import CATEGORY_LABELS, evaluate_persona

logging.basicConfig(level=logging.WARNING)
for noisy in ("sqlalchemy.engine", "httpx"):
    logging.getLogger(noisy).setLevel(logging.WARNING)

OUT_DIR = Path(__file__).parent / "eval_reports"


async def load_personas(ids: list[int] | None, limit: int) -> list[Persona]:
    async with AsyncSessionLocal() as db:
        q = select(Persona)
        q = q.where(Persona.id.in_(ids)) if ids else q.where(Persona.is_public.is_(True)).order_by(Persona.id).limit(limit)
        return list((await db.execute(q)).scalars().all())


def to_markdown(reports: list[dict], tag: str) -> str:
    keys = list(CATEGORY_LABELS)
    lines = [f"# 캐릭터 품질 테스트 — {tag}", "",
             "| 캐릭터 | 종합 | " + " | ".join(CATEGORY_LABELS[k] for k in keys) + " | 프롬프트 유출 |",
             "|---|---|" + "---|" * len(keys) + "---|"]
    for r in reports:
        cells = [str(r["categories"].get(k, {}).get("score", "-")) for k in keys]
        lines.append(f"| {r['persona_name']} | **{r['overall']}** | " + " | ".join(cells)
                     + f" | {r['leak_count']}회 |")

    def avg(vals):
        vals = [v for v in vals if v is not None]
        return round(sum(vals) / len(vals), 1) if vals else "-"
    lines.append("| **평균** | **{}** | ".format(avg([r["overall"] for r in reports]))
                 + " | ".join(str(avg([r["categories"].get(k, {}).get("score") for r in reports])) for k in keys)
                 + f" | {sum(1 for r in reports if r['leak_count'])}/{len(reports)} 캐릭터 |")

    lines += ["", "## 낮은 점수 사례 (2점 이하)", ""]
    for r in reports:
        for item in r["results"]:
            if item["score"] is not None and item["score"] <= 2:
                lines += [f"- **{r['persona_name']} / {CATEGORY_LABELS[item['category']]} ({item['score']}점)**",
                          f"  - 질문: {item['question']}",
                          f"  - 응답: {item['answer'][:200]}",
                          f"  - 이유: {item['reason']}"]
    return "\n".join(lines) + "\n"


async def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--ids", type=int, nargs="*")
    ap.add_argument("--limit", type=int, default=5)
    ap.add_argument("--tag", default="baseline")
    args = ap.parse_args()

    personas = await load_personas(args.ids, args.limit)
    print(f"평가 대상 {len(personas)}개: {', '.join(p.name for p in personas)}\n")

    reports = []
    for i, p in enumerate(personas, 1):
        print(f"[{i}/{len(personas)}] {p.name} 평가 중...", flush=True)
        try:
            r = await evaluate_persona(p)
        except Exception as e:  # noqa: BLE001
            print(f"   실패: {type(e).__name__}: {e}")
            continue
        reports.append(r)
        cats = " / ".join(f"{c['label']} {c['score']}" for c in r["categories"].values())
        leak = f" / 프롬프트 유출 {r['leak_count']}회" if r["leak_count"] else ""
        print(f"   종합 {r['overall']}점 ({r['seconds']}초) — {cats}{leak}")

    if not reports:
        return
    OUT_DIR.mkdir(exist_ok=True)
    stem = f"{datetime.now():%Y%m%d_%H%M}_{args.tag}"
    (OUT_DIR / f"{stem}.json").write_text(json.dumps(reports, ensure_ascii=False, indent=2), encoding="utf-8")
    (OUT_DIR / f"{stem}.md").write_text(to_markdown(reports, args.tag), encoding="utf-8")
    print(f"\n저장: eval_reports/{stem}.md / .json")


if __name__ == "__main__":
    asyncio.run(main())
