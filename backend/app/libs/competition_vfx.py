# Competition VFX and Event Management for Backend
# Handles VFX triggers and real-time event streaming

from typing import Dict, List, Any, Optional
from datetime import datetime
import json
import asyncio
from enum import Enum

class VFXType(Enum):
    STREAK = "streak"
    COMBO = "combo"
    MULTIPLIER = "multiplier"
    ACHIEVEMENT = "achievement"
    RANK_UP = "rank_up"
    COSMIC_EVENT = "cosmic_event"

class VFXIntensity(Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    LEGENDARY = "legendary"

class VFXEvent:
    def __init__(
        self,
        vfx_type: VFXType,
        intensity: VFXIntensity,
        duration: int,
        player_name: str,
        competition_id: int,
        metadata: Optional[Dict[str, Any]] = None
    ):
        self.vfx_type = vfx_type
        self.intensity = intensity
        self.duration = duration
        self.player_name = player_name
        self.competition_id = competition_id
        self.metadata = metadata or {}
        self.timestamp = datetime.utcnow()
        self.id = f"vfx_{int(self.timestamp.timestamp() * 1000)}"

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "type": self.vfx_type.value,
            "intensity": self.intensity.value,
            "duration": self.duration,
            "player_name": self.player_name,
            "competition_id": self.competition_id,
            "metadata": self.metadata,
            "timestamp": self.timestamp.isoformat()
        }

class CompetitionVFXManager:
    """Manages VFX events for competitions"""
    
    def __init__(self):
        self.active_events: List[VFXEvent] = []
        self.event_history: List[VFXEvent] = []
        self.max_history = 1000

    def trigger_streak_vfx(self, player_name: str, competition_id: int, streak_count: int) -> VFXEvent:
        """Trigger streak VFX based on streak count"""
        if streak_count >= 10:
            intensity = VFXIntensity.LEGENDARY
        elif streak_count >= 5:
            intensity = VFXIntensity.HIGH
        else:
            intensity = VFXIntensity.MEDIUM
            
        event = VFXEvent(
            vfx_type=VFXType.STREAK,
            intensity=intensity,
            duration=1500,
            player_name=player_name,
            competition_id=competition_id,
            metadata={"streak_count": streak_count}
        )
        
        self._add_event(event)
        return event

    def trigger_combo_vfx(self, player_name: str, competition_id: int, combo_name: str, bonus_points: int) -> VFXEvent:
        """Trigger combo achievement VFX"""
        intensity = VFXIntensity.HIGH if bonus_points >= 10 else VFXIntensity.MEDIUM
        
        event = VFXEvent(
            vfx_type=VFXType.COMBO,
            intensity=intensity,
            duration=2000,
            player_name=player_name,
            competition_id=competition_id,
            metadata={"combo_name": combo_name, "bonus_points": bonus_points}
        )
        
        self._add_event(event)
        return event

    def trigger_multiplier_vfx(self, player_name: str, competition_id: int, multiplier_name: str, multiplier: float) -> VFXEvent:
        """Trigger multiplier VFX"""
        if multiplier >= 3.0:
            intensity = VFXIntensity.LEGENDARY
        elif multiplier >= 2.0:
            intensity = VFXIntensity.HIGH
        else:
            intensity = VFXIntensity.MEDIUM
            
        event = VFXEvent(
            vfx_type=VFXType.MULTIPLIER,
            intensity=intensity,
            duration=2000,
            player_name=player_name,
            competition_id=competition_id,
            metadata={"multiplier_name": multiplier_name, "multiplier": multiplier}
        )
        
        self._add_event(event)
        return event

    def trigger_achievement_vfx(self, player_name: str, competition_id: int, achievement_name: str, rarity: str) -> VFXEvent:
        """Trigger achievement VFX"""
        intensity_map = {
            "common": VFXIntensity.LOW,
            "rare": VFXIntensity.MEDIUM,
            "epic": VFXIntensity.HIGH,
            "legendary": VFXIntensity.LEGENDARY
        }
        
        event = VFXEvent(
            vfx_type=VFXType.ACHIEVEMENT,
            intensity=intensity_map.get(rarity, VFXIntensity.MEDIUM),
            duration=1500,
            player_name=player_name,
            competition_id=competition_id,
            metadata={"achievement_name": achievement_name, "rarity": rarity}
        )
        
        self._add_event(event)
        return event

    def trigger_rank_up_vfx(self, player_name: str, competition_id: int, old_rank: int, new_rank: int) -> VFXEvent:
        """Trigger rank up VFX"""
        rank_improvement = old_rank - new_rank  # Lower rank number = better position
        
        if new_rank <= 3:
            intensity = VFXIntensity.LEGENDARY
        elif rank_improvement >= 5:
            intensity = VFXIntensity.HIGH
        else:
            intensity = VFXIntensity.MEDIUM
            
        event = VFXEvent(
            vfx_type=VFXType.RANK_UP,
            intensity=intensity,
            duration=1000,
            player_name=player_name,
            competition_id=competition_id,
            metadata={"old_rank": old_rank, "new_rank": new_rank, "improvement": rank_improvement}
        )
        
        self._add_event(event)
        return event

    def trigger_cosmic_event_vfx(self, competition_id: int, event_name: str, affected_players: List[str]) -> VFXEvent:
        """Trigger competition-wide cosmic event VFX"""
        event = VFXEvent(
            vfx_type=VFXType.COSMIC_EVENT,
            intensity=VFXIntensity.LEGENDARY,
            duration=3000,
            player_name="all",  # Special case for competition-wide events
            competition_id=competition_id,
            metadata={"event_name": event_name, "affected_players": affected_players}
        )
        
        self._add_event(event)
        return event

    def _add_event(self, event: VFXEvent):
        """Add event to active list and history"""
        self.active_events.append(event)
        self.event_history.append(event)
        
        # Clean up old events
        if len(self.event_history) > self.max_history:
            self.event_history = self.event_history[-self.max_history:]
            
        # Remove active events after their duration
        asyncio.create_task(self._cleanup_event(event))

    async def _cleanup_event(self, event: VFXEvent):
        """Remove event from active list after duration"""
        await asyncio.sleep(event.duration / 1000)  # Convert ms to seconds
        if event in self.active_events:
            self.active_events.remove(event)

    def get_active_events(self, competition_id: Optional[int] = None) -> List[Dict[str, Any]]:
        """Get currently active VFX events"""
        events = self.active_events
        if competition_id:
            events = [e for e in events if e.competition_id == competition_id]
        return [e.to_dict() for e in events]

    def get_event_history(self, competition_id: Optional[int] = None, limit: int = 100) -> List[Dict[str, Any]]:
        """Get VFX event history"""
        events = self.event_history
        if competition_id:
            events = [e for e in events if e.competition_id == competition_id]
        return [e.to_dict() for e in events[-limit:]]

    def clear_events(self, competition_id: Optional[int] = None):
        """Clear events for a specific competition or all events"""
        if competition_id:
            self.active_events = [e for e in self.active_events if e.competition_id != competition_id]
            self.event_history = [e for e in self.event_history if e.competition_id != competition_id]
        else:
            self.active_events.clear()
            self.event_history.clear()

