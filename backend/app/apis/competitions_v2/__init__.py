from fastapi import APIRouter, HTTPException, Query, Header, Request
from pydantic import BaseModel, Field, validator
from typing import List, Optional, Dict, Any, Literal
from datetime import datetime, timedelta, timezone
from enum import Enum
import asyncpg
import json
import re
import logging

import databutton as db
from app.auth import AuthorizedUser
from app.apis.admin import check_admin_access
from app.apis.player_selection import convert_user_id_to_uuid

from app.libs.models_competition_v2 import (
    CompetitionCreateV2,
    CompetitionRules,
    CompetitionTheme,
    CompetitionPrizes,
    CompetitionState,
    BookingActivityType,
    CompetitionResponseV2,
    CompetitionEventCreate,
    CompetitionEventResponse,
    ScoringPreviewRequest,
    ScoringPreviewResponse,
    ValidationRequest,
    ValidationResponse,
    ScoreboardResponse,
    UndoEventRequest,
    UndoEventResponse,
    SuspiciousEvent,
    UndoStats,
    AntiCheatReportResponse,
    FinalizeCompetitionRequestV2,
    FinalizeCompetitionResponse,
    CompetitionWinner,
)

from app.libs.scoring_engine import ScoringEngine

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/competitions-v2")

HEX_RE = re.compile(r"^#[0-9a-fA-F]{6}$")

def utcnow() -> datetime:
    return datetime.now(timezone.utc)

# Database connection helper
async def get_connection() -> asyncpg.Connection:
    """Get database connection (caller must close)."""
    return await asyncpg.connect(db.secrets.get("DATABASE_URL_DEV"))

# ===== COMPETITIONS 2.0 ADMIN ENDPOINTS =====

@router.post("/create", response_model=CompetitionResponseV2)
async def create_competition_v2(
    body: CompetitionCreateV2,
    user: AuthorizedUser,
    x_idempotency_key: Optional[str] = Header(default=None, alias="X-Idempotency-Key"),
):
    """Create a new competition with advanced Competitions 2.0 features."""
    check_admin_access(user)
    conn = await get_connection()
    try:
        await conn.execute("BEGIN")
        # Optional idempotency to avoid duplicate creations
        idem_key = x_idempotency_key or f"create:{user.sub}:{body.name}:{int(utcnow().timestamp())}"
        await conn.execute("""
            DO $$
            BEGIN
              IF NOT EXISTS (
                SELECT 1 FROM idempotency_keys WHERE key = $1
              ) THEN
                INSERT INTO idempotency_keys(key, created_at) VALUES ($1, NOW() AT TIME ZONE 'UTC');
              ELSE
                RAISE EXCEPTION 'duplicate request' USING ERRCODE = 'unique_violation';
              END IF;
            EXCEPTION WHEN unique_violation THEN
              RAISE EXCEPTION 'Duplicate create request (idempotency)' USING ERRCODE = 'unique_violation';
            END;
            $$;
        """, idem_key)

        row = await conn.fetchrow(
            """
            INSERT INTO booking_competitions (
                name, description, start_time, end_time, is_hidden,
                rules, theme, prizes, state, created_by, team_id
            )
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
            RETURNING id, name, description, start_time, end_time,
                      is_active, is_hidden, rules, theme, prizes, state,
                      team_id, created_by, created_at, updated_at
            """,
            body.name,
            body.description,
            body.start_time,
            body.end_time,
            body.is_hidden,
            json.dumps(body.rules.dict()),
            json.dumps(body.theme.dict()),
            json.dumps(body.prizes.dict()),
            CompetitionState.ACTIVE.value,  # make visible
            user.sub,
            body.team_id,
        )

        await conn.execute("COMMIT")

        # Map JSONB to models
        response_data = dict(row)
        response_data["rules"] = CompetitionRules(**json.loads(response_data["rules"]))
        response_data["theme"] = CompetitionTheme(**json.loads(response_data["theme"]))
        response_data["prizes"] = CompetitionPrizes(**json.loads(response_data["prizes"]))
        response_data["state"] = CompetitionState(response_data["state"])
        return CompetitionResponseV2(**response_data)

    except asyncpg.UniqueViolationError:
        await conn.execute("ROLLBACK")
        raise HTTPException(status_code=409, detail="Duplicate create request (idempotency)")
    except Exception as e:
        await conn.execute("ROLLBACK")
        logger.exception("create_competition_v2 failed")
        raise HTTPException(status_code=500, detail="Failed to create competition")
    finally:
        await conn.close()


