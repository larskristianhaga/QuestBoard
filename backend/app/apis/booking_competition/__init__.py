





from fastapi import APIRouter, HTTPException, Depends, Response
from typing import List, Dict, Any, Optional
from datetime import datetime
import asyncpg
import json
from uuid import UUID
import databutton as db

from app.auth import AuthorizedUser
from app.libs.models_competition import (
    CompetitionCreate,
    CompetitionUpdate,
    CompetitionResponse,
    EnrollParticipantRequest,
    ParticipantResponse,
    SubmitEntryRequest,
    EntryResponse,
    LeaderboardResponse,
    LeaderboardRow,
    FinalizeCompetitionRequest,
    ToggleVisibilityRequest,
    BookingActivityType,
    BulkEntryRequest,
    QuickLogRequest,
    UpdateEntryRequest,
    DeleteEntryRequest,
    EntryListResponse,
    EnhancedLeaderboardResponse,
    LeaderboardRowWithBreakdown,
    ActivityTypeBreakdown,
    TeamStats,
    TeamLeaderboardResponse,
    TeamActivityFeed,
    CompetitionStatsResponse,
    TeammateListResponse,
)

# Import new Competitions 2.0 models
from app.libs.models_competition_v2 import (
    CompetitionCreateV2,
    CompetitionUpdateV2,
    CompetitionResponseV2,
    CompetitionEventCreate,
    CompetitionEventResponse,
    ScoreboardResponse,
    ScoringPreviewRequest,
    ScoringPreviewResponse,
    ValidationRequest,
    ValidationResponse,
    FinalizeCompetitionRequestV2,
    FinalizeCompetitionResponse,
    UndoEventRequest,
    CompetitionResultCreate,
    CompetitionResultResponse,
    BonusAwardCreate,
    BonusAwardResponse,
    CompetitionState,
    CompetitionRules,
    CompetitionTheme,
    CompetitionPrizes
)

# Import scoring engine
from app.libs.scoring_engine import ScoringEngine

router = APIRouter(prefix="/booking-competition")

# Admin IDs reused from admin module for simplicity
from app.apis.admin import ADMIN_USER_IDS


def check_admin(user: AuthorizedUser):
    user_id = user.sub
    if not user_id or user_id not in ADMIN_USER_IDS:
        raise HTTPException(status_code=403, detail="Admin access required")
    return user_id


async def get_conn():
    return await asyncpg.connect(db.secrets.get("DATABASE_URL_DEV"))

# Helper: get active quarter id
async def get_active_quarter_id(conn) -> Optional[int]:
    row = await conn.fetchrow(
        """
        SELECT id FROM quarters
        WHERE is_active = TRUE
        ORDER BY start_date DESC
        LIMIT 1
        """
    )
    return row["id"] if row else None

# Helper: ensure profiles exist for a set of player_names in the active quarter
async def ensure_profiles(conn, quarter_id: int, player_names: List[str]):
    # Create profile with zero goals if missing
    for player_name in player_names:
        exists = await conn.fetchval(
            "SELECT 1 FROM profiles WHERE name = $1 AND quarter_id = $2",
            player_name,
            quarter_id,
        )
        if not exists:
            # deterministic user_id for player profiles
            import uuid
            player_uuid = str(uuid.uuid5(uuid.NAMESPACE_DNS, f"player.{player_name.lower()}"))
            await conn.execute(
                """
                INSERT INTO profiles (user_id, quarter_id, name, points, goal_books, goal_opps, goal_deals)
                VALUES ($1, $2, $3, 0, 0, 0, 0)
                """,
                player_uuid,
                quarter_id,
                player_name,
            )

# Helper: compute winners list based on tiebreaker
async def compute_winners(conn, competition_id: int) -> List[str]:
    comp = await conn.fetchrow(
        "SELECT tiebreaker, start_time FROM booking_competitions WHERE id = $1",
        competition_id,
    )
    if not comp:
        raise HTTPException(status_code=404, detail="Competition not found")

    rows = await conn.fetch(
        """
        SELECT player_name,
               COALESCE(SUM(points),0) as total_points,
               COUNT(*) as entries,
               MAX(created_at) as last_entry_at,
               MIN(created_at) as first_entry_at
          FROM booking_competition_entries
         WHERE competition_id = $1
         GROUP BY player_name
        """,
        competition_id,
    )
    if not rows:
        return []

    # Determine winners by strategy
    tiebreaker = comp["tiebreaker"]
    if tiebreaker == "first_to":
        # First to reach highest total_points (earliest time when reaching that total)
        # Compute totals and earliest timestamp achieving max
        totals = {r["player_name"]: int(r["total_points"] or 0) for r in rows}
        max_total = max(totals.values()) if totals else 0
        # Consider only players that have max_total
        candidates = [r for r in rows if int(r["total_points"] or 0) == max_total]
        if not candidates:
            return []
        # Earliest time among their last_entry_at is a proxy; if more precision needed, we could reconstruct
        winner = min(candidates, key=lambda r: r["last_entry_at"] or comp["start_time"])  # earliest last entry
        return [winner["player_name"]]
    elif tiebreaker == "fastest_pace":
        # Most points per hour from start to last_entry_at
        winners: List[str] = []
        best_rate = -1.0
        best_players: List[str] = []
        from datetime import timezone
        for r in rows:
            total = int(r["total_points"] or 0)
            if total <= 0:
                continue
            last_ts = r["last_entry_at"]
            if not last_ts:
                continue
            elapsed_hours = max(0.001, (last_ts - comp["start_time"]).total_seconds() / 3600.0)
            rate = total / elapsed_hours
            if rate > best_rate:
                best_rate = rate
                best_players = [r["player_name"]]
            elif abs(rate - best_rate) < 1e-6:
                best_players.append(r["player_name"])
        return best_players
    else:
        # most_total (default): highest total_points, allow ties => multiple winners
        totals = {}
        for r in rows:
            totals[r["player_name"]] = int(r["total_points"] or 0)
        if not totals:
            return []
        max_total = max(totals.values())
        return [p for p, v in totals.items() if v == max_total]

