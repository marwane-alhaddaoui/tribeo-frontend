import { useEffect } from "react";

/**
 * Active le scroll horizontal "à la main" (drag) + wheel vertical -> horizontal.
 * - empêche le clic après un drag (pour éviter de changer de sport par erreur)
 * - supporte souris/trackpad/touch (pointer events)
 */
export default function useHorizontalDrag(ref) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // 1) Wheel vertical => horizontal (utile souris/trackpad)
    const onWheel = (e) => {
      // si le conteneur peut scroller horizontalement, convertit deltaY
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        el.scrollLeft += e.deltaY;
        e.preventDefault();
      }
    };
    el.addEventListener("wheel", onWheel, { passive: false });

    // 2) Drag pointer (souris + tactile)
    let isDown = false;
    let startX = 0;
    let startLeft = 0;
    let dragged = false;
    let ptrId = null;

    const onPointerDown = (e) => {
      isDown = true;
      dragged = false;
      ptrId = e.pointerId;
      startX = e.clientX;
      startLeft = el.scrollLeft;
      el.classList.add("is-dragging");
      el.setPointerCapture?.(ptrId);
    };

    const onPointerMove = (e) => {
      if (!isDown) return;
      const dx = e.clientX - startX;
      if (Math.abs(dx) > 3) dragged = true;     // seuil anti-clic
      el.scrollLeft = startLeft - dx;
      e.preventDefault();
    };

    const onPointerUp = () => {
      isDown = false;
      el.classList.remove("is-dragging");
      if (ptrId != null) el.releasePointerCapture?.(ptrId);
      ptrId = null;
    };

    // 3) Empêche le "click" quand on a glissé
    const onClickCapture = (e) => {
      if (dragged) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    el.addEventListener("pointerdown", onPointerDown, { passive: true });
    window.addEventListener("pointermove", onPointerMove, { passive: false });
    window.addEventListener("pointerup", onPointerUp, { passive: true });
    el.addEventListener("click", onClickCapture, true);

    return () => {
      el.removeEventListener("wheel", onWheel);
      el.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      el.removeEventListener("click", onClickCapture, true);
    };
  }, [ref]);
}