@router.post("/validate", response_model=ValidationResponse)
async def validate_competition_config(body: ValidationRequest, user: AuthorizedUser):
    """Validate competition rules, theme, and prizes configuration."""
    check_admin_access(user)

    errors: List[str] = []
    warnings: List[str] = []
    suggestions: List[str] = []

    rules = body.rules

    # Points
    if rules.points.lift < 0 or rules.points.call < 0 or rules.points.book < 0:
        errors.append("Point values cannot be negative")
    if rules.points.book < rules.points.call:
        warnings.append("Books typically have higher points than calls")

    # Multipliers
    for i, mult in enumerate(rules.multipliers):
        if mult.mult < 1.0 or mult.mult > 5.0:
            errors.append(f"Multiplier {i+1}: value must be between 1.0 and 5.0")
        if mult.type == "time_window" and not mult.window:
            errors.append(f"Multiplier {i+1}: time_window type requires window configuration")
        if mult.type == "streak" and not getattr(mult, "min", None):
            errors.append(f"Multiplier {i+1}: streak type requires min value")

    # Combos
    for i, combo in enumerate(rules.combos):
        if combo.within_minutes < 1 or combo.within_minutes > 120:
            errors.append(f"Combo {i+1}: time window must be between 1-120 minutes")
        if combo.bonus < 1:
            errors.append(f"Combo {i+1}: bonus must be positive")

    # Caps
    if rules.caps.per_player_per_day is not None and rules.caps.per_player_per_day < 1:
        errors.append("Daily cap must be positive")
    if rules.caps.per_player_total is not None and rules.caps.per_player_total < 1:
        errors.append("Total cap must be positive")

    # Theme colors
    theme = body.theme
    for i, team in enumerate(theme.teams):
        if not HEX_RE.match(team.color):
            errors.append(f"Team {i+1}: invalid hex color format")

    # Prizes
    prizes = body.prizes
    if prizes.winner < 0 or prizes.runner_up < 0 or prizes.participation < 0:
        errors.append("Prize values cannot be negative")
    if prizes.winner <= prizes.runner_up:
        warnings.append("Winner prize should typically be higher than runner-up")

    # Suggestions
    if not rules.multipliers:
        suggestions.append("Consider adding time-based multipliers for increased engagement")
    if not rules.combos:
        suggestions.append("Consider adding combo bonuses to reward rapid activity")
    if len(theme.teams) < 2:
        suggestions.append("Add team configurations for team-based competition")

    return ValidationResponse(
        is_valid=len(errors) == 0,
        errors=errors,
        warnings=warnings,
        suggestions=suggestions,
    )


