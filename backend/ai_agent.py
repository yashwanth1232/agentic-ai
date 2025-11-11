from typing import TypedDict, Annotated, Sequence
from langchain_core.messages import BaseMessage, HumanMessage, AIMessage
from langgraph.graph import StateGraph, END
from langgraph.prebuilt import ToolExecutor
from datetime import datetime, timedelta
import json

class AgentState(TypedDict):
    messages: Sequence[BaseMessage]
    assignments: list
    courses: list
    commitments: list
    study_sessions: list
    recommendations: list

class AcademicPlanningAgent:
    def __init__(self):
        self.graph = self._create_graph()

    def _create_graph(self):
        workflow = StateGraph(AgentState)

        workflow.add_node("analyze_workload", self.analyze_workload)
        workflow.add_node("prioritize_tasks", self.prioritize_tasks)
        workflow.add_node("schedule_study_sessions", self.schedule_study_sessions)
        workflow.add_node("generate_recommendations", self.generate_recommendations)

        workflow.set_entry_point("analyze_workload")
        workflow.add_edge("analyze_workload", "prioritize_tasks")
        workflow.add_edge("prioritize_tasks", "schedule_study_sessions")
        workflow.add_edge("schedule_study_sessions", "generate_recommendations")
        workflow.add_edge("generate_recommendations", END)

        return workflow.compile()

    def analyze_workload(self, state: AgentState) -> AgentState:
        assignments = state.get("assignments", [])
        courses = state.get("courses", [])

        total_hours = sum(a.get("estimated_hours", 0) for a in assignments if a.get("status") == "pending")
        total_credits = sum(c.get("credits", 0) for c in courses)

        analysis = {
            "total_pending_assignments": len([a for a in assignments if a.get("status") == "pending"]),
            "total_estimated_hours": total_hours,
            "total_credits": total_credits,
            "workload_level": "high" if total_hours > 40 else "medium" if total_hours > 20 else "low"
        }

        state["messages"].append(AIMessage(content=f"Workload Analysis: {json.dumps(analysis)}"))
        return state

    def prioritize_tasks(self, state: AgentState) -> AgentState:
        assignments = state.get("assignments", [])
        now = datetime.utcnow()

        prioritized = []
        for assignment in assignments:
            if assignment.get("status") != "pending":
                continue

            due_date = datetime.fromisoformat(assignment["due_date"].replace("Z", "+00:00"))
            days_until_due = (due_date - now).days
            estimated_hours = assignment.get("estimated_hours", 2)

            if days_until_due < 2:
                priority = "high"
                urgency_score = 10
            elif days_until_due < 5:
                priority = "high" if estimated_hours > 5 else "medium"
                urgency_score = 7 if estimated_hours > 5 else 5
            elif days_until_due < 7:
                priority = "medium"
                urgency_score = 5
            else:
                priority = "low" if estimated_hours < 3 else "medium"
                urgency_score = 3 if estimated_hours < 3 else 4

            prioritized.append({
                **assignment,
                "priority": priority,
                "urgency_score": urgency_score,
                "days_until_due": days_until_due
            })

        prioritized.sort(key=lambda x: (-x["urgency_score"], x["days_until_due"]))
        state["assignments"] = prioritized

        state["messages"].append(AIMessage(content=f"Prioritized {len(prioritized)} assignments"))
        return state

    def schedule_study_sessions(self, state: AgentState) -> AgentState:
        assignments = state.get("assignments", [])
        commitments = state.get("commitments", [])

        suggested_sessions = []
        now = datetime.utcnow()

        for assignment in assignments[:5]:
            if assignment.get("status") != "pending":
                continue

            estimated_hours = assignment.get("estimated_hours", 2)
            sessions_needed = max(1, estimated_hours // 2)

            for i in range(sessions_needed):
                session_start = now + timedelta(days=i+1, hours=14)
                session_end = session_start + timedelta(hours=2)

                suggested_sessions.append({
                    "assignment_id": assignment["id"],
                    "title": f"Study: {assignment['title']}",
                    "start_time": session_start.isoformat(),
                    "end_time": session_end.isoformat(),
                    "priority": assignment.get("priority", "medium")
                })

        state["study_sessions"] = suggested_sessions
        state["messages"].append(AIMessage(content=f"Scheduled {len(suggested_sessions)} study sessions"))
        return state

    def generate_recommendations(self, state: AgentState) -> AgentState:
        assignments = state.get("assignments", [])
        study_sessions = state.get("study_sessions", [])

        recommendations = []

        high_priority = [a for a in assignments if a.get("priority") == "high"]
        if high_priority:
            recommendations.append({
                "type": "urgent_tasks",
                "title": "High Priority Tasks Require Attention",
                "message": f"You have {len(high_priority)} high-priority assignments due soon. Focus on these first.",
                "priority": 10,
                "tasks": [{"title": a["title"], "due_date": a["due_date"]} for a in high_priority[:3]]
            })

        if len(study_sessions) > 0:
            recommendations.append({
                "type": "study_schedule",
                "title": "Suggested Study Schedule",
                "message": f"We've created {len(study_sessions)} study sessions to help you stay on track.",
                "priority": 8,
                "sessions": study_sessions[:5]
            })

        total_hours = sum(a.get("estimated_hours", 0) for a in assignments if a.get("status") == "pending")
        if total_hours > 40:
            recommendations.append({
                "type": "workload_warning",
                "title": "Heavy Workload Detected",
                "message": f"You have {total_hours} hours of pending work. Consider extending some deadlines or seeking help.",
                "priority": 9
            })

        due_tomorrow = [a for a in assignments if a.get("days_until_due", 999) <= 1]
        if due_tomorrow:
            recommendations.append({
                "type": "deadline_alert",
                "title": "Assignments Due Tomorrow",
                "message": f"{len(due_tomorrow)} assignment(s) due within 24 hours!",
                "priority": 10,
                "tasks": [{"title": a["title"], "due_date": a["due_date"]} for a in due_tomorrow]
            })

        state["recommendations"] = recommendations
        state["messages"].append(AIMessage(content=f"Generated {len(recommendations)} recommendations"))
        return state

    def process(self, user_data: dict) -> dict:
        initial_state = {
            "messages": [HumanMessage(content="Analyze my academic workload")],
            "assignments": user_data.get("assignments", []),
            "courses": user_data.get("courses", []),
            "commitments": user_data.get("commitments", []),
            "study_sessions": [],
            "recommendations": []
        }

        result = self.graph.invoke(initial_state)

        return {
            "assignments": result["assignments"],
            "study_sessions": result["study_sessions"],
            "recommendations": result["recommendations"],
            "messages": [m.content for m in result["messages"]]
        }

agent = AcademicPlanningAgent()
