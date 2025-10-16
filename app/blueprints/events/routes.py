from flask import request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.extensions import db
from app.models import Event, EventPlayer, User, EventRole, Match, MatchPlayer
from . import events_bp
from datetime import datetime, timedelta
from random import shuffle


# helper functions
def parse_iso(dt_str):
    if not dt_str:
        return None
    return datetime.fromisoformat(dt_str)


# ======== EVENT ENDPOINTS ========
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
    player_stats = {p.user_id: {"name": p.name, "wins": 0, "losses": 0, "ties": 0, "score": 0} for p in players}
    
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

        for mp in match_players:
            stats = player_stats.get(mp["user_id"])
            if not stats:
                continue
            stats["score"] += mp["score"] or 0
            if mp["result"] == "win":
                stats["wins"] += 1
            elif mp["result"] == "loss":
                stats["losses"] += 1
            elif mp["result"] == "tie":
                stats["ties"] += 1

        result_label = "TBD"
        if len(match_players) == 2:
            s1, s2 = match_players[0]["score"], match_players[1]["score"]
            if s1 > s2:
                result_label = match_players[0]["name"] + " W " + str(match_players[0]["score"]) + "-" + str(match_players[1]["score"])
            elif s2 > s1:
                result_label = match_players[1]["name"] + " W" + str(match_players[1]["score"]) + "-" + str(match_players[0]["score"])
            else:
                result_label = "T" + str(match_players[0]["score"]) + "-" + str(match_players[1]["score"])

        team1_name = match_players[0]["name"] if len(match_players) > 0 else "TBD"
        team2_name = match_players[1]["name"] if len(match_players) > 1 else "TBD"
        team1_score = match_players[0]["score"] if len(match_players) > 0 else None
        team2_score = match_players[1]["score"] if len(match_players) > 1 else None

        matches_data.append({
            "match_id": m.match_id,
            "match_title": f"{team1_name} vs. {team2_name}",
            "team1_name": team1_name,
            "team2_name": team2_name,
            "team1_score": team1_score,
            "team2_score": team2_score,
            "date_played": m.date.isoformat() if m.date else None,
            "status": m.status,
            "result_label": result_label
        })

    # combine player stats to create leaderboard
    leaderboard = []
    for pid, stats in player_stats.items():
        leaderboard.append({
            "user_id": pid,
            "name": stats["name"],
            "wins": stats["wins"],
            "losses": stats["losses"],
            "ties": stats["ties"],
            "score": stats["score"],
        })

    # sort leaderboard by results
    leaderboard.sort(key=lambda x: (-x["wins"], x["losses"], -x["ties"], -x["score"], x["name"].lower()))

    # assign each player a rank
    ranked_leaderboard = []
    rank = 1
    for i, player in enumerate(leaderboard):
        if i > 0:
            prev = leaderboard[i - 1]
            same_record = (
                player["wins"] == prev["wins"]
                and player["losses"] == prev["losses"]
                and player["ties"] == prev["ties"]
                and player["score"] == prev["score"]
            )
            if not same_record:
                rank = i + 1
        player["rank"] = rank
        ranked_leaderboard.append(player)

    return jsonify({
        "event_id": event.event_id,
        "name": event.name,
        "start_date": event.start_date.isoformat() if event.start_date else None,
        "end_date": event.end_date.isoformat() if event.end_date else None,
        "admins": [{"user_id": a.user_id, "name": a.name, "email": a.email} for a in admins],
        "players": [{"user_id": p.user_id, "name": p.name, "email": p.email} for p in players],
        "matches": matches_data,
        "leaderboard": ranked_leaderboard,
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

    # Prevent duplicate EventPlayer
    exists = EventPlayer.query.filter_by(event_id=event_id, user_id=user.user_id).first()
    if exists:
        return jsonify({"msg": "player already added"}), 400

    # Add EventPlayer entry
    ep = EventPlayer(user_id=user.user_id, event_id=event_id)
    db.session.add(ep)

    # Ensure EventRole entry exists for "player" role
    player_role = EventRole.query.filter_by(event_id=event_id, user_id=user.user_id, role="player").first()
    if not player_role:
        new_role = EventRole(user_id=user.user_id, event_id=event_id, role="player")
        db.session.add(new_role)

    db.session.commit()
    return jsonify({"msg": "player added", "user_id": user.user_id}), 201


@events_bp.route("/<int:event_id>/players/<int:user_id>", methods=["DELETE"])
@jwt_required()
def remove_player(event_id, user_id):
    current = get_jwt_identity()
    ev = Event.query.get_or_404(event_id)

    # check if current user is an admin
    is_admin = EventRole.query.filter_by(event_id=event_id, user_id=current, role="admin").first()
    if not is_admin:
        return jsonify({"msg": "forbidden"}), 403

    # find the EventPlayer
    ep = EventPlayer.query.filter_by(event_id=event_id, user_id=user_id).first()
    if not ep:
        return jsonify({"msg": "player not found"}), 404

    db.session.delete(ep)

    # remove EventRole entry only if the role is "player"
    player_role = EventRole.query.filter_by(event_id=event_id, user_id=user_id, role="player").first()
    if player_role:
        db.session.delete(player_role)

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


@events_bp.route("/<int:event_id>/generate_round_robin", methods=["POST"])
@jwt_required()
def generate_round_robin(event_id):
    current_user = int(get_jwt_identity())
    ev = Event.query.get_or_404(event_id)

    # check admin permission
    is_admin = any(r.user_id == current_user and r.role == "admin" for r in ev.event_roles)
    if not is_admin:
        return jsonify({"msg": "Only admins can generate round robin"}), 403

    # gather only players from this event
    players = [r.user_id for r in ev.event_roles if r.role == "player"]
    if len(players) < 2:
        return jsonify({"msg": "Need at least two players"}), 400

    # add dummy "Bye" if odd count
    dummy_id = None
    if len(players) % 2 != 0:
        dummy = User.query.filter_by(email="__DUMMY__").first()
        if not dummy:
            dummy = User(name="Bye", email="__DUMMY__")
            db.session.add(dummy)
            db.session.commit()
        dummy_id = dummy.user_id
        players.append(dummy_id)

    # round-robin (circle method)
    num_players = len(players)
    rounds = num_players - 1
    half = num_players // 2
    player_list = players[:]
    schedule = []

    for r in range(rounds):
        pairs = []
        for i in range(half):
            p1 = player_list[i]
            p2 = player_list[num_players - 1 - i]
            if dummy_id not in (p1, p2):  # skip bye matches
                pairs.append((p1, p2))
        schedule.append(pairs)

        # correct rotation: fix first, rotate remainder clockwise
        fixed = player_list[0]
        rotating = player_list[1:]
        rotating = [rotating[-1]] + rotating[:-1]
        player_list = [fixed] + rotating

    # schedule matches one week apart
    start_date = datetime.now().date() + timedelta(days=7)
    created = []
    for round_num, round_pairs in enumerate(schedule, start=1):
        match_date = start_date + timedelta(weeks=round_num - 1)
        for p1, p2 in round_pairs:
            match = Match(
                event_id=event_id,
                round=round_num,
                date=match_date,
                status="scheduled",
            )
            db.session.add(match)
            db.session.flush()
            db.session.add_all([
                MatchPlayer(match_id=match.match_id, user_id=p1),
                MatchPlayer(match_id=match.match_id, user_id=p2),
            ])
            created.append({"round": round_num, "p1": p1, "p2": p2})
    db.session.commit()

    return jsonify({"msg": f"Generated {len(created)} matches", "matches": created}), 201


@events_bp.route("/<int:event_id>/generate_swiss_round", methods=["POST"])
@jwt_required()
def generate_swiss_round(event_id):

    current_user = int(get_jwt_identity())
    ev = Event.query.get_or_404(event_id)

    # admin check
    is_admin = any(r.user_id == current_user and r.role == "admin" for r in ev.event_roles)
    if not is_admin:
        return jsonify({"msg": "Only admins can generate Swiss rounds"}), 403

    # get all players only (exclude admins)
    players = [r.user_id for r in ev.event_roles if r.role == "player"]
    if len(players) < 2:
        return jsonify({"msg": "Need at least two players"}), 400

    # handle odd number of players (bye round)
    has_bye = len(players) % 2 != 0

    # compute points from past results
    points = {pid: 0 for pid in players}
    past_matches = (
        Match.query.join(MatchPlayer)
        .filter(Match.event_id == event_id, Match.status == "completed")
        .all()
    )

    # keep track of who played who before
    played_pairs = set()

    for match in past_matches:
        mps = MatchPlayer.query.filter_by(match_id=match.match_id).all()
        if len(mps) != 2:
            continue
        p1, p2 = mps[0].user_id, mps[1].user_id
        # only track pairs where both were players
        if p1 in players and p2 in players:
            played_pairs.add(tuple(sorted((p1, p2))))

        # infer results from MatchPlayer entries
        r1, r2 = mps[0].result, mps[1].result
        if p1 in players and p2 in players:
            if r1 == "draw" or r2 == "draw":
                points[p1] += 1
                points[p2] += 1
            elif r1 == "win":
                points[p1] += 3
            elif r2 == "win":
                points[p2] += 3

    # determine next round
    last_round = db.session.query(db.func.max(Match.round)).filter_by(event_id=event_id).scalar() or 0
    next_round = last_round + 1

    # sort Swiss style (by points desc, random within groups)
    groups = {}
    for pid in players:
        groups.setdefault(points[pid], []).append(pid)
    sorted_players = []
    for pts, group in sorted(groups.items(), key=lambda x: -x[0]):
        shuffle(group)
        sorted_players.extend(group)

    # try pairing without repeats
    pairs = []
    unpaired = sorted_players[:]
    while unpaired:
        p1 = unpaired.pop(0)
        if not unpaired:
            # bye round: skip creating match entirely
            continue

        p2 = None
        for candidate in unpaired:
            if tuple(sorted((p1, candidate))) not in played_pairs:
                p2 = candidate
                break

        if p2 is None:
            p2 = unpaired[0]

        unpaired.remove(p2)
        pairs.append((p1, p2))
        played_pairs.add(tuple(sorted((p1, p2))))

    # determine match date
    last_match = (
        Match.query.filter_by(event_id=event_id)
        .order_by(Match.date.desc())
        .first()
    )
    start_date = (
        (last_match.date + timedelta(weeks=1))
        if last_match else datetime.now().date() + timedelta(days=7)
    )

    # create matches
    created = []
    for p1, p2 in pairs:
        match = Match(
            event_id=event_id,
            round=next_round,
            date=start_date,
            status="scheduled",
        )
        db.session.add(match)
        db.session.flush()

        db.session.add(MatchPlayer(match_id=match.match_id, user_id=p1))
        db.session.add(MatchPlayer(match_id=match.match_id, user_id=p2))

        created.append({
            "round": next_round,
            "p1": p1,
            "p2": p2,
            "points_p1": points[p1],
            "points_p2": points[p2],
        })

    db.session.commit()

    return jsonify({
        "msg": f"Generated {len(created)} Swiss round {next_round} matches",
        "round": next_round,
        "matches": created,
    }), 201
