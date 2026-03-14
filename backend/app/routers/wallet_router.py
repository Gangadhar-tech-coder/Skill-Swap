"""
Wallet router: view credit balance and transaction history.
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List

from ..database import get_db
from ..models import User, Transaction, TransactionType
from ..schemas import WalletResponse, TransactionResponse
from ..auth import get_current_user

router = APIRouter(prefix="/api/wallet", tags=["Wallet"])


@router.get("/", response_model=WalletResponse)
def get_wallet(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get the current user's wallet balance and credit summary."""
    # Calculate total earned
    total_earned = db.query(func.coalesce(func.sum(Transaction.credits), 0)).filter(
        Transaction.user_id == current_user.id,
        Transaction.type == TransactionType.EARNED
    ).scalar()

    # Calculate total spent
    total_spent = db.query(func.coalesce(func.sum(Transaction.credits), 0)).filter(
        Transaction.user_id == current_user.id,
        Transaction.type == TransactionType.SPENT
    ).scalar()

    return WalletResponse(
        skill_credits=current_user.skill_credits,
        total_earned=float(total_earned),
        total_spent=float(total_spent)
    )


@router.get("/transactions", response_model=List[TransactionResponse])
def get_transactions(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get the current user's transaction history, newest first."""
    return db.query(Transaction).filter(
        Transaction.user_id == current_user.id
    ).order_by(Transaction.created_at.desc()).limit(50).all()
