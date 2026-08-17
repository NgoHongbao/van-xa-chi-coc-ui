import { PARTY_CAPACITY } from '../constants.js';

export const cloneData = (value) => JSON.parse(JSON.stringify(value));

export function sortAssignments(assignments = []) {
  return [...assignments].sort((a, b) => Number(a.position || 1) - Number(b.position || 1));
}

export function assignmentAt(party, position) {
  return (party?.members || []).find((assignment) => Number(assignment.position) === Number(position));
}

export function firstEmptyPosition(party) {
  const occupied = new Set((party?.members || []).map((assignment) => Number(assignment.position)));
  for (let position = 1; position <= PARTY_CAPACITY; position += 1) {
    if (!occupied.has(position)) return position;
  }
  return null;
}

export function findAssignmentLocation(snapshot, memberId) {
  for (const legion of snapshot.legions || []) {
    for (const party of legion.parties || []) {
      const assignment = (party.members || []).find((item) => item.memberId === memberId);
      if (assignment) return { legion, party, assignment };
    }
  }
  return null;
}

export function findPartyLocation(snapshot, partyId) {
  for (const legion of snapshot.legions || []) {
    const party = (legion.parties || []).find((item) => item.id === partyId);
    if (party) return { legion, party };
  }
  return null;
}

export function applyOptimisticAssign(snapshot, { memberId, targetPartyId, targetPosition, note = '', noteColor = 'purple' }) {
  const target = findPartyLocation(snapshot, targetPartyId);
  if (!target) return;
  target.party.members.push({
    memberId,
    partyId: target.party.id,
    position: Number(targetPosition),
    note,
    noteColor
  });
}

export function applyOptimisticMove(snapshot, { memberId, targetPartyId, targetPosition }) {
  const source = findAssignmentLocation(snapshot, memberId);
  const target = findPartyLocation(snapshot, targetPartyId);
  if (!source || !target) return;

  source.party.members = source.party.members.filter((item) => item.memberId !== memberId);
  source.assignment.partyId = target.party.id;
  source.assignment.position = Number(targetPosition);
  target.party.members.push(source.assignment);
}

export function applyOptimisticSwap(snapshot, { memberAId, memberBId }) {
  const a = findAssignmentLocation(snapshot, memberAId);
  const b = findAssignmentLocation(snapshot, memberBId);
  if (!a || !b) return;

  const aPlacement = { partyId: a.party.id, position: Number(a.assignment.position) };
  const bPlacement = { partyId: b.party.id, position: Number(b.assignment.position) };

  a.party.members = a.party.members.filter((item) => item.memberId !== memberAId);
  b.party.members = b.party.members.filter((item) => item.memberId !== memberBId);

  Object.assign(a.assignment, bPlacement);
  Object.assign(b.assignment, aPlacement);

  b.party.members.push(a.assignment);
  a.party.members.push(b.assignment);
}