# Endpoint: list entries for admin review (anti-cheat analytics)
@router.get("/entries/{competition_id}")
async def get_competition_entries(competition_id: int, user: AuthorizedUser, response: Response):
    """Get all entries for a competition with activity type breakdown for admin"""
    response.headers["Cache-Control"] = "no-store"
    try:
        check_admin(user)
        conn = await get_conn()
        try:
            rows = await conn.fetch(
                """
                SELECT id, competition_id, player_name, activity_id, activity_type, points, created_at
                  FROM booking_competition_entries
                 WHERE competition_id = $1
                 ORDER BY created_at DESC
                """,
                competition_id,
            )
            # basic suspicious flags: bursts (>=3 in 2 minutes), duplicates (same activity_id), high frequency
            # Build structures
            by_player: dict[str, list[dict]] = {}
            for r in rows:
                rec = dict(r)
                rec["created_at"] = rec["created_at"].isoformat()
                name = rec["player_name"]
                if name not in by_player:
                    by_player[name] = []
                by_player[name].append(rec)

            # Flag potential issues
            flagged_entries = []
            for player_name, player_entries in by_player.items():
                # Sort entries by created_at for analysis
                player_entries.sort(key=lambda x: x["created_at"])
                
                # Check for burst patterns (3+ entries in 2 minutes)
                from datetime import datetime, timedelta
                for i in range(len(player_entries) - 2):
                    entry1_time = datetime.fromisoformat(player_entries[i]["created_at"].replace('Z', '+00:00'))
                    entry3_time = datetime.fromisoformat(player_entries[i+2]["created_at"].replace('Z', '+00:00'))
                    if entry3_time - entry1_time <= timedelta(minutes=2):
                        flagged_entries.extend([player_entries[i]["id"], player_entries[i+1]["id"], player_entries[i+2]["id"]])

            # Return enhanced entry list
            return {
                "entries": [EntryListResponse(**dict(r)) for r in rows],
                "flagged_entry_ids": list(set(flagged_entries)),
                "stats": {
                    "total_entries": len(rows),
                    "total_players": len(by_player),
                    "flagged_entries": len(set(flagged_entries))
                }
            }
        finally:
            await conn.close()
    except Exception as e:
        print(f"Error getting competition entries: {str(e)}")
        # Return safe empty structure instead of raising exception
        return {
            "entries": [],
            "flagged_entry_ids": [],
            "stats": {
                "total_entries": 0,
                "total_players": 0,
                "flagged_entries": 0
            },
            "error": "Service temporarily unavailable"
        }


@router.post("/quick-log")
async def quick_log_activity(body: QuickLogRequest, user: AuthorizedUser):
    """Quick log a single activity for a player in competition"""
    check_admin(user)
    
    # Map activity types to points
    points_map = {
        BookingActivityType.LIFT: 1,
        BookingActivityType.CALL: 4, 
        BookingActivityType.BOOK: 10
    }
    
    points = points_map[body.activity_type]
    
    conn = await get_conn()
    try:
        # Check if player is enrolled
        participant = await conn.fetchrow(
            "SELECT id FROM booking_competition_participants WHERE competition_id = $1 AND player_name = $2",
            body.competition_id, body.player_name
        )
        if not participant:
            raise HTTPException(status_code=400, detail="Player is not enrolled in this competition")
            
        # Check if competition exists and is active
        comp = await conn.fetchrow(
            "SELECT is_active, start_time, end_time FROM booking_competitions WHERE id = $1",
            body.competition_id
        )
        if not comp:
            raise HTTPException(status_code=404, detail="Competition not found")
            
        row = await conn.fetchrow(
            """
            INSERT INTO booking_competition_entries (competition_id, player_name, activity_type, points, submitted_by)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING id, competition_id, player_name, activity_id, activity_type, points, created_at
            """,
            body.competition_id, body.player_name, body.activity_type.value, points, user.sub
        )
        return EntryResponse(**dict(row))
    finally:
        await conn.close()


@router.post("/bulk-log")
async def bulk_log_activities(body: BulkEntryRequest, user: AuthorizedUser):
    """Bulk log multiple activities for a player (for offline catch-up)"""
    check_admin(user)
    
    # Map activity types to points
    points_map = {
        BookingActivityType.LIFT: 1,
        BookingActivityType.CALL: 4,
        BookingActivityType.BOOK: 10
    }
    
    points = points_map[body.activity_type]
    
    conn = await get_conn()
    try:
        # Check if player is enrolled
        participant = await conn.fetchrow(
            "SELECT id FROM booking_competition_participants WHERE competition_id = $1 AND player_name = $2",
            body.competition_id, body.player_name
        )
        if not participant:
            raise HTTPException(status_code=400, detail="Player is not enrolled in this competition")
            
        # Bulk insert entries
        entries = []
        for i in range(body.count):
            row = await conn.fetchrow(
                """
                INSERT INTO booking_competition_entries (competition_id, player_name, activity_type, points, submitted_by)
                VALUES ($1, $2, $3, $4, $5)
                RETURNING id, competition_id, player_name, activity_id, activity_type, points, created_at
                """,
                body.competition_id, body.player_name, body.activity_type.value, points, user.sub
            )
            entries.append(EntryResponse(**dict(row)))
            
        return {"entries": entries, "total_logged": len(entries)}
    finally:
        await conn.close()


