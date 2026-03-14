"""
用户认证 API 路由
"""
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import Optional
import jwt
import hashlib

from app.database import SessionLocal, engine, Base
from app.models.models import Parent, Child
from app.schemas.schemas import ParentRegister, ParentLogin, ParentResponse, Response

# 创建数据库表
Base.metadata.create_all(bind=engine)

router = APIRouter()

# JWT 配置
SECRET_KEY = "rainbow-helper-secret-key-2024-change-in-production"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 天有效期

# 密码加密
def hash_password(password: str) -> str:
    """使用 SHA-256 加密密码"""
    return hashlib.sha256(password.encode()).hexdigest()


def verify_password(password: str, hashed: str) -> bool:
    """验证密码"""
    return hash_password(password) == hashed


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """创建 JWT token"""
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=15))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


security = HTTPBearer(auto_error=False)


async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: Session = Depends(get_db)
):
    """获取当前登录用户"""
    if not credentials:
        return None

    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: int = payload.get("user_id")
        user_type: str = payload.get("user_type")

        if user_type == "parent":
            return db.query(Parent).filter(Parent.id == user_id).first()
        elif user_type == "child":
            return db.query(Child).filter(Child.id == user_id).first()
        return None
    except jwt.PyJWTError:
        return None


@router.post("/register", response_model=Response)
def register(request: ParentRegister, db: Session = Depends(get_db)):
    """家长注册"""
    # 检查昵称是否已存在
    existing = db.query(Parent).filter(
        (Parent.nickname == request.nickname) | (Parent.phone == request.phone)
    ).first()

    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="用户名或手机号已被使用"
        )

    # 创建家长账户
    parent = Parent(
        nickname=request.nickname,
        password_hash=hash_password(request.password),
        phone=request.phone
    )

    # 自动创建默认孩子
    child = Child(
        nickname=f"{request.nickname}的宝贝",
        avatar="default.png",
        parent=parent
    )

    db.add(parent)
    db.add(child)
    db.commit()
    db.refresh(parent)
    db.refresh(child)

    # 创建 token
    access_token = create_access_token(
        data={"user_id": parent.id, "user_type": "parent"},
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )

    child_token = create_access_token(
        data={"user_id": child.id, "user_type": "child"},
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )

    return Response(
        code=0,
        message="注册成功",
        data={
            "parent": {
                "id": parent.id,
                "nickname": parent.nickname,
                "phone": parent.phone
            },
            "child": {
                "id": child.id,
                "nickname": child.nickname,
                "avatar": child.avatar
            },
            "parent_token": access_token,
            "child_token": child_token
        }
    )


@router.post("/login", response_model=Response)
def login(request: ParentLogin, db: Session = Depends(get_db)):
    """家长登录"""
    # 查找家长（支持昵称或手机号登录）
    parent = db.query(Parent).filter(
        (Parent.nickname == request.nickname) | (Parent.phone == request.nickname)
    ).first()

    if not parent:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="用户不存在"
        )

    # 验证密码
    if not verify_password(request.password, parent.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="密码错误"
        )

    # 获取孩子信息
    child = db.query(Child).filter(Child.parent_id == parent.id).first()

    # 创建 token
    access_token = create_access_token(
        data={"user_id": parent.id, "user_type": "parent"},
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )

    child_token = None
    if child:
        child_token = create_access_token(
            data={"user_id": child.id, "user_type": "child"},
            expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        )

    return Response(
        code=0,
        message="登录成功",
        data={
            "parent": {
                "id": parent.id,
                "nickname": parent.nickname,
                "phone": parent.phone
            },
            "child": {
                "id": child.id if child else None,
                "nickname": child.nickname if child else None,
                "avatar": child.avatar if child else None
            },
            "parent_token": access_token,
            "child_token": child_token
        }
    )


@router.get("/me", response_model=Response)
async def get_current_user_info(
    current_user: Optional[Parent] = Depends(get_current_user)
):
    """获取当前用户信息"""
    if not current_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="未登录"
        )

    child = current_user.children[0] if current_user.children else None

    return Response(
        code=0,
        message="success",
        data={
            "parent": {
                "id": current_user.id,
                "nickname": current_user.nickname,
                "phone": current_user.phone
            },
            "child": {
                "id": child.id if child else None,
                "nickname": child.nickname if child else None,
                "avatar": child.avatar if child else None
            }
        }
    )


@router.post("/child/login", response_model=Response)
def child_login(child_id: int, db: Session = Depends(get_db)):
    """孩子登录（简化版，用于儿童端）"""
    child = db.query(Child).filter(Child.id == child_id).first()

    if not child:
        # 创建默认孩子
        child = Child(id=child_id, nickname="宝贝", avatar="default.png")
        db.add(child)
        db.commit()
        db.refresh(child)

    child_token = create_access_token(
        data={"user_id": child.id, "user_type": "child"},
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )

    return Response(
        code=0,
        message="登录成功",
        data={
            "child": {
                "id": child.id,
                "nickname": child.nickname,
                "avatar": child.avatar
            },
            "token": child_token
        }
    )
