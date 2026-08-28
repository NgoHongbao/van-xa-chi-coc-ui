import { PARTY_CAPACITY } from '../constants.js';

let formationMutationPending = false;
import {
  cloneData,
  applyOptimisticAssign,
  applyOptimisticMove,
  applyOptimisticRemove,
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
  let scrollFrame = null;
  let scrollSpeed = 0;
  const mainScroller = document.querySelector('.main-content');
  const previousController = root._formationDragController;
  previousController?.abort();
  const controller = new AbortController();
  root._formationDragController = controller;
  const listenerOptions = { signal: controller.signal };

  const stopAutoScroll = () => {
    scrollSpeed = 0;
    if (scrollFrame !== null) cancelAnimationFrame(scrollFrame);
    scrollFrame = null;
  };
  controller.signal.addEventListener('abort', stopAutoScroll, { once: true });

  const runAutoScroll = () => {
    if (!draggedMemberId || !scrollSpeed) {
      scrollFrame = null;
      return;
    }
    if (mainScroller && mainScroller.scrollHeight > mainScroller.clientHeight) {
      mainScroller.scrollTop += scrollSpeed;
    } else {
      window.scrollBy(0, scrollSpeed);
    }
    scrollFrame = requestAnimationFrame(runAutoScroll);
  };

  const updateAutoScroll = (event) => {
    if (!draggedMemberId) return;
    const rect = mainScroller?.getBoundingClientRect() || { top: 0, bottom: window.innerHeight };
    const edgeSize = Math.min(120, Math.max(70, (rect.bottom - rect.top) * 0.16));
    let nextSpeed = 0;
    if (event.clientY < rect.top + edgeSize) {
      nextSpeed = -Math.ceil(4 + 20 * (rect.top + edgeSize - event.clientY) / edgeSize);
    } else if (event.clientY > rect.bottom - edgeSize) {
      nextSpeed = Math.ceil(4 + 20 * (event.clientY - (rect.bottom - edgeSize)) / edgeSize);
    }
    scrollSpeed = Math.max(-24, Math.min(24, nextSpeed));
    if (scrollSpeed && scrollFrame === null) scrollFrame = requestAnimationFrame(runAutoScroll);
    if (!scrollSpeed) stopAutoScroll();
  };

  root.addEventListener('dragover', updateAutoScroll, listenerOptions);

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
    }, listenerOptions);

    slot.addEventListener('dragend', () => {
      draggedMemberId = null;
      stopAutoScroll();
      clearDropState(root);
    }, listenerOptions);
  });

  root.querySelectorAll('.member-slot[data-member-id]').forEach((slot) => {
    slot.addEventListener('dblclick', async (event) => {
      if (event.target.closest('button') || formationMutationPending) return;
      event.preventDefault();
      const memberId = slot.dataset.memberId;
      const before = cloneData(getSnapshot());
      formationMutationPending = true;
      root.classList.add('formation-saving');
      try {
        if (!applyOptimisticRemove(getSnapshot(), memberId)) return;
        render();
        await api.removeFromParty(memberId);
        toast('Đã gỡ thành viên khỏi PT và trả về danh sách thành viên.');
      } catch (error) {
        setSnapshot(before);
        render();
        toast(error.message || 'Không thể gỡ thành viên khỏi PT. UI đã được hoàn tác.', 'error');
      } finally {
        formationMutationPending = false;
        root.classList.remove('formation-saving');
      }
    }, listenerOptions);
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
      stopAutoScroll();
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
    }, listenerOptions);
  });
}