@router.put("/update-entry")
async def update_entry(body: UpdateEntryRequest, user: AuthorizedUser):
    """Update an existing entry"""
    check_admin(user)
    
    conn = await get_conn()
    try:
        # Build update fields
        fields = []
        values = []
        idx = 1
        
        if body.activity_type is not None:
            fields.append(f"activity_type = ${idx}")
            values.append(body.activity_type.value)
            idx += 1
            
        if body.points is not None:
            fields.append(f"points = ${idx}")
            values.append(body.points)
            idx += 1
            
        if not fields:
            raise HTTPException(status_code=400, detail="No fields to update")
            
        values.append(body.entry_id)
        
        row = await conn.fetchrow(
            f"""
            UPDATE booking_competition_entries
               SET {', '.join(fields)}
             WHERE id = ${idx}
         RETURNING id, competition_id, player_name, activity_id, activity_type, points, created_at
            """,
            *values,
        )
        if not row:
            raise HTTPException(status_code=404, detail="Entry not found")
        return EntryResponse(**dict(row))
    finally:
        await conn.close()


@router.delete("/delete-entry")
async def delete_entry(body: DeleteEntryRequest, user: AuthorizedUser):
    """Delete an entry with audit trail"""
    check_admin(user)
    
    conn = await get_conn()
    try:
        # Get entry details before deletion
        entry = await conn.fetchrow(
            "SELECT * FROM booking_competition_entries WHERE id = $1",
            body.entry_id
        )
        if not entry:
            raise HTTPException(status_code=404, detail="Entry not found")
            
        # Delete the entry
        await conn.execute(
            "DELETE FROM booking_competition_entries WHERE id = $1",
            body.entry_id
        )
        
        # Log admin action
        await conn.execute(
            """
            INSERT INTO admin_audit_log (action, details, user_id)
            VALUES ($1, $2, $3)
            """,
            "delete_competition_entry",
            {
                "entry_id": body.entry_id,
                "competition_id": entry["competition_id"],
                "player_name": entry["player_name"],
                "points": entry["points"],
                "activity_type": entry["activity_type"],
                "reason": body.reason
            },
            user.sub
        )
        
        return {"success": True, "deleted_entry_id": body.entry_id}
    finally:
        await conn.close()


# Create competition (admin)
@router.post("/create")
async def create_competition(body: CompetitionCreate, user: AuthorizedUser) -> CompetitionResponse:
    check_admin(user)
    conn = await get_conn()
    try:
        row = await conn.fetchrow(
            """
            INSERT INTO booking_competitions (name, description, start_time, end_time, is_hidden, tiebreaker)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING id, name, description, start_time, end_time, is_active, is_hidden, tiebreaker, created_at, updated_at
            """,
            body.name,
            body.description,
            body.start_time,
            body.end_time,
            body.is_hidden,
            body.tiebreaker,
        )
        return CompetitionResponse(**dict(row))
    finally:
        await conn.close()


# Update competition (admin)
@router.put("/update")
async def update_competition(body: CompetitionUpdate, user: AuthorizedUser) -> CompetitionResponse:
    check_admin(user)
    # Build dynamic update
    fields = []
    values = []
    idx = 1
    for key in ["name", "description", "start_time", "end_time", "is_active", "is_hidden", "tiebreaker"]:
        val = getattr(body, key)
        if val is not None:
            fields.append(f"{key} = ${idx}")
            values.append(val)
            idx += 1
    if not fields:
        raise HTTPException(status_code=400, detail="No fields to update")
    values.append(body.competition_id)

    conn = await get_conn()
    try:
        row = await conn.fetchrow(
            f"""
            UPDATE booking_competitions
               SET {', '.join(fields)}
             WHERE id = ${idx}
         RETURNING id, name, description, start_time, end_time, is_active, is_hidden, tiebreaker, created_at, updated_at
            """,
            *values,
        )
        if not row:
            raise HTTPException(status_code=404, detail="Competition not found")
        return CompetitionResponse(**dict(row))
    finally:
        await conn.close()


# Enroll participant (admin)
@router.post("/enroll")
async def enroll_participant(body: EnrollParticipantRequest, user: AuthorizedUser) -> ParticipantResponse:
    check_admin(user)
    conn = await get_conn()
    try:
        # First check if competition exists
        competition = await conn.fetchrow(
            "SELECT id FROM booking_competitions WHERE id = $1",
            body.competition_id
        )
        if not competition:
            raise HTTPException(status_code=404, detail=f"Competition with ID {body.competition_id} not found")
            
        row = await conn.fetchrow(
            """
            INSERT INTO booking_competition_participants (competition_id, player_name)
            VALUES ($1, $2)
            ON CONFLICT (competition_id, player_name) DO UPDATE SET player_name = EXCLUDED.player_name
            RETURNING id, competition_id, player_name, enrolled_at
            """,
            body.competition_id,
            body.player_name,
        )
        return ParticipantResponse(**dict(row))
    finally:
        await conn.close()


