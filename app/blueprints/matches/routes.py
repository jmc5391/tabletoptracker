from flask import request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.extensions import db
from app.models import Match, MatchPlayer, Event, EventRole, EventPlayer, User
from . import matches_bp
from datetime import datetime


def _to_int_id(val):
    try:
        return int(val)
    except Exception:
        return val


@matches_bp.route("/<int:match_id>", methods=["GET"])
@jwt_required()
def get_match(match_id):
    m = Match.query.get_or_404(match_id)

    # get MatchPlayers info
    match_players = (db.session.query(MatchPlayer, User).join(User, MatchPlayer.user_id == User.user_id).filter(MatchPlayer.match_id == match_id).all())

    players_list = []
    for mp, user in match_players:
        players_list.append({"user_id": user.user_id,"name": user.name,"score": mp.score,"result": mp.result})

    # get event admins
    event_admins = (db.session.query(User).join(EventRole, EventRole.user_id == User.user_id).filter(EventRole.event_id == m.event_id, EventRole.role == "admin").all())

    admins_list = [{"user_id": a.user_id, "name": a.name, "email": a.email} for a in event_admins]

    return jsonify({
        "match_id": m.match_id,
        "event_id": m.event_id,
        "round": m.round,
        "date": m.date.isoformat(),
        "status": m.status,
        "players": players_list,
        "event_admins": admins_list
    }), 200


@matches_bp.route("/<int:match_id>", methods=["DELETE"])
@jwt_required()
def delete_match(match_id):
    current = _to_int_id(get_jwt_identity())
    m = Match.query.get_or_404(match_id)

    # check admin permission via EventRole
    is_admin = EventRole.query.filter_by(event_id=m.event_id, user_id=current, role="admin").first()
    if not is_admin:
        return jsonify({"msg": "forbidden"}), 403

    # remove MatchPlayer rows first
    MatchPlayer.query.filter_by(match_id=match_id).delete()
    db.session.delete(m)
    db.session.commit()
    return jsonify({"msg": "match deleted"}), 200


@matches_bp.route("/<int:match_id>/results", methods=["POST"])
@jwt_required()
def record_results(match_id):
    match = Match.query.get_or_404(match_id)
    current_user = get_jwt_identity()

    # check either event admin or one of the match players
    is_admin = db.session.query(EventRole).filter_by(
        event_id=match.event_id,
        user_id=current_user,
        role="admin"
    ).first() is not None

    is_player = any(mp.user_id == current_user for mp in match.match_players)

    if not (is_admin or is_player):
        return jsonify({"msg": "Not authorized to record results"}), 403

    data = request.get_json() or {}
    scores = data.get("scores")

    if not scores or len(scores) != len(match.match_players):
        return jsonify({"msg": "Scores must be provided for all match players"}), 400

    # assign scores as integers
    for mp in match.match_players:
        if str(mp.user_id) not in scores:
            return jsonify({"msg": f"Missing score for player {mp.user_id}"}), 400
        try:
            mp.score = int(scores[str(mp.user_id)])
        except ValueError:
            return jsonify({"msg": f"Invalid score for player {mp.user_id}"}), 400

    # determine results (win/loss/tie)
    if len(match.match_players) != 2:
        return jsonify({"msg": "Currently only supports 2-player matches"}), 400

    p1, p2 = match.match_players
    if p1.score > p2.score:
        p1.result = "win"
        p2.result = "loss"
    elif p2.score > p1.score:
        p2.result = "win"
        p1.result = "loss"
    else:
        p1.result = p2.result = "tie"

    # mark match as completed
    match.status = "completed"

    db.session.commit()
    return jsonify({"msg": "Results recorded", "match_id": match.match_id}), 200
