from pydantic import BaseModel, EmailStr, field_validator

from datetime import datetime

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    nickname: str

    @field_validator("password")
    @classmethod
    def password_must_be_strong(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("비밀번호는 8자 이상이어야 합니다.")
        return v

    @field_validator("nickname")
    @classmethod
    def nickname_must_be_valid(cls, v: str) -> str:
        v = v.strip()
        if len(v) < 2:
            raise ValueError("닉네임은 2자 이상이어야 합니다.")
        if len(v) > 20:
            raise ValueError("닉네임은 20자 이하여야 합니다.")
        return v

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: int
    email: str
    nickname: str
    is_active: bool
    is_admin: bool = False
    created_at: datetime

    class Config:

        from_attributes = True

class UserUpdate(BaseModel):
    nickname: str

    @field_validator("nickname")
    @classmethod
    def nickname_must_be_valid(cls, v: str) -> str:
        v = v.strip()
        if len(v) < 2:
            raise ValueError("닉네임은 2자 이상이어야 합니다.")
        if len(v) > 20:
            raise ValueError("닉네임은 20자 이하여야 합니다.")
        return v

class PasswordUpdate(BaseModel):
    current_password: str
    new_password: str

    @field_validator("new_password")
    @classmethod
    def new_password_must_be_strong(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("비밀번호는 8자 이상이어야 합니다.")
        return v

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

class TokenData(BaseModel):
    user_id: int | None = None