# Submit entry (any enrolled player; protected)
@router.post("/submit-entry")
async def submit_entry(body: SubmitEntryRequest, user: AuthorizedUser) -> EntryResponse:
    # Ensure player is enrolled in this competition
    conn = await get_conn()
    try:
        participant = await conn.fetchrow(
            """
            SELECT id FROM booking_competition_participants
             WHERE competition_id = $1 AND player_name = $2
            """,
            body.competition_id,
            body.player_name,
        )
        if not participant:
            raise HTTPException(status_code=400, detail="Player is not enrolled in this competition")
        # Ensure competition is within time window and active
        comp = await conn.fetchrow(
            """
            SELECT is_active, start_time, end_time FROM booking_competitions WHERE id = $1
            """,
            body.competition_id,
        )
        if not comp:
            raise HTTPException(status_code=404, detail="Competition not found")
        from datetime import datetime, timezone
        now = datetime.now(timezone.utc)
        if not comp["is_active"] or now < comp["start_time"].astimezone(timezone.utc) or now > comp["end_time"].astimezone(timezone.utc):
            raise HTTPException(status_code=400, detail="Competition is not active right now")

        row = await conn.fetchrow(
            """
            INSERT INTO booking_competition_entries (competition_id, player_name, activity_id, activity_type, points, submitted_by)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING id, competition_id, player_name, activity_id, activity_type, points, created_at
            """,
            body.competition_id,
            body.player_name,
            body.activity_id,
            body.activity_type.value,
            body.points,
            None,  # submitted_by can be added via mapping if needed
        )
        
        # TWO-WAY LOGGING: If this is a Books activity and not triggered by activity center,
        # automatically log in Activity Center with 1 point
        if (body.activity_type == BookingActivityType.BOOK and 
            body.triggered_by != "activity_center"):
            await trigger_activity_center_logging(body.player_name, user.sub, conn)
        
        return EntryResponse(**dict(row))
    finally:
        await conn.close()


# Leaderboard (protected view)
@router.get("/leaderboard/{competition_id}")
async def leaderboard(competition_id: int):
    conn = await get_conn()
    try:
        # First check if this competition has V2 events (newer system)
        v2_events = await conn.fetchval(
            "SELECT COUNT(*) FROM booking_competition_events WHERE competition_id = $1",
            competition_id
        )
        
        if v2_events > 0:
            # Use V2 events table for scoring (same as MCP)
            rows = await conn.fetch(
                """
                SELECT 
                    e.player_name,
                    COALESCE(SUM(e.points),0) as total_points,
                    COUNT(*) as entries,
                    MAX(e.created_at) as last_entry_at,
                    p.team_name
                FROM booking_competition_events e
                LEFT JOIN booking_competition_participants p ON e.competition_id = p.competition_id AND e.player_name = p.player_name
                WHERE e.competition_id = $1
                GROUP BY e.player_name, p.team_name
                ORDER BY total_points DESC, last_entry_at ASC
                """,
                competition_id,
            )
        else:
            # Fallback to V1 entries table
            rows = await conn.fetch(
                """
                SELECT 
                    e.player_name,
                    COALESCE(SUM(e.points),0) as total_points,
                    COUNT(*) as entries,
                    MAX(e.created_at) as last_entry_at,
                    p.team_name
                FROM booking_competition_entries e
                LEFT JOIN booking_competition_participants p ON e.competition_id = p.competition_id AND e.player_name = p.player_name
                WHERE e.competition_id = $1
                GROUP BY e.player_name, p.team_name
                ORDER BY total_points DESC, last_entry_at ASC
                """,
                competition_id,
            )
        out: List[LeaderboardRow] = []
        for r in rows:
            out.append(
                LeaderboardRow(
                    player_name=r["player_name"],
                    total_points=int(r["total_points"] or 0),
                    entries=int(r["entries"] or 0),
                    last_entry_at=r["last_entry_at"],
                    team_name=r["team_name"]
                )
            )
        return LeaderboardResponse(competition_id=competition_id, rows=out)
    finally:
        await conn.close()


@router.get("/leaderboard-detailed/{competition_id}")
async def leaderboard_detailed(competition_id: int, user: AuthorizedUser):
    """Enhanced leaderboard with activity type breakdown for admin"""
    check_admin(user)
    conn = await get_conn()
    try:
        # Get overall player stats
        rows = await conn.fetch(
            """
            SELECT 
                player_name,
                COALESCE(SUM(points),0) as total_points,
                COUNT(*) as entries,
                MAX(created_at) as last_entry_at
            FROM booking_competition_entries
            WHERE competition_id = $1
            GROUP BY player_name
            ORDER BY total_points DESC, last_entry_at ASC
            """,
            competition_id,
        )
        
        # Get activity type breakdown for each player
        breakdown_rows = await conn.fetch(
            """
            SELECT 
                player_name,
                activity_type,
                COUNT(*) as count,
                COALESCE(SUM(points),0) as total_points
            FROM booking_competition_entries
            WHERE competition_id = $1
            GROUP BY player_name, activity_type
            ORDER BY player_name, activity_type
            """,
            competition_id,
        )
        
        # Build breakdown dict
        breakdown_by_player = {}
        for br in breakdown_rows:
            player = br["player_name"]
            if player not in breakdown_by_player:
                breakdown_by_player[player] = []
            breakdown_by_player[player].append(
                ActivityTypeBreakdown(
                    activity_type=BookingActivityType(br["activity_type"]),
                    count=int(br["count"]),
                    total_points=int(br["total_points"])
                )
            )
        
        # Combine data
        out: List[LeaderboardRowWithBreakdown] = []
        for r in rows:
            player_name = r["player_name"]
            breakdown = breakdown_by_player.get(player_name, [])
            out.append(
                LeaderboardRowWithBreakdown(
                    player_name=player_name,
                    total_points=int(r["total_points"] or 0),
                    entries=int(r["entries"] or 0),
                    last_entry_at=r["last_entry_at"],
                    breakdown=breakdown
                )
            )
        return EnhancedLeaderboardResponse(competition_id=competition_id, rows=out)
    finally:
        await conn.close()


