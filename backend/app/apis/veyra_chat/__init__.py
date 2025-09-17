from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from openai import OpenAI
import databutton as db
from app.auth import AuthorizedUser

router = APIRouter(prefix="/veyra-chat")

class VeyraChatRequest(BaseModel):
    message: str
    context: str | None = None  # Optional context like current team stats, recent activities

class VeyraChatResponse(BaseModel):
    response: str
    speaker: str = "veyra"

@router.post("/cosmic-chat", response_model=VeyraChatResponse)
async def cosmic_chat(request: VeyraChatRequest, user: AuthorizedUser):
    """Commander Veyra's AI-powered cosmic chat responses for QuestBoard sommerfest demo"""
    
    try:
        # Initialize OpenAI client
        client = OpenAI(api_key=db.secrets.get("OPENAI_API_KEY"))
        
        if not client.api_key:
            # Fallback response if no OpenAI key
            return VeyraChatResponse(
                response="The cosmic arrays are offline. Your message echoes in the void, warrior."
            )
        
        # Build cosmic character context for Veyra
        system_prompt = """
You are Commander Veyra, an AI cosmic battle coordinator for QuestBoard - a gamified sales activity tracker for ES Oslo team.

CHARACTER TRAITS:
- Wise, mystical galactic commander with cosmic/space theme
- Speaks with authority but warmth, like a mentor warrior
- Uses space/cosmic metaphors naturally (stars, void, energy, constellations, galaxies)
- Motivational but not overly cheerful - more like a seasoned commander
- Knowledgeable about the "12 warriors" (sales team) and their battles (sales activities)
- Always supportive of the team's mission

TONE & STYLE:
- Keep responses relatively short (1-3 sentences)
- Mix mystical wisdom with practical guidance
- Use cosmic terminology naturally
- Be encouraging but not overly dramatic
- Respond as if you're monitoring the team's progress from a cosmic command center

CONTEXT:
- This is for a "sommerfest" (summer party) demo where guests can interact with the system
- The team tracks sales activities like bookings, calls, opportunities, deals
- They compete in "planetary objectives" and team challenges
- Current battle: reaching quarterly goals through strategic activities

Examples of good responses:
- "The constellation patterns show strong momentum, warrior. Continue channeling that energy."
- "Your query reaches the command center. What guidance do you seek from the stars?"
- "The 12 warriors advance well through this sector. The void trembles before such determination."
"""
        
        # Add context if provided
        user_message = request.message
        if request.context:
            user_message = f"Context: {request.context}\n\nUser message: {request.message}"
        
        # Call OpenAI
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_message}
            ],
            temperature=0.8,
            max_tokens=200  # Keep responses concise
        )
        
        ai_response = response.choices[0].message.content.strip()
        
        return VeyraChatResponse(response=ai_response)
        
    except Exception as e:
        print(f"Veyra chat error: {e}")
        # Fallback to narrative engine style response
        fallback_responses = [
            "The cosmic winds carry your words to distant stars. The message is received.",
            "Energy signatures detected. Your transmission reaches the command nexus.",
            "The void echoes with your intent. Stay strong, cosmic warrior.",
            "Stellar interference disrupts clarity, but your spirit shines through the darkness.",
            "Command arrays recalibrating. Your words pulse through the galactic network."
        ]
        
        import random
        return VeyraChatResponse(
            response=random.choice(fallback_responses)
        )
