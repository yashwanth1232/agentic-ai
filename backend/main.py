from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
import os
from dotenv import load_dotenv
from supabase import create_client, Client
from agent_routes import router as agent_router

load_dotenv()

app = FastAPI(title="Academic Planning AI Assistant")
app.include_router(agent_router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

supabase: Client = create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_KEY")
)

class AssignmentCreate(BaseModel):
    course_id: Optional[str] = None
    title: str
    description: str = ""
    due_date: str
    estimated_hours: int = 2

class AssignmentUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    due_date: Optional[str] = None
    estimated_hours: Optional[int] = None
    status: Optional[str] = None
    priority: Optional[str] = None

class CourseCreate(BaseModel):
    course_code: str
    course_name: str
    instructor: str = ""
    credits: int = 3
    semester: str
    schedule: List[dict] = []

class StudySessionCreate(BaseModel):
    assignment_id: Optional[str] = None
    title: str
    start_time: str
    end_time: str

class CommitmentCreate(BaseModel):
    title: str
    description: str = ""
    start_time: str
    end_time: str
    recurring: bool = False
    recurrence_pattern: dict = {}

@app.get("/")
async def root():
    return {"message": "Academic Planning AI Assistant API"}

@app.get("/api/health")
async def health_check():
    return {"status": "healthy"}

@app.post("/api/assignments")
async def create_assignment(assignment: AssignmentCreate, user_id: str):
    try:
        response = supabase.table("assignments").insert({
            "user_id": user_id,
            "course_id": assignment.course_id,
            "title": assignment.title,
            "description": assignment.description,
            "due_date": assignment.due_date,
            "estimated_hours": assignment.estimated_hours,
            "status": "pending",
            "priority": "medium"
        }).execute()
        return response.data[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/assignments/{user_id}")
async def get_assignments(user_id: str):
    try:
        response = supabase.table("assignments").select("*").eq("user_id", user_id).order("due_date").execute()
        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.patch("/api/assignments/{assignment_id}")
async def update_assignment(assignment_id: str, assignment: AssignmentUpdate):
    try:
        update_data = {k: v for k, v in assignment.dict().items() if v is not None}
        if assignment.status == "completed":
            update_data["completed_at"] = datetime.utcnow().isoformat()

        response = supabase.table("assignments").update(update_data).eq("id", assignment_id).execute()
        return response.data[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/assignments/{assignment_id}")
async def delete_assignment(assignment_id: str):
    try:
        supabase.table("assignments").delete().eq("id", assignment_id).execute()
        return {"message": "Assignment deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/courses")
async def create_course(course: CourseCreate, user_id: str):
    try:
        response = supabase.table("courses").insert({
            "user_id": user_id,
            "course_code": course.course_code,
            "course_name": course.course_name,
            "instructor": course.instructor,
            "credits": course.credits,
            "semester": course.semester,
            "schedule": course.schedule
        }).execute()
        return response.data[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/courses/{user_id}")
async def get_courses(user_id: str):
    try:
        response = supabase.table("courses").select("*").eq("user_id", user_id).execute()
        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/study-sessions")
async def create_study_session(session: StudySessionCreate, user_id: str):
    try:
        response = supabase.table("study_sessions").insert({
            "user_id": user_id,
            "assignment_id": session.assignment_id,
            "title": session.title,
            "start_time": session.start_time,
            "end_time": session.end_time,
            "status": "scheduled"
        }).execute()
        return response.data[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/study-sessions/{user_id}")
async def get_study_sessions(user_id: str):
    try:
        response = supabase.table("study_sessions").select("*").eq("user_id", user_id).order("start_time").execute()
        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/commitments")
async def create_commitment(commitment: CommitmentCreate, user_id: str):
    try:
        response = supabase.table("personal_commitments").insert({
            "user_id": user_id,
            "title": commitment.title,
            "description": commitment.description,
            "start_time": commitment.start_time,
            "end_time": commitment.end_time,
            "recurring": commitment.recurring,
            "recurrence_pattern": commitment.recurrence_pattern
        }).execute()
        return response.data[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/commitments/{user_id}")
async def get_commitments(user_id: str):
    try:
        response = supabase.table("personal_commitments").select("*").eq("user_id", user_id).order("start_time").execute()
        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