# Finalize competition (admin)
@router.post("/finalize")
async def finalize_competition(body: FinalizeCompetitionRequest, user: AuthorizedUser) -> CompetitionResponse:
    check_admin(user)
    conn = await get_conn()
    try:
        # Compute winners
        winners = await compute_winners(conn, body.competition_id)
        # Use active quarter
        quarter_id = await get_active_quarter_id(conn)
        if not quarter_id:
            raise HTTPException(status_code=400, detail="No active quarter found to award bonuses")
        # Ensure profiles exist for winners
        await ensure_profiles(conn, quarter_id, winners)

        # Award a one-time Bonus Challenge per winner if not already awarded
        # Idempotency via generation_trigger including competition id and player name
        for player in winners:
            existing = await conn.fetchrow(
                """
                SELECT id FROM challenges
                 WHERE quarter_id = $1
                   AND status = 'completed'
                   AND type = 'bonus'
                   AND generation_trigger = $2
                   AND completed_by = $3
                """,
                quarter_id,
                f"booking_competition:{body.competition_id}:{player}",
                player,
            )
            if existing:
                continue
            # Determine reward points policy: fixed 10 pts bonus per winner
            reward_points = 10
            # Insert completed challenge (visible false by default via admin toggle later if needed)
            challenge_row = await conn.fetchrow(
                """
                INSERT INTO challenges (
                    quarter_id, title, description, type, icon, target_value, target_type,
                    current_progress, start_time, end_time, reward_points, reward_description,
                    status, completed_by, completed_at, auto_generated, generation_trigger, is_visible
                ) VALUES (
                    $1, $2, $3, 'bonus', '🏆', 1, 'count', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP,
                    $4, $5, 'completed', $6, CURRENT_TIMESTAMP, TRUE, $7, FALSE
                ) RETURNING id
                """,
                quarter_id,
                "Competition Winner Bonus",
                f"Awarded for winning Booking Competition #{body.competition_id}",
                reward_points,
                f"Winner bonus: +{reward_points} pts",
                player,
                f"booking_competition:{body.competition_id}:{player}",
            )
            # Add points to profile and audit activity
            profile = await conn.fetchrow(
                "SELECT id, points FROM profiles WHERE name = $1 AND quarter_id = $2",
                player,
                quarter_id,
            )
            if not profile:
                continue
            await conn.execute(
                "UPDATE profiles SET points = points + $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2",
                reward_points,
                profile["id"],
            )
            await conn.execute(
                """
                INSERT INTO activities (profile_id, quarter_id, type, points, created_at)
                VALUES ($1, $2, 'book', $3, CURRENT_TIMESTAMP)
                """,
                profile["id"],
                quarter_id,
                reward_points,
            )

        # Optionally set inactive
        row = await conn.fetchrow(
            """
            UPDATE booking_competitions
               SET is_active = CASE WHEN $2 THEN false ELSE is_active END
             WHERE id = $1
         RETURNING id, name, description, start_time, end_time, is_active, is_hidden, tiebreaker, created_at, updated_at
            """,
            body.competition_id,
            body.set_inactive,
        )
        if not row:
            raise HTTPException(status_code=404, detail="Competition not found")
        return CompetitionResponse(**dict(row))
    finally:
        await conn.close()


# Toggle visibility (admin)
@router.post("/visibility")
async def toggle_visibility(body: ToggleVisibilityRequest, user: AuthorizedUser) -> CompetitionResponse:
    check_admin(user)
    conn = await get_conn()
    try:
        row = await conn.fetchrow(
            """
            UPDATE booking_competitions
               SET is_hidden = $2
             WHERE id = $1
         RETURNING id, name, description, start_time, end_time, is_active, is_hidden, tiebreaker, created_at, updated_at
            """,
            body.competition_id,
            body.is_hidden,
        )
        if not row:
            raise HTTPException(status_code=404, detail="Competition not found")
        return CompetitionResponse(**dict(row))
    finally:
        await conn.close()


# Get competition by id (protected)
@router.get("/{competition_id}")
async def get_competition(competition_id: int, user: AuthorizedUser) -> CompetitionResponse:
    conn = await get_conn()
    try:
        row = await conn.fetchrow(
            """
            SELECT id, name, description, start_time, end_time, is_active, is_hidden, tiebreaker, created_at, updated_at,
                   team_a_name, team_b_name, auto_assign_teams
            FROM booking_competitions WHERE id = $1
            """,
            competition_id,
        )
        if not row:
            raise HTTPException(status_code=404, detail="Competition not found")
        return CompetitionResponse(**dict(row))
    finally:
        await conn.close()