# Global VFX manager instance
vfx_manager = CompetitionVFXManager()

# Helper functions for easy use
def trigger_streak_effect(player_name: str, competition_id: int, streak_count: int) -> Dict[str, Any]:
    """Helper to trigger streak VFX"""
    event = vfx_manager.trigger_streak_vfx(player_name, competition_id, streak_count)
    return event.to_dict()

def trigger_combo_effect(player_name: str, competition_id: int, combo_name: str, bonus_points: int) -> Dict[str, Any]:
    """Helper to trigger combo VFX"""
    event = vfx_manager.trigger_combo_vfx(player_name, competition_id, combo_name, bonus_points)
    return event.to_dict()

def trigger_multiplier_effect(player_name: str, competition_id: int, multiplier_name: str, multiplier: float) -> Dict[str, Any]:
    """Helper to trigger multiplier VFX"""
    event = vfx_manager.trigger_multiplier_vfx(player_name, competition_id, multiplier_name, multiplier)
    return event.to_dict()

def trigger_achievement_effect(player_name: str, competition_id: int, achievement_name: str, rarity: str = "common") -> Dict[str, Any]:
    """Helper to trigger achievement VFX"""
    event = vfx_manager.trigger_achievement_vfx(player_name, competition_id, achievement_name, rarity)
    return event.to_dict()

def trigger_rank_up_effect(player_name: str, competition_id: int, old_rank: int, new_rank: int) -> Dict[str, Any]:
    """Helper to trigger rank up VFX"""
    event = vfx_manager.trigger_rank_up_vfx(player_name, competition_id, old_rank, new_rank)
    return event.to_dict()

def trigger_cosmic_event_effect(competition_id: int, event_name: str, affected_players: List[str]) -> Dict[str, Any]:
    """Helper to trigger cosmic event VFX"""
    event = vfx_manager.trigger_cosmic_event_vfx(competition_id, event_name, affected_players)
    return event.to_dict()

def get_active_vfx_events(competition_id: Optional[int] = None) -> List[Dict[str, Any]]:
    """Get currently active VFX events"""
    return vfx_manager.get_active_events(competition_id)

def get_vfx_event_history(competition_id: Optional[int] = None, limit: int = 100) -> List[Dict[str, Any]]:
    """Get VFX event history"""
    return vfx_manager.get_event_history(competition_id, limit)

def clear_vfx_events(competition_id: Optional[int] = None):
    """Clear VFX events"""
    vfx_manager.clear_events(competition_id)
