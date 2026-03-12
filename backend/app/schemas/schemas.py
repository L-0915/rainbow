"""
Pydantic 数据模式
"""
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


# ============ 家长相关 ============
class ParentRegister(BaseModel):
    """家长注册"""
    nickname: str
    password: str
    phone: Optional[str] = None


class ParentLogin(BaseModel):
    """家长登录"""
    nickname: str
    password: str


class ParentResponse(BaseModel):
    """家长信息响应"""
    id: int
    nickname: str
    phone: Optional[str] = None

    class Config:
        from_attributes = True


# ============ 孩子相关 ============
class ChildCreate(BaseModel):
    """创建孩子"""
    nickname: str
    avatar: Optional[str] = "default.png"


class ChildResponse(BaseModel):
    """孩子信息响应"""
    id: int
    nickname: str
    avatar: str
    created_at: datetime

    class Config:
        from_attributes = True


# ============ 情绪日记相关 ============
class EmotionDiaryCreate(BaseModel):
    """创建情绪日记"""
    emotion_type: str
    emotion_label: str
    content: Optional[str] = None
    ai_response: Optional[str] = None


class EmotionDiaryResponse(BaseModel):
    """情绪日记响应"""
    id: int
    emotion_type: str
    emotion_label: str
    content: Optional[str] = None
    ai_response: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


# ============ 漂流瓶相关 ============
class MessageBottleCreate(BaseModel):
    """创建漂流瓶"""
    content: str
    mood: Optional[str] = None


class MessageBottleResponse(BaseModel):
    """漂流瓶响应"""
    id: int
    content: str
    mood: Optional[str] = None
    created_at: datetime
    is_read: bool = False

    class Config:
        from_attributes = True


# ============ 通用响应 ============
class Response(BaseModel):
    """通用响应包装"""
    code: int = 0
    message: str = "success"
    data: Optional[dict] = None
