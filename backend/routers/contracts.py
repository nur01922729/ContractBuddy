from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from sqlalchemy.orm import Session
from models import Contract, User
from auth import get_current_user
from database import get_db
from utils import extract_text_from_file, analyze_contract
import shutil
import os

router = APIRouter(prefix="/contracts", tags=["contracts"])

# Get all user's contracts (History)
@router.get("/")
async def get_user_contracts(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    contracts = db.query(Contract).filter(Contract.user_id == current_user.id).order_by(Contract.created_at.desc()).all()
    return [
        {
            "id": c.id,
            "filename": c.filename,
            "jurisdiction": c.jurisdiction,
            "risk_report": eval(c.risk_report) if c.risk_report else {},  # convert string back to dict
            "created_at": c.created_at
        } for c in contracts
    ]

# Upload new contract
@router.post("/upload")
async def upload_contract(
    file: UploadFile = File(...),
    jurisdiction: str = "India",
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        os.makedirs("uploads", exist_ok=True)
        
        file_path = f"uploads/{current_user.id}_{file.filename}"
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        text = extract_text_from_file(file_path)
        
        if len(text.strip()) < 50:
            raise HTTPException(status_code=400, detail="Could not extract text from file")

        analysis = analyze_contract(text, jurisdiction)
        
        new_contract = Contract(
            filename=file.filename,
            file_path=file_path,
            jurisdiction=jurisdiction,
            raw_text=text[:15000],
            risk_report=str(analysis),
            user_id=current_user.id
        )
        db.add(new_contract)
        db.commit()
        db.refresh(new_contract)
        
        return {
            "id": new_contract.id,
            "filename": file.filename,
            "analysis": analysis
        }
    except Exception as e:
        print("Upload error:", str(e))
        raise HTTPException(status_code=500, detail=str(e))

# Delete contract
@router.delete("/{contract_id}")
async def delete_contract(
    contract_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    contract = db.query(Contract).filter(
        Contract.id == contract_id,
        Contract.user_id == current_user.id
    ).first()
    
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")
    
    # Delete file from disk
    if os.path.exists(contract.file_path):
        try:
            os.remove(contract.file_path)
        except:
            pass
    
    db.delete(contract)
    db.commit()
    
    return {"message": "Contract deleted successfully"}