# List competitions (protected)
@router.get("")
async def list_competitions(user: AuthorizedUser, response: Response) -> dict:
    """List all competitions with safe response pattern"""
    response.headers["Cache-Control"] = "no-store"
    try:
        conn = await get_conn()
        try:
            rows = await conn.fetch(
                """
                SELECT id, name, description, start_time, end_time, is_active, is_hidden, tiebreaker, created_at, updated_at,
                       team_a_name, team_b_name, auto_assign_teams
                FROM booking_competitions
                ORDER BY created_at DESC
                """,
            )
            competitions = [CompetitionResponse(**dict(r)) for r in rows or []]
            return {"data": competitions}
        finally:
            await conn.close()
    except Exception as e:
        print(f"Error listing competitions: {str(e)}")
        return {"data": [], "error": "Service temporarily unavailable"}

# Add this helper function before the team endpoints
async def get_user_player(user_sub: str) -> Optional[str]:
    """Get the player name selected by the current user"""
    from app.apis.player_selection import convert_user_id_to_uuid
    
    conn = await get_conn()
    try:
        user_uuid = convert_user_id_to_uuid(user_sub)
        
        # Get player name from mapping
        player_mapping = await conn.fetchrow(
            "SELECT player_name FROM user_player_mapping WHERE user_id = $1",
            user_uuid
        )
        
        return player_mapping['player_name'] if player_mapping else None
    finally:
        await conn.close()

# New team-based endpoints
@router.get("/team-assignments/{competition_id}")
async def get_team_assignments(competition_id: int, user: AuthorizedUser) -> TeammateListResponse:
    """Get team assignments for a competition including your teammates and opponents"""
    conn = await get_conn()
    try:
        # Get competition details (include auto_assign_teams)
        comp = await conn.fetchrow(
            """
            SELECT team_a_name, team_b_name, auto_assign_teams
            FROM booking_competitions WHERE id = $1
            """,
            competition_id
        )
        if not comp:
            raise HTTPException(status_code=404, detail="Competition not found")
        
        team_a_name = comp['team_a_name']
        team_b_name = comp['team_b_name']
        auto_assign = bool(comp['auto_assign_teams']) if comp['auto_assign_teams'] is not None else False
            
        # Load all participants with their team assignments
        participants = await conn.fetch(
            """
            SELECT player_name, team_name 
            FROM booking_competition_participants 
            WHERE competition_id = $1
            ORDER BY player_name
            """,
            competition_id
        )
        
        # Get current user's player
        user_player = await get_user_player(user.sub)
        if not user_player:
            raise HTTPException(status_code=400, detail="Player not selected")
        
        # Find user's participant record and team
        user_team = None
        participant_names = {p['player_name'] for p in participants}
        for p in participants:
            if p['player_name'] == user_player:
                user_team = p['team_name']
                break
        
        # Helper to compute balanced team assignment
        async def choose_team() -> str:
            count_a = await conn.fetchval(
                "SELECT COUNT(*) FROM booking_competition_participants WHERE competition_id = $1 AND team_name = $2",
                competition_id, team_a_name,
            )
            count_b = await conn.fetchval(
                "SELECT COUNT(*) FROM booking_competition_participants WHERE competition_id = $1 AND team_name = $2",
                competition_id, team_b_name,
            )
            # Prefer the team with fewer members; tie -> Team A
            return team_a_name if (count_a is None or count_b is None or int(count_a) <= int(count_b)) else team_b_name
        
        # If user not enrolled and auto-assign is enabled -> enroll and assign a team
        if user_player not in participant_names and auto_assign:
            try:
                chosen = await choose_team()
                await conn.execute(
                    """
                    INSERT INTO booking_competition_participants (competition_id, player_name, team_name)
                    VALUES ($1, $2, $3)
                    ON CONFLICT (competition_id, player_name) DO NOTHING
                    """,
                    competition_id, user_player, chosen,
                )
                user_team = chosen
                # Refresh participants list to include the new user
                participants = await conn.fetch(
                    "SELECT player_name, team_name FROM booking_competition_participants WHERE competition_id = $1 ORDER BY player_name",
                    competition_id,
                )
            except Exception as e:
                print(f"Auto-enroll failed for {user_player} in competition {competition_id}: {e}")
                # If we can't enroll automatically, fall through and return proper error below
        
        # If user enrolled but team_name is NULL and auto-assign is enabled -> assign team now
        if user_player in {p['player_name'] for p in participants} and (not user_team) and auto_assign:
            try:
                chosen = await choose_team()
                await conn.execute(
                    """
                    UPDATE booking_competition_participants
                       SET team_name = $3
                     WHERE competition_id = $1 AND player_name = $2
                    """,
                    competition_id, user_player, chosen,
                )
                user_team = chosen
                # Refresh participants after update
                participants = await conn.fetch(
                    "SELECT player_name, team_name FROM booking_competition_participants WHERE competition_id = $1 ORDER BY player_name",
                    competition_id,
                )
            except Exception as e:
                print(f"Auto team-assign failed for {user_player} in competition {competition_id}: {e}")
        
        # Backfill missing team_name for any existing participants if auto-assign is enabled
        if auto_assign:
            try:
                for p in participants:
                    if p['team_name'] is None:
                        chosen = await choose_team()
                        await conn.execute(
                            """
                            UPDATE booking_competition_participants
                               SET team_name = $3
                             WHERE competition_id = $1 AND player_name = $2 AND team_name IS NULL
                            """,
                            competition_id, p['player_name'], chosen,
                        )
                # Reload after possible backfill
                participants = await conn.fetch(
                    "SELECT player_name, team_name FROM booking_competition_participants WHERE competition_id = $1 ORDER BY player_name",
                    competition_id,
                )
            except Exception as e:
                print(f"Backfill team assignment failed in competition {competition_id}: {e}")
        
        # If still no team for user -> explicit errors
        if user_player not in {p['player_name'] for p in participants}:
            raise HTTPException(status_code=400, detail="Player not enrolled in competition")
        if not user_team:
            # Look up after backfill
            for p in participants:
                if p['player_name'] == user_player:
                    user_team = p['team_name']
                    break
            if not user_team:
                raise HTTPException(status_code=400, detail="Team assignment missing for player")
        
        # Group teammates and opponents
        teammates: list[str] = []
        opponents: list[str] = []
        opposing_team_name = ""
        
        for p in participants:
            if p['player_name'] == user_player:
                continue
            if p['team_name'] == user_team:
                teammates.append(p['player_name'])
            else:
                opponents.append(p['player_name'])
                if not opposing_team_name and p['team_name']:
                    opposing_team_name = p['team_name']
        
        return TeammateListResponse(
            your_team=user_team,
            teammates=teammates,
            opposing_team=opposing_team_name if opposing_team_name else (team_b_name if user_team == team_a_name else team_a_name),
            opponents=opponents
        )
        
    finally:
        await conn.close()

