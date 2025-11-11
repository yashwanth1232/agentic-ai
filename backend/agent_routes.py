from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from ai_agent import agent
import os
# ✅ New
from supabase.client import create_client

from dotenv import load_dotenv
router = APIRouter(prefix="/api/agent", tags=["AI Agent"])



# Load environment variables
load_dotenv()


supabase = create_client(
    os.getenv("SUPABASE_URL"), # type: ignore
    os.getenv("SUPABASE_KEY") # type: ignore
)

class AgentAnalysisRequest(BaseModel):
    user_id: str

@router.post("/analyze")
async def analyze_workload(request: AgentAnalysisRequest):
    try:
        print("🔹 Request received:", request)
        print("🔹 User ID:", request.user_id)

        assignments_response = supabase.table("assignments").select("*").eq("user_id", request.user_id).execute()
        print("✅ Assignments fetched")

        courses_response = supabase.table("courses").select("*").eq("user_id", request.user_id).execute()
        print("✅ Courses fetched")

        commitments_response = supabase.table("personal_commitments").select("*").eq("user_id", request.user_id).execute()
        print("✅ Commitments fetched")

        user_data = {
            "assignments": assignments_response.data,
            "courses": courses_response.data,
            "commitments": commitments_response.data
        }

        print("🔹 Sending data to AI agent...")
        result = agent.process(user_data)
        print("✅ AI processing done:", result)

        for assignment in result["assignments"]:
            if "urgency_score" in assignment:
                supabase.table("assignments").update({
                    "priority": assignment["priority"]
                }).eq("id", assignment["id"]).execute()
        print("✅ Assignments updated")

        for recommendation in result["recommendations"]:
            supabase.table("ai_recommendations").insert({
                "user_id": request.user_id,
                "recommendation_type": recommendation["type"],
                "content": recommendation,
                "priority": recommendation.get("priority", 5),
                "status": "pending"
            }).execute()
        print("✅ Recommendations inserted")

        return {
            "success": True,
            "analysis": result,
            "message": "Workload analyzed and recommendations generated"
        }

    except Exception as e:
        import traceback
        print("❌ ERROR in analyze_workload:", e)
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/recommendations/{user_id}")
async def get_recommendations(user_id: str):
    try:
        response = supabase.table("ai_recommendations").select("*").eq("user_id", user_id).eq("status", "pending").order("priority", desc=True).execute()
        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.patch("/recommendations/{recommendation_id}")
async def update_recommendation_status(recommendation_id: str, status: str):
    try:
        response = supabase.table("ai_recommendations").update({"status": status}).eq("id", recommendation_id).execute()
        return response.data[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