@router.post("/preview", response_model=ScoringPreviewResponse)
async def preview_scoring(body: ScoringPreviewRequest, user: AuthorizedUser):
    """Preview how scoring rules would work with sample events."""
    check_admin_access(user)
    try:
        player_scores: Dict[str, Dict[str, Any]] = {}
        warnings: List[str] = []
        errors: List[str] = []

        for event_data in body.sample_events:
            try:
                activity_type = BookingActivityType(event_data.get("type", "book"))
                player_name = event_data.get("player_name", "Sample Player")
                if activity_type == BookingActivityType.LIFT:
                    base_points = body.rules.points.lift
                elif activity_type == BookingActivityType.CALL:
                    base_points = body.rules.points.call
                elif activity_type == BookingActivityType.BOOK:
                    base_points = body.rules.points.book
                else:
                    base_points = 0

                if player_name not in player_scores:
                    player_scores[player_name] = {
                        "total_points": 0,
                        "event_count": 0,
                        "breakdown": {},
                        "multipliers_applied": [],
                        "combos_achieved": [],
                    }

                s = player_scores[player_name]
                s["total_points"] += base_points
                s["event_count"] += 1
                s["breakdown"][activity_type.value] = s["breakdown"].get(activity_type.value, 0) + 1

            except Exception as e:
                errors.append(f"Error processing sample event: {str(e)}")

        calculated_scores = [
            {
                "player_name": name,
                "total_points": data["total_points"],
                "event_count": data["event_count"],
                "breakdown": data["breakdown"],
                "multipliers_applied": data["multipliers_applied"],
                "combos_achieved": data["combos_achieved"],
                "last_activity": None,
                "current_streak": 0,
            }
            for name, data in player_scores.items()
        ]

        rules_validation = {
            "total_multipliers": len(body.rules.multipliers),
            "total_combos": len(body.rules.combos),
            "has_caps": bool(
                body.rules.caps.per_player_per_day
                or body.rules.caps.per_player_total
                or body.rules.caps.global_total
            ),
        }

        if not body.sample_events:
            warnings.append("No sample events provided - consider adding test data")

        return ScoringPreviewResponse(
            calculated_scores=calculated_scores,
            rules_validation=rules_validation,
            warnings=warnings,
            errors=errors,
        )
    except Exception as e:
        logger.exception("preview_scoring failed")
        return ScoringPreviewResponse(
            calculated_scores=[],
            rules_validation={},
            warnings=[],
            errors=[f"Preview failed: {str(e)}"],
        )


@router.post("/event", response_model=CompetitionEventResponse)
async def log_competition_event(
    body: CompetitionEventCreate,
    user: AuthorizedUser,
    x_idempotency_key: Optional[str] = Header(default=None, alias="X-Idempotency-Key"),
):
    """Log an event using the advanced scoring engine (idempotent + enrollment checks)."""

    def is_admin_user() -> bool:
        try:
            check_admin_access(user)
            return True
        except Exception:
            return False

    engine = ScoringEngine()
    conn = await get_connection()
    try:
        # Fetch competition and validate state
        comp_row = await conn.fetchrow(
            "SELECT rules, state FROM booking_competitions WHERE id = $1",
            body.competition_id,
        )
        if not comp_row:
            raise HTTPException(status_code=404, detail="Competition not found")
        if CompetitionState(comp_row["state"]) not in (CompetitionState.ACTIVE, CompetitionState.DRAFT):
            raise HTTPException(status_code=400, detail="Competition is not active")

        rules = CompetitionRules(**json.loads(comp_row["rules"]))

        # Authorization: non-admins only for own player
        if not is_admin_user():
            user_uuid = convert_user_id_to_uuid(user.sub)
            mapping = await conn.fetchrow(
                "SELECT player_name FROM user_player_mapping WHERE user_id = $1",
                user_uuid,
            )
            if not mapping:
                raise HTTPException(status_code=400, detail="You must select a player before participating.")

            my_player = mapping["player_name"]
            if not body.player_name or body.player_name != my_player:
                raise HTTPException(status_code=403, detail="You can only log events for your own player.")

            # Ensure enrollment (auto-enroll if needed)
            participant = await conn.fetchrow(
                """
                SELECT 1 FROM booking_competition_participants
                WHERE competition_id = $1 AND player_name = $2
                """,
                body.competition_id,
                my_player,
            )
            if not participant:
                await conn.execute(
                    """
                    INSERT INTO booking_competition_participants (competition_id, player_name)
                    VALUES ($1, $2)
                    ON CONFLICT (competition_id, player_name) DO NOTHING
                    """,
                    body.competition_id,
                    my_player,
                )

        # Optional idempotency key to prevent accidental double taps
        if x_idempotency_key:
            try:
                await conn.execute(
                    "INSERT INTO idempotency_keys(key, created_at) VALUES ($1, NOW() AT TIME ZONE 'UTC')",
                    x_idempotency_key,
                )
            except asyncpg.UniqueViolationError:
                raise HTTPException(status_code=409, detail="Duplicate event (idempotency)")

        # Delegate scoring + persistence
        return await engine.log_event(body, rules)

    finally:
        await conn.close()


