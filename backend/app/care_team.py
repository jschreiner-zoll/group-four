"""Care team management — assignments, clinician roster, and shift operations."""

import uuid
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.fhir_models import (
    CareTeam,
    CareTeamParticipant,
    CareTeamStatus,
    CodeableConcept,
    HandoffSummary,
    HumanName,
    Identifier,
    Period,
    Practitioner,
    Qualification,
    Reference,
    make_role_codeable_concept,
)

router = APIRouter(prefix="/api/care-team", tags=["care-team"])


# --- Request Models ---

class DutyStatusRequest(BaseModel):
    on_duty: bool


class AssignmentUpdateRequest(BaseModel):
    clinician_id: str
    level: int


class BulkHandoffRequest(BaseModel):
    patient_ids: list[str]
    to_clinician_id: str
    level: int = 1


class RrtUpdateRequest(BaseModel):
    clinician_ids: list[str]


# --- Care Team Manager ---

class CareTeamManager:
    """Manages care team assignments, clinician roster, and shift operations."""

    def __init__(self):
        self._clinicians: dict[str, Practitioner] = {}
        self._care_teams: dict[str, CareTeam] = {}  # patient_id -> CareTeam
        self._rrt_members: dict[str, list[str]] = {}  # patient_id -> clinician_ids
        self._initialize_roster()

    def _initialize_roster(self):
        """Pre-populate 24 clinicians for demo (4 original + 20 additional)."""
        clinicians_data = [
            # Original 4
            ("clinician-001", "Sarah", "Johnson", "primary-nurse", "Primary Nurse"),
            ("clinician-002", "Mike", "Chen", "charge-nurse", "Charge Nurse"),
            ("clinician-003", "Emily", "Rodriguez", "attending-physician", "Attending Physician"),
            ("clinician-004", "Alex", "Thompson", "rapid-response-team", "RRT Member"),
            # Additional 20 clinicians
            ("clinician-005", "Jessica", "Williams", "primary-nurse", "Primary Nurse"),
            ("clinician-006", "Daniel", "Martinez", "primary-nurse", "Primary Nurse"),
            ("clinician-007", "Rachel", "Lee", "primary-nurse", "Primary Nurse"),
            ("clinician-008", "Kevin", "Patel", "primary-nurse", "Primary Nurse"),
            ("clinician-009", "Amanda", "Taylor", "primary-nurse", "Primary Nurse"),
            ("clinician-010", "Brian", "Anderson", "charge-nurse", "Charge Nurse"),
            ("clinician-011", "Nicole", "Thomas", "charge-nurse", "Charge Nurse"),
            ("clinician-012", "Marcus", "Jackson", "charge-nurse", "Charge Nurse"),
            ("clinician-013", "Stephanie", "White", "charge-nurse", "Charge Nurse"),
            ("clinician-014", "Christopher", "Harris", "charge-nurse", "Charge Nurse"),
            ("clinician-015", "Lauren", "Clark", "attending-physician", "Attending Physician"),
            ("clinician-016", "David", "Lewis", "attending-physician", "Attending Physician"),
            ("clinician-017", "Michelle", "Walker", "attending-physician", "Attending Physician"),
            ("clinician-018", "James", "Hall", "attending-physician", "Attending Physician"),
            ("clinician-019", "Samantha", "Allen", "attending-physician", "Attending Physician"),
            ("clinician-020", "Robert", "Young", "rapid-response-team", "RRT Member"),
            ("clinician-021", "Megan", "King", "rapid-response-team", "RRT Member"),
            ("clinician-022", "Andrew", "Wright", "rapid-response-team", "RRT Member"),
            ("clinician-023", "Olivia", "Scott", "rapid-response-team", "RRT Member"),
            ("clinician-024", "Tyler", "Green", "rapid-response-team", "RRT Member"),
        ]

        for cid, given, family, role_code, role_display in clinicians_data:
            self._clinicians[cid] = Practitioner(
                id=cid,
                identifier=[Identifier(system="http://example.org/clinicians", value=cid)],
                name=[HumanName(family=family, given=[given], text=f"{given} {family}")],
                qualification=[
                    Qualification(
                        code=CodeableConcept(
                            coding=[{"system": "http://example.org/escalation-roles", "code": role_code, "display": role_display}],
                            text=role_display,
                        )
                    )
                ],
                active=True,
            )

    def initialize_default_assignments(self, patient_ids: list[str]):
        """Create default care team assignments for all patients."""
        for patient_id in patient_ids:
            self._create_default_care_team(patient_id)

    def _create_default_care_team(self, patient_id: str) -> CareTeam:
        """Create a default care team with all 4 clinicians."""
        care_team = CareTeam(
            id=str(uuid.uuid4()),
            identifier=[Identifier(system="http://example.org/care-teams", value=f"ct-{patient_id}")],
            status=CareTeamStatus.ACTIVE,
            category=[CodeableConcept(
                coding=[{"system": "http://example.org/team-types", "code": "escalation-team", "display": "Escalation Team"}],
                text="Escalation Team",
            )],
            name=f"Care Team - Patient {patient_id}",
            subject=Reference(reference=f"Patient/{patient_id}", display=f"Patient {patient_id}"),
            participant=[
                CareTeamParticipant(
                    role=[make_role_codeable_concept(1)],
                    member=Reference(reference="Practitioner/clinician-001", display="Sarah Johnson"),
                ),
                CareTeamParticipant(
                    role=[make_role_codeable_concept(2)],
                    member=Reference(reference="Practitioner/clinician-002", display="Mike Chen"),
                ),
                CareTeamParticipant(
                    role=[make_role_codeable_concept(3)],
                    member=Reference(reference="Practitioner/clinician-003", display="Emily Rodriguez"),
                ),
                CareTeamParticipant(
                    role=[make_role_codeable_concept(4)],
                    member=Reference(reference="Practitioner/clinician-004", display="Alex Thompson"),
                ),
            ],
        )
        self._care_teams[patient_id] = care_team
        # Default RRT: clinician-002, clinician-003, clinician-004
        self._rrt_members[patient_id] = ["clinician-002", "clinician-003", "clinician-004"]
        return care_team

    # --- Clinician Roster ---

    def get_all_clinicians(self) -> list[Practitioner]:
        """Return all clinicians in the roster."""
        return list(self._clinicians.values())

    def get_clinician(self, clinician_id: str) -> Practitioner | None:
        """Get a specific clinician by ID."""
        return self._clinicians.get(clinician_id)

    def set_duty_status(self, clinician_id: str, on_duty: bool) -> Practitioner | None:
        """Toggle a clinician's on-duty status."""
        clinician = self._clinicians.get(clinician_id)
        if clinician:
            clinician.active = on_duty
        return clinician

    # --- Care Team Assignments ---

    def get_care_team(self, patient_id: str) -> CareTeam | None:
        """Get the care team for a specific patient."""
        return self._care_teams.get(patient_id)

    def get_all_care_teams(self) -> list[CareTeam]:
        """Return all care team assignments."""
        return list(self._care_teams.values())

    def assign_clinician(self, patient_id: str, clinician_id: str, level: int) -> CareTeam | None:
        """Assign a clinician to a specific level for a patient."""
        care_team = self._care_teams.get(patient_id)
        clinician = self._clinicians.get(clinician_id)
        if not care_team or not clinician:
            return None

        # Update or add participant at this level
        role = make_role_codeable_concept(level)
        member_ref = Reference(reference=f"Practitioner/{clinician_id}", display=clinician.display_name)

        # Remove existing participant at this level
        care_team.participant = [p for p in care_team.participant if p.level != level]

        # Add new participant
        care_team.participant.append(
            CareTeamParticipant(role=[role], member=member_ref)
        )

        # Sort by level
        care_team.participant.sort(key=lambda p: p.level)
        return care_team

    def reassign_patient(self, patient_id: str, from_clinician_id: str, to_clinician_id: str) -> CareTeam | None:
        """Reassign a patient from one clinician to another (same level)."""
        care_team = self._care_teams.get(patient_id)
        to_clinician = self._clinicians.get(to_clinician_id)
        if not care_team or not to_clinician:
            return None

        for participant in care_team.participant:
            member_id = participant.member.reference.split("/")[-1] if "/" in participant.member.reference else ""
            if member_id == from_clinician_id:
                participant.member = Reference(
                    reference=f"Practitioner/{to_clinician_id}",
                    display=to_clinician.display_name,
                )
                break

        return care_team

    # --- Bulk Operations ---

    def bulk_handoff(self, patient_ids: list[str], to_clinician_id: str, level: int) -> list[CareTeam]:
        """Reassign multiple patients to a clinician at a specific level."""
        updated = []
        for patient_id in patient_ids:
            result = self.assign_clinician(patient_id, to_clinician_id, level)
            if result:
                updated.append(result)
        return updated

    def generate_handoff_summary(
        self,
        patient_ids: list[str],
        from_clinician_id: str,
        active_alerts: list = None,
        pending_escalations: list = None,
        recent_acks: list = None,
    ) -> HandoffSummary:
        """Generate a shift handoff summary."""
        return HandoffSummary(
            patient_ids=patient_ids,
            active_alerts=[a.model_dump() if hasattr(a, "model_dump") else a for a in (active_alerts or [])],
            pending_escalations=[e.model_dump() if hasattr(e, "model_dump") else e for e in (pending_escalations or [])],
            patients_requiring_attention=[pid for pid in patient_ids if active_alerts],
            recent_acknowledgments=[a.model_dump() if hasattr(a, "model_dump") else a for a in (recent_acks or [])],
            generated_at=datetime.now(timezone.utc),
            from_clinician_id=from_clinician_id,
        )

    # --- Escalation Routing ---

    def get_clinician_for_level(self, patient_id: str, level: int) -> Practitioner | None:
        """Get the clinician assigned at a specific level for a patient."""
        care_team = self._care_teams.get(patient_id)
        if not care_team:
            return None

        participant = care_team.get_participant_at_level(level)
        if not participant:
            return None

        # Extract clinician ID from reference
        member_ref = participant.member.reference
        clinician_id = member_ref.split("/")[-1] if "/" in member_ref else member_ref
        return self._clinicians.get(clinician_id)

    def get_next_available_level(
        self, patient_id: str, current_level: int, max_level: int
    ) -> tuple[int, Practitioner] | None:
        """Find the next available (on-duty) clinician starting from current_level."""
        for level in range(current_level, max_level + 1):
            if level == 4:
                # RRT — check if any member is on duty
                rrt = self.get_rrt_members(patient_id)
                on_duty_rrt = [c for c in rrt if c.active]
                if on_duty_rrt:
                    return (level, on_duty_rrt[0])
            else:
                clinician = self.get_clinician_for_level(patient_id, level)
                if clinician and clinician.active:
                    return (level, clinician)
        return None

    # --- RRT Management ---

    def get_rrt_members(self, patient_id: str) -> list[Practitioner]:
        """Get RRT members for a patient."""
        member_ids = self._rrt_members.get(patient_id, [])
        return [self._clinicians[cid] for cid in member_ids if cid in self._clinicians]

    def set_rrt_members(self, patient_id: str, clinician_ids: list[str]) -> list[Practitioner]:
        """Set RRT members for a patient (any subset of roster)."""
        valid_ids = [cid for cid in clinician_ids if cid in self._clinicians]
        self._rrt_members[patient_id] = valid_ids
        return [self._clinicians[cid] for cid in valid_ids]

    # --- Escalation Configuration ---

    def get_patient_ids(self) -> list[str]:
        """Return all patient IDs with care team assignments."""
        return list(self._care_teams.keys())


