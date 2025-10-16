from flask import request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.extensions import db
from app.models import Event, EventPlayer, User, EventRole, Match, MatchPlayer
from . import events_bp
from datetime import datetime


# helper functions
def parse_iso(dt_str):
    if not dt_str:
        return None
    return datetime.fromisoformat(dt_str)


# ======== EVENT ENDPOINTS ========
@events_bp.route("/", methods=["POST"])
@jwt_required()
def create_event():
    user_id = get_jwt_identity()
    data = request.get_json() or {}

    name = data.get("name")
    if not name:
        return jsonify({"msg": "name required"}), 400

    start_date = parse_iso(data.get("start_date"))
    end_date = parse_iso(data.get("end_date"))

    if end_date and start_date > end_date:
        return jsonify({"msg": "start_date must be before end_date"}), 400

    # Create the event
    ev = Event(name=name, start_date=start_date, end_date=end_date)
    db.session.add(ev)
    db.session.commit()

    # Assign the creator as an admin for that event
    role = EventRole(user_id=user_id, event_id=ev.event_id, role="admin")
    db.session.add(role)
    db.session.commit()

    return jsonify({
        "event_id": ev.event_id,
        "name": ev.name,
        "start_date": ev.start_date.isoformat() if ev.start_date else None,
        "end_date": ev.end_date.isoformat() if ev.end_date else None,
        "role": role.role,
    }), 201


@events_bp.route("/<int:event_id>", methods=["GET"])
@jwt_required()
def get_event(event_id):
    user_id = get_jwt_identity()

    event = Event.query.get_or_404(event_id)

    # get admins
    admins = (
        db.session.query(User)
        .join(EventRole)
        .filter(EventRole.event_id == event_id, EventRole.role == "admin")
        .all()
    )

    # get players
    players = (
        db.session.query(User)
        .join(EventPlayer)
        .filter(EventPlayer.event_id == event_id)
        .all()
    )

    # get matches
    matches = (
        db.session.query(Match)
        .filter(Match.event_id == event_id)
        .all()
    )

    matches_data = []
    for m in matches:
        match_players = [
            {
                "user_id": mp.user.user_id,
                "name": mp.user.name,
                "score": mp.score,
                "result": mp.result,
            }
            for mp in m.match_players
        ]

        team1_name = match_players[0]["name"] if len(match_players) > 0 else "TBD"
        team2_name = match_players[1]["name"] if len(match_players) > 1 else "TBD"
        team1_score = match_players[0]["score"] if len(match_players) > 0 else None
        team2_score = match_players[1]["score"] if len(match_players) > 1 else None

        # determine winner/tie label
        result_label = None
        if m.status == "completed" and len(match_players) == 2:
            p1, p2 = match_players
            if p1["result"] == "win":
                result_label = f"{p1['name']} W"
            elif p2["result"] == "win":
                result_label = f"{p2['name']} W"
            elif p1["result"] == "tie" and p2["result"] == "tie":
                result_label = "T"

        matches_data.append({
            "match_id": m.match_id,
            "match_title": f"{team1_name} vs. {team2_name}",
            "team1_name": team1_name,
            "team2_name": team2_name,
            "team1_score": team1_score,
            "team2_score": team2_score,
            "date_played": m.date.isoformat() if m.date else None,
            "status": m.status,
            "result_label": result_label,
        })

    return jsonify({
        "event_id": event.event_id,
        "name": event.name,
        "start_date": event.start_date.isoformat() if event.start_date else None,
        "end_date": event.end_date.isoformat() if event.end_date else None,
        "admins": [{"user_id": a.user_id, "name": a.name, "email": a.email} for a in admins],
        "players": [{"user_id": p.user_id, "name": p.name, "email": p.email} for p in players],
        "matches": matches_data,
    }), 200



@events_bp.route("/<int:event_id>", methods=["DELETE"])
@jwt_required()
def delete_event(event_id):
    user_id = get_jwt_identity()
    role = EventRole.query.filter_by(event_id=event_id, user_id=user_id, role="admin").first()
    if not role:
        return jsonify({"msg": "admin only"}), 403

    event = Event.query.get_or_404(event_id)
    db.session.delete(event)
    db.session.commit()
    return jsonify({"msg": "event deleted"}), 200