@router.get("/{competition_id}/scoreboard", response_model=ScoreboardResponse)
async def get_competition_scoreboard_v2(competition_id: int, user: AuthorizedUser):
    """Get advanced scoreboard with full scoring breakdown."""
    engine = ScoringEngine()
    conn = await get_connection()
    try:
        comp_row = await conn.fetchrow(
            "SELECT rules FROM booking_competitions WHERE id = $1",
            competition_id,
        )
        if not comp_row:
            raise HTTPException(status_code=404, detail="Competition not found")
        rules = CompetitionRules(**json.loads(comp_row["rules"]))
        return await engine.calculate_scoreboard(competition_id, rules)
    finally:
        await conn.close()


@router.get("/list", response_model=List[CompetitionResponseV2])
async def list_competitions_v2(user: AuthorizedUser):
    """List all Competitions 2.0 with advanced features."""
    check_admin_access(user)
    conn = await get_connection()
    try:
        rows = await conn.fetch(
            """
            SELECT id, name, description, start_time, end_time, is_active, is_hidden,
                   rules, theme, prizes, state, team_id, created_by, created_at, updated_at
            FROM booking_competitions
            WHERE rules IS NOT NULL
            ORDER BY created_at DESC
            """
        )
        competitions: List[CompetitionResponseV2] = []
        for row in rows:
            response_data = dict(row)
            response_data["rules"] = CompetitionRules(**json.loads(response_data["rules"]))
            response_data["theme"] = CompetitionTheme(**json.loads(response_data["theme"]))
            response_data["prizes"] = CompetitionPrizes(**json.loads(response_data["prizes"]))
            response_data["state"] = CompetitionState(response_data["state"])
            competitions.append(CompetitionResponseV2(**response_data))
        return competitions
    finally:
        await conn.close()


@router.get("/health")
async def health_check():
    """Simple health check for Competitions 2.0 API."""
    return {
        "status": "healthy",
        "api_version": "2.0",
        "features": ["advanced_scoring", "multipliers", "combos", "caps", "real_time_events"],
        "time_utc": utcnow().isoformat(),
    }


@router.get("/sample-config")
async def get_sample_config():
    """Get a sample competition configuration for testing."""
    from app.libs.models_competition_v2 import (
        CompetitionRules,
        CompetitionTheme,
        CompetitionPrizes,
        PointsConfig,
        VFXConfig,
    )

    sample_rules = CompetitionRules(points=PointsConfig(lift=1, call=4, book=10), multipliers=[], combos=[], caps={})
    sample_theme = CompetitionTheme(teams=[], vfx=VFXConfig(), badges=["streaker", "clutch", "early_bird"], custom_sounds={})
    sample_prizes = CompetitionPrizes(winner=50, runner_up=20, participation=5)

    return {"rules": sample_rules.dict(), "theme": sample_theme.dict(), "prizes": sample_prizes.dict()}


# ===== Anti-cheat & Undo =====

