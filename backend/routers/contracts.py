from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from sqlalchemy.orm import Session
from models import Contract, User
from schemas import ContractUpload
from auth import get_current_user
from database import get_db
from utils import extract_text_from_file, analyze_contract
import shutil
import os

router = APIRouter(prefix="/contracts", tags=["contracts"])

@router.post("/upload")
async def upload_contract(
    file: UploadFile = File(...),
    jurisdiction: str = "India",
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Save file
    file_path = f"uploads/{current_user.id}_{file.filename}"
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    text = extract_text_from_file(file_path)
    analysis = analyze_contract(text, jurisdiction)
    
    new_contract = Contract(
        filename=file.filename,
        file_path=file_path,
        jurisdiction=jurisdiction,
        raw_text=text,
        risk_report=str(analysis),  # store as string for now
        user_id=current_user.id
    )
    db.add(new_contract)
    db.commit()
    db.refresh(new_contract)
    
    return {"id": new_contract.id, "filename": file.filename, "analysis": analysis}