"""
家长 API 路由
"""
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.database import SessionLocal, engine, Base
from app.models.models import Parent, Child, EmotionDiary, MessageBottle
from app.schemas.schemas import (
    ParentRegister, ParentLogin, ParentResponse,
    ChildCreate, ChildResponse,
    EmotionDiaryResponse, MessageBottleResponse,
    Response
)
from pydantic import BaseModel
import hashlib

# 创建数据库表
Base.metadata.create_all(bind=engine)

router = APIRouter()


# 依赖项：获取数据库会话
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# 密码哈希工具
def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()


# 手表绑定请求模型
class WatchBindRequest(BaseModel):
    watch_id: str


class ChildBindRequest(BaseModel):
    nickname: str
    watch_id: str | None = None


# 依赖项：获取数据库会话
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# 密码哈希工具
def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()


# ============ 家长认证 ============
@router.post("/register", response_model=Response)
def parent_register(request: ParentRegister, db: Session = Depends(get_db)):
    """家长注册"""
    # 检查昵称是否已存在
    existing = db.query(Parent).filter(Parent.nickname == request.nickname).first()
    if existing:
        return Response(code=400, message="昵称已被使用", data=None)

    # 创建家长账号
    parent = Parent(
        nickname=request.nickname,
        password_hash=hash_password(request.password),
        phone=request.phone
    )
    db.add(parent)
    db.commit()
    db.refresh(parent)

    return Response(code=0, message="注册成功", data={"parent_id": parent.id})


@router.post("/login", response_model=Response)
def parent_login(request: ParentLogin, db: Session = Depends(get_db)):
    """家长登录"""
    parent = db.query(Parent).filter(Parent.nickname == request.nickname).first()
    if not parent:
        return Response(code=401, message="用户不存在", data=None)

    if parent.password_hash != hash_password(request.password):
        return Response(code=401, message="密码错误", data=None)

    return Response(code=0, message="登录成功", data={
        "parent_id": parent.id,
        "nickname": parent.nickname,
        "token": hash_password(f"{parent.id}:{parent.nickname}")  # 简单 token
    })


@router.get("/{parent_id}/children", response_model=Response)
def get_children(parent_id: int, db: Session = Depends(get_db)):
    """获取家长绑定的孩子列表"""
    parent = db.query(Parent).filter(Parent.id == parent_id).first()
    if not parent:
        return Response(code=404, message="家长不存在", data=None)

    children = parent.children
    return Response(code=0, message="success", data={
        "children": [{"id": c.id, "nickname": c.nickname, "avatar": c.avatar} for c in children]
    })


@router.post("/{parent_id}/children", response_model=Response)
def add_child(parent_id: int, request: ChildBindRequest, db: Session = Depends(get_db)):
    """添加孩子（绑定）"""
    parent = db.query(Parent).filter(Parent.id == parent_id).first()
    if not parent:
        return Response(code=404, message="家长不存在", data=None)

    # 检查孩子昵称是否已存在
    existing = db.query(Child).filter(Child.nickname == request.nickname).first()
    if existing:
        # 已存在则绑定到当前家长（如果未绑定）
        if not existing.parent_id:
            existing.parent_id = parent_id
            db.commit()
            return Response(code=0, message="绑定成功", data={"child_id": existing.id})
        else:
            return Response(code=400, message="该昵称已被其他孩子使用", data=None)

    # 创建新孩子
    child = Child(
        nickname=request.nickname,
        parent_id=parent_id
    )
    db.add(child)
    db.commit()
    db.refresh(child)

    return Response(code=0, message="添加成功", data={"child_id": child.id})


# ============ 手表绑定 ============
@router.post("/{parent_id}/bind-watch", response_model=Response)
def bind_watch(parent_id: int, request: WatchBindRequest, db: Session = Depends(get_db)):
    """绑定孩子的手表"""
    parent = db.query(Parent).filter(Parent.id == parent_id).first()
    if not parent:
        return Response(code=404, message="家长不存在", data=None)

    # 检查手表 ID 是否已被绑定
    child = db.query(Child).filter(Child.watch_id == request.watch_id).first()

    if child:
        # 手表已被绑定，返回孩子信息
        if child.parent_id:
            return Response(code=0, message="手表已绑定", data={
                "child_id": child.id,
                "child_nickname": child.nickname
            })
        else:
            # 手表存在但未绑定家长，绑定到当前家长
            child.parent_id = parent_id
            db.commit()
            return Response(code=0, message="绑定成功", data={
                "child_id": child.id,
                "child_nickname": child.nickname
            })
    else:
        # 手表未注册，创建新孩子（需要家长先添加孩子）
        return Response(code=404, message="手表未注册，请先在家长端添加孩子", data=None)