@router.post("/undo-event", response_model=UndoEventResponse)
async def undo_competition_event(request: UndoEventRequest, user: AuthorizedUser) -> UndoEventResponse:
    """Undo a specific competition event with anti-cheat validation (within 30 minutes)."""
    conn = await get_connection()
    try:
        event_record = await conn.fetchrow(
            """
            SELECT ce.*, bc.rules, bc.state
            FROM booking_competition_events ce
            JOIN booking_competitions bc ON ce.competition_id = bc.id
            WHERE ce.id = $1 AND ce.player_name = $2
            """,
            request.event_id,
            (user.display_name or user.sub),
        )
        if not event_record:
            raise HTTPException(status_code=404, detail="Event not found or access denied")

        # window
        event_time: datetime = event_record["created_at"]
        if (utcnow() - (event_time if event_time.tzinfo else event_time.replace(tzinfo=timezone.utc))) > timedelta(minutes=30):
            raise HTTPException(status_code=400, detail="Cannot undo events older than 30 minutes")

        # compensating event
        undo_event_data = {
            "competition_id": event_record["competition_id"],
            "player_name": event_record["player_name"],
            "activity_type": event_record["activity_type"],
            "points": -event_record["points"],
            "metadata": {
                "undo_of": request.event_id,
                "reason": request.reason,
                "undone_at": utcnow().isoformat(),
            },
        }

        undo_record = await conn.fetchrow(
            """
            INSERT INTO booking_competition_events
            (competition_id, player_name, activity_type, points, metadata)
            VALUES ($1,$2,$3,$4,$5)
            RETURNING id, created_at
            """,
            undo_event_data["competition_id"],
            undo_event_data["player_name"],
            undo_event_data["activity_type"],
            undo_event_data["points"],
            json.dumps(undo_event_data["metadata"]),
        )

        await conn.execute(
            "UPDATE booking_competition_events SET metadata = COALESCE(metadata,'{}')::jsonb || $1 WHERE id = $2",
            json.dumps({"undone_by": str(undo_record["id"])}),
            request.event_id,
        )

        return UndoEventResponse(success=True, undo_event_id=str(undo_record["id"]), message=f"Event {request.event_id} successfully undone")

    except HTTPException:
        raise
    except Exception as e:
        logger.exception("undo_competition_event failed")
        raise HTTPException(status_code=500, detail="Failed to undo event")
    finally:
        await conn.close()


@router.get("/anti-cheat-report/{competition_id}", response_model=AntiCheatReportResponse)
async def get_anti_cheat_report(competition_id: int, user: AuthorizedUser) -> AntiCheatReportResponse:
    """Generate anti-cheat report for competition."""
    check_admin_access(user)
    conn = await get_connection()
    try:
        suspicious_events = await conn.fetch(
            """
            WITH event_analysis AS (
              SELECT
                player_name,
                activity_type,
                created_at,
                points,
                LAG(created_at) OVER (PARTITION BY player_name ORDER BY created_at) AS prev_time,
                COUNT(*) OVER (
                  PARTITION BY player_name
                  ORDER BY created_at
                  ROWS BETWEEN 50 PRECEDING AND CURRENT ROW
                ) AS rolling_count
              FROM booking_competition_events
              WHERE competition_id = $1
                AND (metadata->>'undo_of') IS NULL
            )
            SELECT
              player_name,
              activity_type,
              created_at,
              points,
              CASE
                WHEN EXTRACT(EPOCH FROM (created_at - prev_time)) < 5 THEN 'rapid_succession'
                WHEN rolling_count > 50 THEN 'burst_activity'
                ELSE NULL
              END AS suspicion_type
            FROM event_analysis
            WHERE (EXTRACT(EPOCH FROM (created_at - prev_time)) < 5)
               OR (rolling_count > 50)
            ORDER BY created_at DESC
            """,
            competition_id,
        )

        undo_stats = await conn.fetch(
            """
            SELECT player_name, COUNT(*) AS undo_count, MAX(created_at) AS last_undo
            FROM booking_competition_events
            WHERE competition_id = $1 AND points < 0
            GROUP BY player_name
            HAVING COUNT(*) > 2
            """,
            competition_id,
        )

        return AntiCheatReportResponse(
            competition_id=competition_id,
            suspicious_events=[
                SuspiciousEvent(
                    player_name=r["player_name"],
                    activity_type=r["activity_type"],
                    created_at=r["created_at"],
                    points=r["points"],
                    suspicion_type=r["suspicion_type"],
                )
                for r in suspicious_events
            ],
            undo_statistics=[
                UndoStats(player_name=u["player_name"], undo_count=u["undo_count"], last_undo=u["last_undo"])
                for u in undo_stats
            ],
            generated_at=utcnow(),
        )
    finally:
        await conn.close()


