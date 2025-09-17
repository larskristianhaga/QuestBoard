from typing import Optional, Dict, Any
import asyncpg
from datetime import datetime

# Utilities for challenges: progress calculations and participant management

async def get_current_quarter_id(conn: asyncpg.Connection) -> Optional[int]:
    row = await conn.fetchrow("""
        SELECT id FROM quarters 
        WHERE start_date <= CURRENT_DATE AND end_date >= CURRENT_DATE
        ORDER BY start_date DESC LIMIT 1
    """)
    return row["id"] if row else None

async def ensure_participants_for_challenge(conn: asyncpg.Connection, challenge_id: int, quarter_id: int):
    # Ensure all players for the quarter exist as participants for per_person tracking
    player_rows = await conn.fetch("""
        SELECT name FROM profiles WHERE quarter_id = $1
    """, quarter_id)
    for r in player_rows:
        try:
            await conn.execute(
                """
                INSERT INTO challenge_participants (challenge_id, player_name, contribution)
                VALUES ($1, $2, 0)
                ON CONFLICT (challenge_id, player_name) DO NOTHING
                """,
                challenge_id, r["name"]
            )
        except Exception as e:
            print(f"ensure_participants_for_challenge error: {e}")

async def recalc_challenge_progress(conn: asyncpg.Connection, challenge_id: int):
    # Load challenge
    ch = await conn.fetchrow("SELECT * FROM challenges WHERE id = $1", challenge_id)
    if not ch:
        raise ValueError("Challenge not found")

    progress_mode = ch["progress_mode"] or "per_person"
    target_type = ch["target_type"]
    target_value = ch["target_value"] or 0
    quarter_id = ch["quarter_id"]

    # Reset status and aggregates
    await conn.execute(
        """
        UPDATE challenges SET current_progress = 0, completed_by = NULL, completed_at = NULL, status = 'active' 
        WHERE id = $1
        """, challenge_id
    )

    # Map activity type to activities.type
    type_map = {
        "meetings": "book",
        "opportunities": "opp",
        "deals": "deal",
        "points": None,  # Not supported for recalculation here
        "activities": None,
    }
    activity_type = type_map.get(target_type)

    if progress_mode == "team_total":
        if activity_type:
            total = await conn.fetchval(
                """
                SELECT COUNT(*) FROM activities a
                JOIN profiles p ON a.profile_id = p.id
                WHERE a.quarter_id = $1 AND a.type = $2
                """, quarter_id, activity_type
            )
        else:
            total = 0
        await conn.execute(
            "UPDATE challenges SET current_progress = $1, status = CASE WHEN $1 >= $2 THEN 'completed' ELSE 'active' END, completed_by = CASE WHEN $1 >= $2 THEN 'TEAM' ELSE NULL END, completed_at = CASE WHEN $1 >= $2 THEN CURRENT_TIMESTAMP ELSE NULL END WHERE id = $3",
            total, target_value, challenge_id
        )
    else:  # per_person
        # Ensure participants exist
        await ensure_participants_for_challenge(conn, challenge_id, quarter_id)
        # Compute per-player counts and update participants
        if activity_type:
            rows = await conn.fetch(
                """
                SELECT p.name as player_name, COUNT(*) as cnt
                FROM activities a
                JOIN profiles p ON a.profile_id = p.id
                WHERE a.quarter_id = $1 AND a.type = $2
                GROUP BY p.name
                """, quarter_id, activity_type
            )
        else:
            rows = []
        completed_players = []
        for r in rows:
            await conn.execute(
                "UPDATE challenge_participants SET contribution = $1 WHERE challenge_id = $2 AND player_name = $3",
                r["cnt"], challenge_id, r["player_name"]
            )
            if r["cnt"] >= target_value:
                completed_players.append(r["player_name"])
        # Aggregate current_progress as max or average; choose max to reflect leader for UI
        total_progress = 0 if not rows else max([r["cnt"] for r in rows])
        await conn.execute(
            "UPDATE challenges SET current_progress = $1 WHERE id = $2",
            total_progress, challenge_id
        )
        # If at least one player completed, do not set global completed for everyone; keep status active,
        # completion is tracked via participants. We can optionally mark TEAM completed only if all complete.
        # Here we keep the challenge active until end_time or admin manually completes.

    return True
