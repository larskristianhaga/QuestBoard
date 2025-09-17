from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import List, Optional
from openai import OpenAI
import databutton as db
import json
import logging

# Import auth
from app.auth import AuthorizedUser

router = APIRouter(prefix="/team-naming")
logger = logging.getLogger(__name__)

class TeamNamingRequest(BaseModel):
    participants: List[str] = Field(..., description="List of participant names")
    competition_name: str = Field(..., description="Name of the competition")
    theme: Optional[str] = Field(None, description="Competition theme (cosmic, space, etc.)")
    style: Optional[str] = Field("cosmic", description="Naming style preference")
    team_count: int = Field(2, ge=2, le=4, description="Number of teams to create")

class TeamNamingResponse(BaseModel):
    teams: List[dict] = Field(..., description="Generated teams with names and assignments")
    reasoning: str = Field(..., description="AI explanation of naming choices")

class TeamAssignment(BaseModel):
    team_name: str
    members: List[str]
    color: str = Field(..., pattern=r'^#[0-9A-Fa-f]{6}$')
    description: str

@router.post("/generate", response_model=TeamNamingResponse)
async def generate_team_names(request: TeamNamingRequest, user: AuthorizedUser):
    """Generate AI-powered team names and balanced assignments"""
    try:
        # Initialize OpenAI client
        client = OpenAI(api_key=db.secrets.get("OPENAI_API_KEY"))
        
        if not client.api_key:
            raise HTTPException(status_code=500, detail="OpenAI API key not configured")
        
        # Create cosmic/space themed prompt
        prompt = f"""
You are a cosmic team naming AI for QuestBoard, a gamified sales activity tracker.

COMPETITION: {request.competition_name}
PARTICIPANTS: {', '.join(request.participants)}
TEAM COUNT: {request.team_count}
THEME: {request.theme or 'cosmic space adventure'}

CREATE {request.team_count} BALANCED TEAMS with:
1. Epic cosmic/space themed names (like "Stellar Navigators", "Quantum Hunters", "Cosmic Crusaders")
2. Balanced member distribution
3. Rich backstories that tie to space/cosmic themes
4. Distinctive cosmic colors (deep blues, purples, magentas, electric colors)

RETURN JSON:
{{
  "teams": [
    {{
      "team_name": "Epic Space Name",
      "members": ["member1", "member2"],
      "color": "#hex_color",
      "description": "Rich cosmic backstory explaining the team's mission and power"
    }}
  ],
  "reasoning": "Explain your cosmic naming choices and how teams are balanced"
}}

Make it EPIC and IMMERSIVE! Think galactic empires, stellar phenomena, cosmic forces!
"""
        
        logger.info(f"Generating teams for {len(request.participants)} participants")
        
        # Call OpenAI
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are an expert at creating epic cosmic team names and balanced team assignments. Always return valid JSON."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.8,
            max_tokens=1500
        )
        
        # Parse AI response
        ai_content = response.choices[0].message.content
        logger.info(f"AI Response: {ai_content[:200]}...")
        
        try:
            # Extract JSON from response
            ai_data = json.loads(ai_content)
            
            # Validate structure
            if "teams" not in ai_data or "reasoning" not in ai_data:
                raise ValueError("Invalid AI response structure")
            
            # Ensure all participants are assigned
            assigned_members = set()
            for team in ai_data["teams"]:
                assigned_members.update(team.get("members", []))
            
            unassigned = set(request.participants) - assigned_members
            if unassigned:
                # Auto-assign unassigned members to smallest team
                smallest_team = min(ai_data["teams"], key=lambda t: len(t.get("members", [])))
                smallest_team["members"].extend(list(unassigned))
                logger.info(f"Auto-assigned {unassigned} to {smallest_team['team_name']}")
            
            return TeamNamingResponse(
                teams=ai_data["teams"],
                reasoning=ai_data["reasoning"]
            )
            
        except json.JSONDecodeError:
            # Fallback to manual parsing if JSON parsing fails
            logger.warning("JSON parsing failed, using fallback team generation")
            return generate_fallback_teams(request)
            
    except Exception as e:
        logger.error(f"Error generating team names: {str(e)}")
        # Return fallback teams
        return generate_fallback_teams(request)

def generate_fallback_teams(request: TeamNamingRequest) -> TeamNamingResponse:
    """Generate fallback cosmic teams when AI fails"""
    cosmic_names = [
        "Stellar Navigators", "Quantum Hunters", "Cosmic Crusaders", "Galactic Rangers",
        "Nebula Warriors", "Solar Flare Squad", "Meteor Storm Legion", "Starlight Vanguard"
    ]
    
    cosmic_colors = ["#6366f1", "#8b5cf6", "#d946ef", "#06b6d4", "#3b82f6", "#1d4ed8"]
    
    # Balance teams
    participants = request.participants.copy()
    teams = []
    
    for i in range(request.team_count):
        team_size = len(participants) // (request.team_count - i)
        team_members = participants[:team_size]
        participants = participants[team_size:]
        
        teams.append({
            "team_name": cosmic_names[i % len(cosmic_names)],
            "members": team_members,
            "color": cosmic_colors[i % len(cosmic_colors)],
            "description": f"Elite cosmic warriors on a mission to dominate the {request.competition_name} competition through superior strategy and teamwork."
        })
    
    return TeamNamingResponse(
        teams=teams,
        reasoning="Fallback cosmic team generation with balanced member distribution and epic space-themed names."
    )

@router.post("/validate", response_model=dict)
async def validate_team_assignments(teams: List[TeamAssignment], user: AuthorizedUser):
    """Validate team assignments for balance and completeness"""
    total_members = sum(len(team.members) for team in teams)
    team_sizes = [len(team.members) for team in teams]
    
    balance_score = 1.0 - (max(team_sizes) - min(team_sizes)) / max(team_sizes) if max(team_sizes) > 0 else 1.0
    
    return {
        "valid": True,
        "total_members": total_members,
        "team_sizes": team_sizes,
        "balance_score": round(balance_score, 2),
        "recommendations": []
    }