@router.get("/team-leaderboard/{competition_id}")
async def get_team_leaderboard(competition_id: int, user: AuthorizedUser) -> TeamLeaderboardResponse:
    """Get team vs team leaderboard with individual breakdown"""
    conn = await get_conn()
    try:
        # Get competition details
        comp = await conn.fetchrow(
            "SELECT team_a_name, team_b_name FROM booking_competitions WHERE id = $1",
            competition_id
        )
        if not comp:
            raise HTTPException(status_code=404, detail="Competition not found")
            
        # If no team stats, create default ones
        team_a_stats = {'team_name': comp['team_a_name'], 'total_points': 0, 'member_count': 0, 'entries': 0, 'last_activity_at': None}
        team_b_stats = {'team_name': comp['team_b_name'], 'total_points': 0, 'member_count': 0, 'entries': 0, 'last_activity_at': None}
        
        # Count members and aggregate by team
        team_a_members = await conn.fetchval(
            "SELECT COUNT(*) FROM booking_competition_participants WHERE competition_id = $1 AND team_name = $2",
            competition_id, comp['team_a_name']
        )
        team_b_members = await conn.fetchval(
            "SELECT COUNT(*) FROM booking_competition_participants WHERE competition_id = $1 AND team_name = $2",
            competition_id, comp['team_b_name']
        )
        
        # Get points and activity for each team
        team_a_data = await conn.fetchrow(
            """
            SELECT 
                COALESCE(SUM(e.points), 0) as total_points,
                COUNT(e.id) as entries,
                MAX(e.created_at) as last_activity_at
            FROM booking_competition_participants p
            LEFT JOIN booking_competition_entries e ON e.competition_id = p.competition_id AND e.player_name = p.player_name
            WHERE p.competition_id = $1 AND p.team_name = $2
            """,
            competition_id, comp['team_a_name']
        )
        
        team_b_data = await conn.fetchrow(
            """
            SELECT 
                COALESCE(SUM(e.points), 0) as total_points,
                COUNT(e.id) as entries,
                MAX(e.created_at) as last_activity_at
            FROM booking_competition_participants p
            LEFT JOIN booking_competition_entries e ON e.competition_id = p.competition_id AND e.player_name = p.player_name
            WHERE p.competition_id = $1 AND p.team_name = $2
            """,
            competition_id, comp['team_b_name']
        )
        
        # Get individual leaderboard with team info
        individual_rows = await conn.fetch(
            """
            SELECT 
                p.player_name,
                p.team_name,
                COALESCE(SUM(e.points), 0) as total_points,
                COUNT(e.id) as entries,
                MAX(e.created_at) as last_entry_at
            FROM booking_competition_participants p
            LEFT JOIN booking_competition_entries e ON e.competition_id = p.competition_id AND e.player_name = p.player_name
            WHERE p.competition_id = $1
            GROUP BY p.player_name, p.team_name
            ORDER BY total_points DESC, last_entry_at ASC
            """,
            competition_id
        )
        
        # Convert to response format
        team_a = TeamStats(
            team_name=comp['team_a_name'],
            total_points=int(team_a_data['total_points']) if team_a_data else 0,
            member_count=int(team_a_members) if team_a_members else 0,
            entries=int(team_a_data['entries']) if team_a_data else 0,
            last_activity_at=team_a_data['last_activity_at'] if team_a_data else None
        )
        
        team_b = TeamStats(
            team_name=comp['team_b_name'],
            total_points=int(team_b_data['total_points']) if team_b_data else 0,
            member_count=int(team_b_members) if team_b_members else 0,
            entries=int(team_b_data['entries']) if team_b_data else 0,
            last_activity_at=team_b_data['last_activity_at'] if team_b_data else None
        )
        
        individual_leaderboard = [
            LeaderboardRow(
                player_name=row['player_name'],
                total_points=int(row['total_points']),
                entries=int(row['entries']),
                last_entry_at=row['last_entry_at'],
                team_name=row['team_name']
            )
            for row in individual_rows
        ]
        
        return TeamLeaderboardResponse(
            competition_id=competition_id,
            team_a=team_a,
            team_b=team_b,
            individual_leaderboard=individual_leaderboard
        )
        
    finally:
        await conn.close()