# --- REST Endpoints ---

# Instance will be set by main.py
_care_team_manager: CareTeamManager | None = None


def set_manager(manager: CareTeamManager):
    global _care_team_manager
    _care_team_manager = manager


def get_manager() -> CareTeamManager:
    if _care_team_manager is None:
        raise RuntimeError("CareTeamManager not initialized")
    return _care_team_manager


@router.get("/clinicians")
def list_clinicians():
    """List all clinicians with duty status."""
    manager = get_manager()
    return [c.model_dump() for c in manager.get_all_clinicians()]


@router.put("/clinicians/{clinician_id}/status")
def update_duty_status(clinician_id: str, request: DutyStatusRequest):
    """Toggle clinician on-duty/off-duty status."""
    manager = get_manager()
    clinician = manager.set_duty_status(clinician_id, request.on_duty)
    if not clinician:
        raise HTTPException(status_code=404, detail="Clinician not found")
    return clinician.model_dump()


@router.get("/assignments")
def list_assignments():
    """List all patient care team assignments."""
    manager = get_manager()
    return [ct.model_dump() for ct in manager.get_all_care_teams()]


@router.get("/assignments/{patient_id}")
def get_assignment(patient_id: str):
    """Get care team for a specific patient."""
    manager = get_manager()
    care_team = manager.get_care_team(patient_id)
    if not care_team:
        raise HTTPException(status_code=404, detail="Care team not found")
    return care_team.model_dump()


