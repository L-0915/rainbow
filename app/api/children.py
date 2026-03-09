"""
孩子 API 路由 - 用于孩子端记录情绪、漂流瓶等
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.database import SessionLocal, engine, Base
from app.models.models import Child, EmotionDiary, MessageBottle
from app.schemas.schemas import (
    EmotionDiaryCreate, MessageBottleCreate,
    EmotionDiaryResponse, MessageBottleResponse,
    Response
)

# 创建数据库表
Base.metadata.create_all(bind=engine)

router = APIRouter()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ============ 情绪日记 ============
@router.post("/emotions", response_model=Response)
def create_emotion(request: EmotionDiaryCreate, child_id: int = 1, db: Session = Depends(get_db)):
    """记录情绪日记（孩子端）"""
    child = db.query(Child).filter(Child.id == child_id).first()
    if not child:
        # 自动创建默认孩子
        child = Child(nickname="宝贝", avatar="default.png", id=child_id)
        db.add(child)
        db.commit()

    diary = EmotionDiary(
        child_id=child_id,
        emotion_type=request.emotion_type,
        emotion_label=request.emotion_label,
        content=request.content,
        ai_response=request.ai_response
    )
    db.add(diary)
    db.commit()
    db.refresh(diary)

    return Response(code=0, message="记录成功", data={"diary_id": diary.id})


@router.get("/emotions", response_model=Response)
def get_emotions(child_id: int = 1, db: Session = Depends(get_db)):
    """获取情绪日记（孩子端）"""
    emotions = db.query(EmotionDiary).filter(
        EmotionDiary.child_id == child_id
    ).order_by(desc(EmotionDiary.created_at)).limit(20).all()

    return Response(code=0, message="success", data={
        "emotions": [
            {
                "id": e.id,
                "emotion_type": e.emotion_type,
                "emotion_label": e.emotion_label,
                "content": e.content,
                "created_at": e.created_at.isoformat()
            }
            for e in emotions
        ]
    })


# ============ 漂流瓶 ============
@router.post("/bottles", response_model=Response)
def throw_bottle(request: MessageBottleCreate, child_id: int = 1, db: Session = Depends(get_db)):
    """扔漂流瓶（孩子端）"""
    child = db.query(Child).filter(Child.id == child_id).first()
    if not child:
        child = Child(nickname="宝贝", avatar="default.png", id=child_id)
        db.add(child)
        db.commit()

    bottle = MessageBottle(
        child_id=child_id,
        content=request.content,
        mood=request.mood
    )
    db.add(bottle)
    db.commit()
    db.refresh(bottle)

    return Response(code=0, message="漂流瓶已扔出", data={"bottle_id": bottle.id})


@router.get("/bottles", response_model=Response)
def get_bottles(child_id: int = 1, db: Session = Depends(get_db)):
    """获取我的漂流瓶（孩子端）"""
    bottles = db.query(MessageBottle).filter(
        MessageBottle.child_id == child_id
    ).order_by(desc(MessageBottle.created_at)).limit(20).all()

    return Response(code=0, message="success", data={
        "bottles": [
            {
                "id": b.id,
                "content": b.content,
                "mood": b.mood,
                "created_at": b.created_at.isoformat(),
                "is_read": b.is_read
            }
            for b in bottles
        ]
    })
