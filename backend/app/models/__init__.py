# ── 모든 모델을 여기서 한꺼번에 임포트 ───────────────────
# 이렇게 해야 main.py의 Base.metadata.create_all()이
# 모든 테이블을 한 번에 인식하고 생성할 수 있음.
# 비유: 팀원 전원이 회의실에 모여야 회의가 시작되는 것처럼,
#       모든 모델이 여기 불러와져야 DB 테이블 생성이 작동함.

from app.models.user import User
from app.models.persona import Persona
from app.models.conversation import Conversation
from app.models.message import Message
from app.models.report import Report

# 외부에서 `from app.models import User` 형태로 깔끔하게 임포트 가능
__all__ = ["User", "Persona", "Conversation", "Message", "Report"]
