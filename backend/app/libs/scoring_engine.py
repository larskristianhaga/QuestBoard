
from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime, timedelta
from collections import defaultdict
import asyncio
import asyncpg
from uuid import UUID, uuid4
import hashlib
import json

from app.libs.models_competition_v2 import (
    CompetitionRules, CompetitionEventCreate, CompetitionEventResponse,
    PlayerScore, ScoreboardResponse, BookingActivityType, Multiplier,
    Combo, TimeWindow, PointsConfig
)
import databutton as db

class ScoringEngine:
    """Advanced scoring engine for Competitions 2.0"""
    
    def __init__(self):
        self.db_url = db.secrets.get("DATABASE_URL_DEV")
    
    async def get_connection(self) -> asyncpg.Connection:
        """Get database connection"""
        return await asyncpg.connect(self.db_url)
    
    def generate_uniq_key(self, player_name: str, activity_type: str, timestamp: datetime) -> str:
        """Generate unique key for idempotency (5-second window)"""
        # Round down to 5-second intervals for idempotency
        rounded_ts = int(timestamp.timestamp() // 5) * 5
        key_string = f"{player_name}:{activity_type}:{rounded_ts}"
        return hashlib.sha1(key_string.encode()).hexdigest()
    
    async def calculate_base_points(self, activity_type: BookingActivityType, rules: CompetitionRules) -> int:
        """Calculate base points for activity type based on rules"""
        points_config = rules.points
        
        if activity_type == BookingActivityType.LIFT:
            return points_config.lift
        elif activity_type == BookingActivityType.CALL:
            return points_config.call
        elif activity_type == BookingActivityType.BOOK:
            return points_config.book
        
        return 0
    
    def is_within_time_window(self, timestamp: datetime, window: TimeWindow) -> bool:
        """Check if timestamp is within time window"""
        try:
            time_part = timestamp.time()
            start_time = datetime.strptime(window.start, "%H:%M").time()
            end_time = datetime.strptime(window.end, "%H:%M").time()
            
            if start_time <= end_time:
                return start_time <= time_part <= end_time
            else:  # crosses midnight
                return time_part >= start_time or time_part <= end_time
        except Exception:
            return False
    
    async def calculate_multipliers(self, 
                                   player_name: str, 
                                   activity_type: BookingActivityType, 
                                   timestamp: datetime,
                                   competition_id: int,
                                   rules: CompetitionRules) -> Tuple[float, List[str]]:
        """Calculate applicable multipliers and return (total_multiplier, applied_names)"""
        total_multiplier = 1.0
        applied_multipliers = []
        
        conn = await self.get_connection()
        try:
            for multiplier in rules.multipliers:
                if multiplier.type == "time_window" and multiplier.window:
                    if self.is_within_time_window(timestamp, multiplier.window):
                        total_multiplier *= multiplier.mult
                        applied_multipliers.append(f"time_window_{multiplier.mult}x")
                
                elif multiplier.type == "streak" and multiplier.min:
                    # Check current streak for player
                    streak_query = """
                        WITH recent_events AS (
                            SELECT player_name, type, ts,
                                   LAG(ts) OVER (PARTITION BY player_name ORDER BY ts) as prev_ts
                            FROM booking_competition_events 
                            WHERE competition_id = $1 AND player_name = $2
                            AND ts >= $3 - INTERVAL '24 hours'
                            ORDER BY ts DESC
                        ),
                        streak_breaks AS (
                            SELECT player_name, type, ts,
                                   CASE WHEN prev_ts IS NULL OR (ts - prev_ts) > INTERVAL '2 hours' 
                                        THEN 1 ELSE 0 END as is_break
                            FROM recent_events
                        ),
                        streak_groups AS (
                            SELECT player_name, type, ts,
                                   SUM(is_break) OVER (PARTITION BY player_name ORDER BY ts DESC) as group_id
                            FROM streak_breaks
                        )
                        SELECT COUNT(*) as streak_length
                        FROM streak_groups 
                        WHERE player_name = $2 AND group_id = 0
                    """
                    
                    result = await conn.fetchval(streak_query, competition_id, player_name, timestamp)
                    current_streak = result or 0
                    
                    if current_streak >= multiplier.min:
                        total_multiplier *= multiplier.mult
                        applied_multipliers.append(f"streak_{current_streak}_{multiplier.mult}x")
                
                elif multiplier.type == "early_bird":
                    # Check if this is among first N activities today
                    early_query = """
                        SELECT COUNT(*) 
                        FROM booking_competition_events 
                        WHERE competition_id = $1 
                        AND DATE(ts AT TIME ZONE 'Europe/Oslo') = DATE($2 AT TIME ZONE 'Europe/Oslo')
                        AND ts < $2
                    """
                    
                    daily_count = await conn.fetchval(early_query, competition_id, timestamp)
                    if daily_count < (multiplier.min or 10):  # first 10 activities of the day
                        total_multiplier *= multiplier.mult
                        applied_multipliers.append(f"early_bird_{multiplier.mult}x")
        
        finally:
            await conn.close()
        
        return total_multiplier, applied_multipliers
    
    async def check_combos(self, 
                          player_name: str, 
                          activity_type: BookingActivityType, 
                          timestamp: datetime,
                          competition_id: int,
                          rules: CompetitionRules) -> Tuple[int, List[str]]:
        """Check for combo bonuses and return (bonus_points, achieved_combos)"""
        total_bonus = 0
        achieved_combos = []
        
        conn = await self.get_connection()
        try:
            for combo in rules.combos:
                window_start = timestamp - timedelta(minutes=combo.within_minutes)
                
                if combo.required_types:
                    # Check if all required types are present in time window
                    combo_query = """
                        SELECT type, COUNT(*) as count
                        FROM booking_competition_events 
                        WHERE competition_id = $1 AND player_name = $2
                        AND ts BETWEEN $3 AND $4
                        AND type = ANY($5)
                        GROUP BY type
                    """
                    
                    results = await conn.fetch(
                        combo_query, 
                        competition_id, 
                        player_name,
                        window_start, 
                        timestamp,
                        [t.value for t in combo.required_types]
                    )
                    
                    found_types = {row['type'] for row in results}
                    required_types = {t.value for t in combo.required_types}
                    
                    if required_types.issubset(found_types):
                        total_bonus += combo.bonus
                        achieved_combos.append(combo.name)
                
                else:
                    # Check for rapid succession (any 3+ activities in time window)
                    rapid_query = """
                        SELECT COUNT(*) as count
                        FROM booking_competition_events 
                        WHERE competition_id = $1 AND player_name = $2
                        AND ts BETWEEN $3 AND $4
                    """
                    
                    count = await conn.fetchval(rapid_query, competition_id, player_name, window_start, timestamp)
                    
                    if count >= 3:  # including current event
                        total_bonus += combo.bonus
                        achieved_combos.append(combo.name)
        
        finally:
            await conn.close()
        
        return total_bonus, achieved_combos
    
    async def check_caps(self, 
                        player_name: str, 
                        competition_id: int, 
                        timestamp: datetime,
                        rules: CompetitionRules) -> bool:
        """Check if adding this event would exceed any caps"""
        if not rules.caps:
            return True
        
        conn = await self.get_connection()
        try:
            # Check daily cap
            if rules.caps.per_player_per_day:
                daily_query = """
                    SELECT COUNT(*) 
                    FROM booking_competition_events 
                    WHERE competition_id = $1 AND player_name = $2
                    AND DATE(ts AT TIME ZONE 'Europe/Oslo') = DATE($3 AT TIME ZONE 'Europe/Oslo')
                """
                
                daily_count = await conn.fetchval(daily_query, competition_id, player_name, timestamp)
                if daily_count >= rules.caps.per_player_per_day:
                    return False
            
            # Check total player cap
            if rules.caps.per_player_total:
                total_query = """
                    SELECT COUNT(*) 
                    FROM booking_competition_events 
                    WHERE competition_id = $1 AND player_name = $2
                """
                
                total_count = await conn.fetchval(total_query, competition_id, player_name)
                if total_count >= rules.caps.per_player_total:
                    return False
            
            # Check global cap
            if rules.caps.global_total:
                global_query = """
                    SELECT COUNT(*) 
                    FROM booking_competition_events 
                    WHERE competition_id = $1
                """
                
                global_count = await conn.fetchval(global_query, competition_id)
                if global_count >= rules.caps.global_total:
                    return False
        
        finally:
            await conn.close()
        
        return True
    
    async def score_event(self, 
                         event: CompetitionEventCreate, 
                         rules: CompetitionRules, 
                         timestamp: Optional[datetime] = None) -> Tuple[int, Dict[str, Any]]:
        """Score a single event and return (final_points, rule_triggered_info)"""
        if timestamp is None:
            timestamp = datetime.now()
        
        # Check caps first
        within_caps = await self.check_caps(
            event.player_name, 
            event.competition_id, 
            timestamp, 
            rules
        )
        
        if not within_caps:
            return 0, {"capped": True, "reason": "Daily/total/global cap exceeded"}
        
        # Calculate base points
        base_points = event.custom_points or await self.calculate_base_points(event.type, rules)
        
        # Calculate multipliers
        multiplier, applied_multipliers = await self.calculate_multipliers(
            event.player_name, 
            event.type, 
            timestamp, 
            event.competition_id, 
            rules
        )
        
        # Check combos
        combo_bonus, achieved_combos = await self.check_combos(
            event.player_name, 
            event.type, 
            timestamp, 
            event.competition_id, 
            rules
        )
        
        # Calculate final points
        final_points = int((base_points * multiplier) + combo_bonus)
        
        rule_triggered = {
            "base_points": base_points,
            "multiplier": multiplier,
            "applied_multipliers": applied_multipliers,
            "combo_bonus": combo_bonus,
            "achieved_combos": achieved_combos,
            "final_points": final_points,
            "within_caps": within_caps
        }
        
        return final_points, rule_triggered
    
    async def log_event(self, event: CompetitionEventCreate, rules: CompetitionRules) -> CompetitionEventResponse:
        """Log an event to the competition with full scoring calculation"""
        timestamp = datetime.now()
        
        # Generate unique key for idempotency
        uniq_key = self.generate_uniq_key(event.player_name, event.type.value, timestamp)
        
        # Score the event
        final_points, rule_triggered = await self.score_event(event, rules, timestamp)
        
        conn = await self.get_connection()
        try:
            # Insert event (ON CONFLICT DO NOTHING for idempotency)
            event_id = uuid4()
            insert_query = """
                INSERT INTO booking_competition_events 
                (id, competition_id, player_name, type, ts, source, uniq_key, points, rule_triggered)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                ON CONFLICT (competition_id, uniq_key) DO NOTHING
                RETURNING id, created_at
            """
            
            result = await conn.fetchrow(
                insert_query,
                event_id,
                event.competition_id,
                event.player_name,
                event.type.value,
                timestamp,
                event.source,
                uniq_key,
                final_points,
                json.dumps(rule_triggered)
            )
            
            if result is None:
                # Event was duplicate, fetch existing
                fetch_query = """
                    SELECT id, points, rule_triggered, created_at
                    FROM booking_competition_events 
                    WHERE competition_id = $1 AND uniq_key = $2
                """
                
                existing = await conn.fetchrow(fetch_query, event.competition_id, uniq_key)
                if existing:
                    return CompetitionEventResponse(
                        id=existing['id'],
                        competition_id=event.competition_id,
                        player_name=event.player_name,
                        type=event.type,
                        points=existing['points'],
                        rule_triggered=existing['rule_triggered'],
                        ts=timestamp,
                        source=event.source,
                        created_at=existing['created_at']
                    )
            
            return CompetitionEventResponse(
                id=result['id'],
                competition_id=event.competition_id,
                player_name=event.player_name,
                type=event.type,
                points=final_points,
                rule_triggered=rule_triggered,
                ts=timestamp,
                source=event.source,
                created_at=result['created_at']
            )
        
        finally:
            await conn.close()
    
    async def calculate_scoreboard(self, competition_id: int, rules: CompetitionRules) -> ScoreboardResponse:
        """Calculate current scoreboard for competition"""
        conn = await self.get_connection()
        try:
            # Get all events for this competition
            events_query = """
                SELECT player_name, type, points, rule_triggered, ts
                FROM booking_competition_events 
                WHERE competition_id = $1
                ORDER BY ts DESC
            """
            
            events = await conn.fetch(events_query, competition_id)
            
            # Calculate player scores
            player_scores = defaultdict(lambda: {
                'total_points': 0,
                'event_count': 0,
                'breakdown': defaultdict(int),
                'multipliers_applied': set(),
                'combos_achieved': set(),
                'last_activity': None,
                'current_streak': 0
            })
            
            for event in events:
                player = event['player_name']
                score_data = player_scores[player]
                
                score_data['total_points'] += event['points']
                score_data['event_count'] += 1
                score_data['breakdown'][BookingActivityType(event['type'])] += 1
                
                if score_data['last_activity'] is None or event['ts'] > score_data['last_activity']:
                    score_data['last_activity'] = event['ts']
                
                # Extract rule info
                rule_info = event['rule_triggered'] or {}
                if isinstance(rule_info, dict):
                    if 'applied_multipliers' in rule_info:
                        score_data['multipliers_applied'].update(rule_info['applied_multipliers'])
                    if 'achieved_combos' in rule_info:
                        score_data['combos_achieved'].update(rule_info['achieved_combos'])
            
            # Convert to PlayerScore objects
            leaderboard = []
            for player_name, data in player_scores.items():
                leaderboard.append(PlayerScore(
                    player_name=player_name,
                    total_points=data['total_points'],
                    event_count=data['event_count'],
                    breakdown=dict(data['breakdown']),
                    multipliers_applied=list(data['multipliers_applied']),
                    combos_achieved=list(data['combos_achieved']),
                    last_activity=data['last_activity'],
                    current_streak=data['current_streak']
                ))
            
            # Sort by rules (tie breakers)
            leaderboard.sort(key=lambda x: (
                -x.total_points,  # highest points first
                -x.breakdown.get(BookingActivityType.BOOK, 0),  # most books as tiebreaker
                x.last_activity or datetime.min  # earliest to target as final tiebreaker
            ))
            
            return ScoreboardResponse(
                competition_id=competition_id,
                individual_leaderboard=leaderboard,
                last_updated=datetime.now()
            )
        
        finally:
            await conn.close()
