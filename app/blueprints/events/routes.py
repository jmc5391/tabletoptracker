from flask import request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.extensions import db
from app.models import Event, EventPlayer, User, EventRole
from . import events_bp
from datetime import datetime

def parse_iso(dt_str):
    if not dt_str:
        return None
    return datetime.fromisoformat(dt_str)

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


@events_bp.route("/<int:event_id>", methods=["GET"])
@jwt_required()
def get_event(event_id):
    user_id = get_jwt_identity()

    event = Event.query.get_or_404(event_id)

    # Get admins
    admins = (
        db.session.query(User)
        .join(EventRole)
        .filter(EventRole.event_id == event_id, EventRole.role == "admin")
        .all()
    )

    # Get players
    players = (
        db.session.query(User)
        .join(EventPlayer)
        .filter(EventPlayer.event_id == event_id)
        .all()
    )

    return jsonify({
        "event_id": event.event_id,
        "name": event.name,
        "start_date": event.start_date.isoformat() if event.start_date else None,
        "end_date": event.end_date.isoformat() if event.end_date else None,
        "admins": [{"user_id": a.user_id, "name": a.name, "email": a.email} for a in admins],
        "players": [{"user_id": p.user_id, "name": p.name, "email": p.email} for p in players],
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