# Simple undo endpoint for testing
@router.post("/simple-undo/{event_id}")
async def simple_undo_event(event_id: str, user: AuthorizedUser):
    """Simplified undo (testing): deletes an event by id."""
    check_admin_access(user)
    conn = await get_connection()
    try:
        deleted_row = await conn.fetchrow(
            "DELETE FROM booking_competition_events WHERE id = $1 RETURNING *",
            event_id,
        )
        if not deleted_row:
            raise HTTPException(status_code=404, detail="Event not found")

        return {
            "success": True,
            "message": f"Event {event_id} undone successfully",
            "undone_event": {
                "id": str(deleted_row["id"]),
                "player_name": deleted_row["player_name"],
                "activity_type": deleted_row["activity_type"],  # <-- fixed name
                "points": deleted_row["points"],
            },
        }
    except Exception as e:
        logger.exception("simple_undo_event failed")
        raise HTTPException(status_code=500, detail=f"Failed to undo event: {str(e)}")
    finally:
        await conn.close()


@router.post("/finalize", response_model=FinalizeCompetitionResponse)
async def finalize_competition_v2(body: FinalizeCompetitionRequestV2, user: AuthorizedUser):
    """Finalize competition and award bonuses (one-time, outside normal scoring)."""
    check_admin_access(user)
    conn = await get_connection()
    try:
        comp_row = await conn.fetchrow("SELECT * FROM booking_competitions WHERE id = $1", body.competition_id)
        if not comp_row:
            raise HTTPException(status_code=404, detail="Competition not found")

        if comp_row["state"] == CompetitionState.FINALIZED.value:
            raise HTTPException(status_code=400, detail="Competition already finalized")

        prizes = json.loads(comp_row["prizes"]) if comp_row["prizes"] else {}
        rules = json.loads(comp_row["rules"]) if comp_row["rules"] else {}

        engine = ScoringEngine()
        scoreboard = await engine.calculate_scoreboard(body.competition_id, CompetitionRules(**rules))

        winners: List[CompetitionWinner] = []
        total_bonuses = 0

        # Award top 3 (configurable via prizes)
        for i, player in enumerate(scoreboard.individual_leaderboard[:3]):
            rank = i + 1
            bonus = 0
            if body.award_bonuses:
                if rank == 1:
                    bonus = prizes.get("winner", 0)
                elif rank == 2:
                    bonus = prizes.get("runner_up", 0)
                else:
                    bonus = prizes.get("participation", 0)

                if bonus > 0:
                    await conn.execute(
                        """
                        INSERT INTO bonus_awards_ledger (player_name, source, points, description, competition_id)
                        VALUES ($1, $2, $3, $4, $5)
                        """,
                        player.player_name,
                        "competition_win",
                        bonus,
                        f"Competition {body.competition_id} - Rank {rank}",
                        body.competition_id,
                    )
                    total_bonuses += bonus

            winners.append(
                CompetitionWinner(
                    player_name=player.player_name,
                    total_points=player.total_points,
                    rank=rank,
                    bonus_awarded=bonus,
                )
            )

        snapshot_id = await conn.fetchval(
            """
            INSERT INTO booking_competition_results (competition_id, snapshot, snapshot_type)
            VALUES ($1, $2, 'finalization') RETURNING id
            """,
            body.competition_id,
            json.dumps(scoreboard.dict()),
        )

        await conn.execute(
            "UPDATE booking_competitions SET state = $1 WHERE id = $2",
            CompetitionState.FINALIZED.value,
            body.competition_id,
        )

        return FinalizeCompetitionResponse(
            competition_id=body.competition_id,
            winners=winners,
            snapshot_id=snapshot_id,
            total_bonuses_awarded=total_bonuses,
            finalized_at=utcnow(),
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.exception("finalize_competition_v2 failed")
        raise HTTPException(status_code=500, detail=f"Failed to finalize competition: {str(e)}")
    finally:
        await conn.close()
