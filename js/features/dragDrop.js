import { PARTY_CAPACITY } from '../constants.js';

let formationMutationPending = false;
import {
  cloneData,
  applyOptimisticAssign,
  applyOptimisticMove,
  applyOptimisticSwap,
  findAssignmentLocation,
  findPartyLocation
} from '../state/formation.js';

function clearDropState(root) {
  root.querySelectorAll('.dragging, .drop-target, .drop-target-swap, .drop-target-move, .drop-target-invalid').forEach((element) => {
    element.classList.remove('dragging', 'drop-target', 'drop-target-swap', 'drop-target-move', 'drop-target-invalid');
  });
  root.classList.remove('is-dragging-member');
}

function getDropTarget(eventTarget) {
  return eventTarget.closest('[data-drop-slot]');
}

function describeTarget(target) {
  if (!target) return null;
  return {
    memberId: target.dataset.memberId || null,
    partyId: target.dataset.partyId,
    position: Number(target.dataset.position)
  };
}

function validateFrontendMove(snapshot, memberId, targetPartyId) {
  const source = findAssignmentLocation(snapshot, memberId);
  const target = findPartyLocation(snapshot, targetPartyId);
  if (!target) throw new Error('Không tìm thấy PT đích.');
  if (source && source.party.id !== target.party.id && target.party.members.length >= PARTY_CAPACITY) {
    throw new Error(`PT đã đủ ${PARTY_CAPACITY} thành viên.`);
  }
  if (!source && target.party.members.length >= PARTY_CAPACITY) {
    throw new Error(`PT đã đủ ${PARTY_CAPACITY} thành viên.`);
  }
  return { source, target };
}

export function bindDragDrop({ root, getSnapshot, setSnapshot, render, api, toast }) {
  let draggedMemberId = null;

  root.querySelectorAll('.member-slot[draggable="true"], .member-pool-item[draggable="true"]').forEach((slot) => {
    slot.addEventListener('dragstart', (event) => {
      if (formationMutationPending) {
        event.preventDefault();
        return;
      }
      draggedMemberId = slot.dataset.memberId;
      slot.classList.add('dragging');
      root.classList.add('is-dragging-member');
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', draggedMemberId);
    });

    slot.addEventListener('dragend', () => {
      draggedMemberId = null;
      clearDropState(root);
    });
  });

  root.querySelectorAll('[data-drop-slot]').forEach((target) => {
    target.addEventListener('dragover', (event) => {
      const activeMemberId = draggedMemberId || event.dataTransfer.getData('text/plain');
      if (!activeMemberId || target.dataset.memberId === activeMemberId) return;

      const source = findAssignmentLocation(getSnapshot(), activeMemberId);
      const occupied = Boolean(target.dataset.memberId);
      event.preventDefault();
      target.classList.add('drop-target');

      if (!source && occupied) {
        event.dataTransfer.dropEffect = 'none';
        target.classList.add('drop-target-invalid');
        target.classList.remove('drop-target-swap', 'drop-target-move');
        return;
      }

      event.dataTransfer.dropEffect = 'move';
      target.classList.toggle('drop-target-swap', occupied);
      target.classList.toggle('drop-target-move', !occupied);
      target.classList.remove('drop-target-invalid');
    });

    target.addEventListener('dragleave', (event) => {
      if (target.contains(event.relatedTarget)) return;
      target.classList.remove('drop-target', 'drop-target-swap', 'drop-target-move', 'drop-target-invalid');
    });

    target.addEventListener('drop', async (event) => {
      event.preventDefault();
      const sourceMemberId = draggedMemberId || event.dataTransfer.getData('text/plain');
      const targetData = describeTarget(getDropTarget(event.target));
      if (!sourceMemberId || !targetData || targetData.memberId === sourceMemberId) {
        clearDropState(root);
        return;
      }

      if (formationMutationPending) {
        clearDropState(root);
        return;
      }

      const before = cloneData(getSnapshot());
      const source = findAssignmentLocation(getSnapshot(), sourceMemberId);
      formationMutationPending = true;
      root.classList.add('formation-saving');
      try {
        if (!source && targetData.memberId) {
          throw new Error('Thành viên chưa có PT chỉ có thể thả vào vị trí trống.');
        }

        if (targetData.memberId) {
          const payload = { memberAId: sourceMemberId, memberBId: targetData.memberId };
          applyOptimisticSwap(getSnapshot(), payload);
          render();
          await api.swapPartyMembers(payload);
          toast('Đã hoán đổi vị trí 2 thành viên.');
        } else if (!source) {
          validateFrontendMove(getSnapshot(), sourceMemberId, targetData.partyId);
          const payload = {
            memberId: sourceMemberId,
            partyId: targetData.partyId,
            targetPosition: targetData.position,
            note: '',
            noteColor: 'purple',
            forceMove: false
          };
          applyOptimisticAssign(getSnapshot(), {
            memberId: sourceMemberId,
            targetPartyId: targetData.partyId,
            targetPosition: targetData.position
          });
          render();
          await api.assignMember(payload);
          toast('Đã kéo thành viên vào PT.');
        } else {
          validateFrontendMove(getSnapshot(), sourceMemberId, targetData.partyId);
          const payload = {
            memberId: sourceMemberId,
            targetPartyId: targetData.partyId,
            targetPosition: targetData.position
          };
          applyOptimisticMove(getSnapshot(), payload);
          render();
          await api.movePartyMember(payload);
          toast('Đã chuyển thành viên sang vị trí mới.');
        }

        // The optimistic snapshot already represents the successful backend write.
        // Do not immediately GET snapshot + render the entire page again. With a
        // real API that second round-trip caused the member pool / viewport to jump.
        // The next explicit refresh/page load will reconcile from the server.
      } catch (error) {
        setSnapshot(before);
        render();
        toast(error.message || 'Không thể cập nhật đội hình. UI đã được hoàn tác.', 'error');
      } finally {
        formationMutationPending = false;
        root.classList.remove('formation-saving');
        clearDropState(root);
      }
    });
  });
}
