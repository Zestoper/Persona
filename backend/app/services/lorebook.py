"""
캐릭터 설정집(lorebook) — 대화에 관련된 설정만 골라 시스템 프롬프트에 넣는다 (검색 증강 생성 · RAG).

왜 필요한가
- 크리에이터가 세계관 · 주변 인물 · 과거 사건을 자세히 쓸수록 시스템 프롬프트가 길어진다.
- 매 메시지마다 전부 보내면 토큰이 낭비되고 모델이 긴 프롬프트의 중간 내용을 놓친다.
- 그래서 설정은 항목별로 저장하고 '지금 대화에 필요한 항목'만 넣는다.

고르는 규칙 (순서대로)
1) always_on 항목: 항상 (핵심 세계관)
2) 키워드 트리거: 크리에이터가 정한 키워드가 최근 대화에 나오면 반드시
3) 남은 자리는 제목 · 내용과 최근 대화의 단어 겹침 점수가 높은 순
전체 길이는 MAX_CHARS 안으로 자른다.
"""
import re

MAX_ENTRIES = 4          # always_on 제외하고 한 번에 넣는 최대 항목 수
MAX_CHARS = 2400         # 설정집 블록 전체 최대 길이
MIN_OVERLAP = 2          # 키워드 트리거 없이 들어가려면 겹치는 단어가 이만큼은 있어야 함

_SUFFIX_RE = re.compile(
    r"(으로부터|에게서|에서는|에게는|으로는|이라서|라서|이랑|에서|에게|으로|부터|까지|처럼|보다|하고|이나|"
    r"은|는|이|가|을|를|에|의|도|만|과|와|로|랑|야|아|요|다)$"
)
_STOP = {"그냥", "진짜", "너무", "정말", "그리고", "그래서", "하지만", "근데", "우리", "있어", "없어", "뭐야", "어때"}


def tokens(text: str) -> set[str]:
    out = set()
    for w in re.findall(r"[가-힣A-Za-z0-9]{2,}", text or ""):
        w = _SUFFIX_RE.sub("", w.lower())
        if len(w) >= 2 and w not in _STOP:
            out.add(w)
    return out


def _keywords(entry) -> list[str]:
    return [k.strip().lower() for k in (entry.keywords or "").split(",") if k.strip()]


def select_entries(entries: list, recent_text: str) -> list:
    """최근 대화(recent_text)에 맞는 설정집 항목을 고른다."""
    text = (recent_text or "").lower()
    words = tokens(recent_text)
    always = [e for e in entries if e.always_on]
    triggered, scored = [], []
    for e in entries:
        if e.always_on:
            continue
        if any(k and k in text for k in _keywords(e)):
            triggered.append(e)
            continue
        overlap = len(words & (tokens(e.title) | tokens(e.content[:600]) | set(_keywords(e))))
        if overlap >= MIN_OVERLAP:
            scored.append((overlap, e))
    scored.sort(key=lambda x: -x[0])
    picked = always + (triggered + [e for _, e in scored])[:MAX_ENTRIES]

    out, used = [], 0
    for e in picked:
        size = len(e.title) + len(e.content)
        if used + size > MAX_CHARS and out:
            break
        out.append(e)
        used += size
    return out


def lore_prompt(selected: list) -> str:
    """시스템 프롬프트 뒤에 붙일 설정집 블록.

    항목 줄을 '-' 로 시작하지 않는다 — prompt_guard 가 '-' 로 시작하는 행동 지침 문장을
    유출 판정 기준으로 쓰기 때문에, 캐릭터가 설정 속 사실을 말하는 것까지 유출로 잡히지 않게 한다.
    """
    if not selected:
        return ""
    lines = ["", "", "[설정집 — 지금 대화와 관련된 캐릭터 설정]"]
    for e in selected:
        lines.append(f"■ {e.title}: {e.content.strip()}")
    lines.append("위 설정과 모순되지 않게 답하되 설정을 목록처럼 나열하거나 설정집이 있다고 말하지 마세요.")
    return "\n".join(lines)