@router.post("/{parent_id}/bind-watch-child", response_model=Response)
def bind_watch_with_child(parent_id: int, request: ChildBindRequest, db: Session = Depends(get_db)):
    """绑定手表并创建/更新孩子信息"""
    parent = db.query(Parent).filter(Parent.id == parent_id).first()
    if not parent:
        return Response(code=404, message="家长不存在", data=None)

    if not request.watch_id:
        return Response(code=400, message="手表 ID 不能为空", data=None)

    # 检查手表 ID 是否已被绑定
    child = db.query(Child).filter(Child.watch_id == request.watch_id).first()

    if child:
        # 手表已存在，更新绑定
        child.parent_id = parent_id
        if request.nickname:
            child.nickname = request.nickname
        db.commit()
        return Response(code=0, message="绑定成功", data={
            "child_id": child.id,
            "child_nickname": child.nickname
        })
    else:
        # 创建新孩子并绑定手表
        child = Child(
            nickname=request.nickname,
            watch_id=request.watch_id,
            parent_id=parent_id
        )
        db.add(child)
        db.commit()
        db.refresh(child)
        return Response(code=0, message="绑定成功", data={
            "child_id": child.id,
            "child_nickname": child.nickname
        })


# 通过手表 ID 获取孩子信息
@router.get("/watch/{watch_id}/child", response_model=Response)
def get_child_by_watch(watch_id: str, db: Session = Depends(get_db)):
    """通过手表 ID 获取孩子信息"""
    child = db.query(Child).filter(Child.watch_id == watch_id).first()
    if not child:
        return Response(code=404, message="手表未注册", data=None)

    return Response(code=0, message="success", data={
        "child": {
            "id": child.id,
            "nickname": child.nickname,
            "watch_id": child.watch_id
        }
    })


# ============ 情绪日记查看 ============
@router.get("/children/{child_id}/emotions", response_model=Response)
def get_child_emotions(child_id: int, db: Session = Depends(get_db)):
    """查看孩子的情绪日记"""
    child = db.query(Child).filter(Child.id == child_id).first()
    if not child:
        return Response(code=404, message="孩子不存在", data=None)

    emotions = db.query(EmotionDiary).filter(
        EmotionDiary.child_id == child_id
    ).order_by(desc(EmotionDiary.created_at)).limit(50).all()

    return Response(code=0, message="success", data={
        "emotions": [
            {
                "id": e.id,
                "emotion_type": e.emotion_type,
                "emotion_label": e.emotion_label,
                "content": e.content,
                "ai_response": e.ai_response,
                "created_at": e.created_at.isoformat()
            }
            for e in emotions
        ]
    })


# ============ 漂流瓶查看 ============
@router.get("/children/{child_id}/bottles", response_model=Response)
def get_child_bottles(child_id: int, db: Session = Depends(get_db)):
    """查看孩子的漂流瓶"""
    child = db.query(Child).filter(Child.id == child_id).first()
    if not child:
        return Response(code=404, message="孩子不存在", data=None)

    bottles = db.query(MessageBottle).filter(
        MessageBottle.child_id == child_id
    ).order_by(desc(MessageBottle.created_at)).limit(50).all()

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


# ============ 统计信息 ============
@router.get("/children/{child_id}/stats", response_model=Response)
def get_child_stats(child_id: int, db: Session = Depends(get_db)):
    """获取孩子的统计信息"""
    child = db.query(Child).filter(Child.id == child_id).first()
    if not child:
        return Response(code=404, message="孩子不存在", data=None)

    # 情绪统计
    total_emotions = db.query(EmotionDiary).filter(EmotionDiary.child_id == child_id).count()

    # 各情绪数量
    emotion_counts = {}
    for emotion_type in ["happy", "calm", "angry", "scared", "sad", "excited"]:
        count = db.query(EmotionDiary).filter(
            EmotionDiary.child_id == child_id,
            EmotionDiary.emotion_type == emotion_type
        ).count()
        emotion_counts[emotion_type] = count

    # 漂流瓶数量
    total_bottles = db.query(MessageBottle).filter(MessageBottle.child_id == child_id).count()

    return Response(code=0, message="success", data={
        "total_emotions": total_emotions,
        "emotion_counts": emotion_counts,
        "total_bottles": total_bottles
    })