@router.put("/assignments/{patient_id}")
def update_assignment(patient_id: str, request: AssignmentUpdateRequest):
    """Update care team assignment for a patient."""
    manager = get_manager()
    care_team = manager.assign_clinician(patient_id, request.clinician_id, request.level)
    if not care_team:
        raise HTTPException(status_code=404, detail="Patient or clinician not found")
    return care_team.model_dump()


@router.post("/handoff")
def bulk_handoff(request: BulkHandoffRequest):
    """Bulk handoff patients to a clinician."""
    manager = get_manager()
    updated = manager.bulk_handoff(request.patient_ids, request.to_clinician_id, request.level)
    if not updated:
        raise HTTPException(status_code=400, detail="No patients updated")
    return {"updated_count": len(updated), "patient_ids": request.patient_ids}


@router.get("/rrt/{patient_id}")
def get_rrt_members(patient_id: str):
    """Get RRT members for a patient."""
    manager = get_manager()
    members = manager.get_rrt_members(patient_id)
    return [m.model_dump() for m in members]


@router.put("/rrt/{patient_id}")
def update_rrt_members(patient_id: str, request: RrtUpdateRequest):
    """Set RRT members for a patient."""
    manager = get_manager()
    members = manager.set_rrt_members(patient_id, request.clinician_ids)
    return [m.model_dump() for m in members]
