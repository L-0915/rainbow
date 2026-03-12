"""
数据库模型
"""
from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base


class Parent(Base):
    """家长表"""
    __tablename__ = "parents"

    id = Column(Integer, primary_key=True, index=True)
    nickname = Column(String(50), unique=True, index=True)
    password_hash = Column(String(100))
    phone = Column(String(20), unique=True, index=True)
    created_at = Column(DateTime, default=datetime.now)

    # 关联的孩子
    children = relationship("Child", back_populates="parent")


class Child(Base):
    """孩子表"""
    __tablename__ = "children"

    id = Column(Integer, primary_key=True, index=True)
    nickname = Column(String(50), unique=True, index=True)
    avatar = Column(String(100), default="default.png")
    watch_id = Column(String(50), unique=True, index=True, nullable=True)  # 智能手表 ID
    parent_id = Column(Integer, ForeignKey("parents.id"))
    created_at = Column(DateTime, default=datetime.now)

    # 关联家长
    parent = relationship("Parent", back_populates="children")
    # 情绪日记
    emotions = relationship("EmotionDiary", back_populates="child", cascade="all, delete-orphan")
    # 漂流瓶
    bottles = relationship("MessageBottle", back_populates="child", cascade="all, delete-orphan")


class EmotionDiary(Base):
    """情绪日记表"""
    __tablename__ = "emotion_diaries"

    id = Column(Integer, primary_key=True, index=True)
    child_id = Column(Integer, ForeignKey("children.id"))
    emotion_type = Column(String(20))  # happy, calm, angry, scared, sad, excited
    emotion_label = Column(String(20))  # 中文标签
    content = Column(Text, nullable=True)  # 孩子记录的内容
    ai_response = Column(Text, nullable=True)  # AI 回复
    created_at = Column(DateTime, default=datetime.now, index=True)

    # 关联孩子
    child = relationship("Child", back_populates="emotions")


class MessageBottle(Base):
    """漂流瓶表"""
    __tablename__ = "message_bottles"

    id = Column(Integer, primary_key=True, index=True)
    child_id = Column(Integer, ForeignKey("children.id"))
    content = Column(Text)  # 瓶子里的消息
    mood = Column(String(20))  # 扔瓶子时的心情
    created_at = Column(DateTime, default=datetime.now, index=True)
    is_read = Column(Boolean, default=False)

    # 关联孩子
    child = relationship("Child", back_populates="bottles")
