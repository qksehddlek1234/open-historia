/*! Open Historia — draggable-window hook. */
import { useCallback, useRef, useState } from "react";

// Makes any floating panel movable by its header, like the original game's
// windows. Usage:
//
//   const drag = useDragWindow();                        // plain panels
//   const drag = useDragWindow("translate(-50%, -50%)"); // centered panels
//
//   <div style={{ ...panelStyle, transform: drag.transform }}>
//     <div onPointerDown={drag.onPointerDown} style={{ cursor: "grab", ... }}>
//       ...header...
//     </div>
//   </div>
//
// The drag offset COMPOSES with the panel's own base transform, so a panel
// anchored with translate(-50%,-50%) keeps its anchor and simply shifts from
// it. Drags starting on interactive elements (buttons, inputs) are ignored so
// a header's close button still just clicks. The offset resets when the
// component unmounts — reopened windows come back at their home position.
export const useDragWindow = (baseTransform = "") => {
    const [pos, setPos] = useState({ x: 0, y: 0 });
    const posRef = useRef({ x: 0, y: 0 });

    const onPointerDown = useCallback((event) => {
        if (event.button !== 0) return;
        if (event.target.closest("button, input, textarea, select, a, [data-no-drag]")) return;
        event.preventDefault();
        const start = {
            x: event.clientX - posRef.current.x,
            y: event.clientY - posRef.current.y,
        };
        const onMove = (moveEvent) => {
            const next = { x: moveEvent.clientX - start.x, y: moveEvent.clientY - start.y };
            posRef.current = next;
            setPos(next);
        };
        const onUp = () => {
            window.removeEventListener("pointermove", onMove);
            window.removeEventListener("pointerup", onUp);
        };
        window.addEventListener("pointermove", onMove);
        window.addEventListener("pointerup", onUp);
    }, []);

    const offset = `translate(${pos.x}px, ${pos.y}px)`;
    return {
        onPointerDown,
        transform: baseTransform ? `${baseTransform} ${offset}` : offset,
        dragging: pos.x !== 0 || pos.y !== 0,
    };
};

export default useDragWindow;