@router.get("/team-activity-feed/{competition_id}")
async def get_team_activity_feed(competition_id: int, user: AuthorizedUser, limit: int = 20) -> List[TeamActivityFeed]:
    """Get recent team activity feed for live updates"""
    conn = await get_conn()
    try:
        activities = await conn.fetch(
            """
            SELECT 
                e.player_name,
                p.team_name,
                e.activity_type,
                e.points,
                e.created_at
            FROM booking_competition_entries e
            JOIN booking_competition_participants p ON e.competition_id = p.competition_id AND e.player_name = p.player_name
            WHERE e.competition_id = $1
            ORDER BY e.created_at DESC
            LIMIT $2
            """,
            competition_id,
            limit
        )
        
        return [
            TeamActivityFeed(
                player_name=activity['player_name'],
                team_name=activity['team_name'],
                activity_type=activity['activity_type'],
                points=int(activity['points']),
                created_at=activity['created_at']
            )
            for activity in activities
        ]
        
    finally:
        await conn.close()

@router.get("/competition-stats/{competition_id}")
async def get_competition_stats(competition_id: int, user: AuthorizedUser) -> CompetitionStatsResponse:
    """Get comprehensive competition statistics for enhanced display"""
    conn = await get_conn()
    try:
        # Get overall competition stats
        overall_stats = await conn.fetchrow(
            """
            SELECT 
                COUNT(DISTINCT p.player_name) as total_participants,
                COUNT(e.id) as total_entries
            FROM booking_competition_participants p
            LEFT JOIN booking_competition_entries e ON e.competition_id = p.competition_id
            WHERE p.competition_id = $1
            """,
            competition_id
        )
        
        # Get most active player
        most_active = await conn.fetchrow(
            """
            SELECT player_name, COUNT(*) as entry_count
            FROM booking_competition_entries 
            WHERE competition_id = $1
            GROUP BY player_name
            ORDER BY entry_count DESC
            LIMIT 1
            """,
            competition_id
        )
        
        # Get team leaderboard
        team_leaderboard = await get_team_leaderboard(competition_id, user)
        
        # Get recent activity
        recent_activity = await get_team_activity_feed(competition_id, user, 10)
        
        # Determine leading team
        leading_team = None
        if team_leaderboard.team_a.total_points > team_leaderboard.team_b.total_points:
            leading_team = team_leaderboard.team_a.team_name
        elif team_leaderboard.team_b.total_points > team_leaderboard.team_a.total_points:
            leading_team = team_leaderboard.team_b.team_name
            
        return CompetitionStatsResponse(
            competition_id=competition_id,
            total_participants=int(overall_stats['total_participants']),
            total_entries=int(overall_stats['total_entries']),
            most_active_player=most_active['player_name'] if most_active else None,
            leading_team=leading_team,
            team_leaderboard=team_leaderboard,
            recent_activity=recent_activity
        )
        
    finally:
        await conn.close()


async def trigger_activity_center_logging(player_name: str, user_sub: str, conn):
    """
    Trigger activity center logging when a Books activity is logged in Competition.
    Create corresponding "Booked Meeting" activity in Activity Center with 1 point.
    """
    try:
        # Get current quarter
        quarter_row = await conn.fetchrow("""
            SELECT id, name, is_active 
            FROM quarters 
            WHERE is_active = true 
            ORDER BY created_at DESC 
            LIMIT 1
        """)
        
        if not quarter_row:
            print(f"No active quarter found for player {player_name}")
            return
            
        quarter_id = quarter_row['id']
        
        # Get or create user profile
        profile = await conn.fetchrow("""
            SELECT id, points, name, goal_books, goal_opps, goal_deals
            FROM profiles 
            WHERE name = $1 AND quarter_id = $2
        """, player_name, quarter_id)
        
        if not profile:
            # Create new profile if doesn't exist
            profile = await conn.fetchrow("""
                INSERT INTO profiles (user_id, quarter_id, name, points) 
                VALUES ($1, $2, $3, 0) 
                RETURNING id, points, name
            """, user_sub, quarter_id, player_name)
            print(f"Created new profile for player {player_name}")
        
        # Log the Books activity in Activity Center (1 point for quarterly progression)
        activity = await conn.fetchrow("""
            INSERT INTO activities (profile_id, quarter_id, type, points)
            VALUES ($1, $2, $3, $4)
            RETURNING id
        """, profile['id'], quarter_id, 'book', 1)
        
        # Update player's total points
        await conn.execute("""
            UPDATE profiles 
            SET points = points + 1
            WHERE id = $1
        """, profile['id'])
        
        print(f"Successfully logged Books activity for {player_name} in Activity Center (+1 point)")
        
    except Exception as e:
        print(f"Error triggering activity center logging: {e}")
        # Don't raise - this is optional functionality that shouldn't break main flow