# ======== EVENT PLAYER ENDPOINTS ========
@events_bp.route("/<int:event_id>/players", methods=["POST"])
@jwt_required()
def add_player(event_id):
    user_id = get_jwt_identity()
    role = EventRole.query.filter_by(event_id=event_id, user_id=user_id, role="admin").first()
    if not role:
        return jsonify({"msg": "admin only"}), 403

    data = request.get_json() or {}
    email = data.get("email")
    if not email:
        return jsonify({"msg": "email required"}), 400

    user = User.query.filter_by(email=email).first()
    if not user:
        return jsonify({"msg": "user not found"}), 404

    # Prevent duplicate
    exists = EventPlayer.query.filter_by(event_id=event_id, user_id=user.user_id).first()
    if exists:
        return jsonify({"msg": "player already added"}), 400

    ep = EventPlayer(user_id=user.user_id, event_id=event_id)
    db.session.add(ep)
    db.session.commit()
    return jsonify({"msg": "player added", "user_id": user.user_id}), 201


@events_bp.route("/", methods=["GET"])
@jwt_required()
def list_events():
    user_id = get_jwt_identity()

    # Get all events where user has a role
    events = (
        db.session.query(Event)
        .join(EventRole)
        .filter(EventRole.user_id == user_id)
        .all()
    )

    result = []
    for e in events:
        result.append({
            "event_id": e.event_id,
            "name": e.name,
            "start_date": e.start_date.isoformat() if e.start_date else None,
            "end_date": e.end_date.isoformat() if e.end_date else None,
        })

    return jsonify(result), 200


@events_bp.route("/<int:event_id>/players/<int:user_id>", methods=["DELETE"])
@jwt_required()
def remove_player(event_id, user_id):
    current = get_jwt_identity()
    ev = Event.query.get_or_404(event_id)

    # check if current user is an admin/organizer
    is_admin = EventRole.query.filter_by(event_id=event_id, user_id=current, role="admin").first()
    if not is_admin:
        return jsonify({"msg": "forbidden"}), 403

    # find the EventPlayer or invited email entry
    ep = EventPlayer.query.filter_by(event_id=event_id, user_id=user_id).first()
    if not ep:
        return jsonify({"msg": "player not found"}), 404

    db.session.delete(ep)
    db.session.commit()
    return jsonify({"msg": "player removed"}), 200


# ======== EVENT MATCH ENDPOINTS ========
@events_bp.route("/<int:event_id>/matches", methods=["GET"])
@jwt_required()
def get_event_matches(event_id):
    ev = Event.query.get_or_404(event_id)
    matches = [
        {
            "match_id": m.match_id,
            "round": m.round,
            "date": m.date.isoformat(),
            "status": m.status,
            "players": [
                {"user_id": mp.user.user_id, "name": mp.user.name, "score": mp.score, "result": mp.result}
                for mp in m.match_players
            ],
        }
        for m in ev.matches
    ]
    return jsonify(matches)


@events_bp.route("/<int:event_id>/matches", methods=["POST"])
@jwt_required()
def create_match(event_id):
    data = request.get_json()
    current_user = int(get_jwt_identity())

    ev = Event.query.get_or_404(event_id)

    # check admin permission
    is_admin = any(role.user_id == current_user for role in ev.event_roles if role.role == "admin")
    if not is_admin:
        return jsonify({"msg": "Only admins can schedule matches"}), 403

    player1_id = data.get("player1_id")
    player2_id = data.get("player2_id")

    if not player1_id or not player2_id or player1_id == player2_id:
        return jsonify({"msg": "Must select two distinct players"}), 400

    match = Match(
        event_id=event_id,
        round=data.get("round"),
        date=datetime.strptime(data.get("date"), "%Y-%m-%d").date(),
        status=data.get("status", "scheduled"),
    )
    db.session.add(match)
    db.session.flush()

    mp1 = MatchPlayer(match_id=match.match_id, user_id=player1_id)
    mp2 = MatchPlayer(match_id=match.match_id, user_id=player2_id)
    db.session.add_all([mp1, mp2])
    db.session.commit()

    return jsonify({"msg": "Match created", "match_id": match.match_id}), 201
