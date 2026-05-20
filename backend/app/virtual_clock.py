"""Virtual clock for escalation timers supporting real-time and demo modes."""

import asyncio
import uuid
from datetime import datetime, timezone
from typing import Callable, Optional


class CallbackHandle:
    """Reference to a scheduled callback for cancellation tracking."""

    def __init__(self, handle_id: str, asyncio_handle: Optional[asyncio.TimerHandle] = None):
        self.id = handle_id
        self._asyncio_handle = asyncio_handle
        self.cancelled = False

    def cancel(self):
        """Cancel this callback."""
        self.cancelled = True
        if self._asyncio_handle and not self._asyncio_handle.cancelled():
            self._asyncio_handle.cancel()


class VirtualClock:
    """Time abstraction for escalation timers.

    Supports real-time mode (scale=1.0) and demo mode (scale=30.0).
    In demo mode, a 300-second timeout fires after 10 real seconds.
    """

    def __init__(self):
        self._time_scale: float = 1.0
        self._handles: dict[str, CallbackHandle] = {}
        self._test_mode: bool = False
        self._test_callbacks: list[tuple[float, Callable, str]] = []

    def now(self) -> datetime:
        """Return current UTC time (always real system time)."""
        return datetime.now(timezone.utc)

    def call_later(self, delay_seconds: float, callback: Callable, *args) -> CallbackHandle:
        """Schedule a callback after delay_seconds (scaled by time_scale).

        Args:
            delay_seconds: Logical delay in seconds (before scaling).
            callback: Function to call when timer fires.
            *args: Arguments to pass to callback.

        Returns:
            CallbackHandle for cancellation.
        """
        handle_id = str(uuid.uuid4())
        scaled_delay = delay_seconds / self._time_scale

        if self._test_mode:
            # In test mode, store callbacks for manual advancement
            handle = CallbackHandle(handle_id=handle_id)
            self._test_callbacks.append((scaled_delay, lambda: callback(*args), handle_id))
            self._handles[handle_id] = handle
            return handle

        try:
            loop = asyncio.get_event_loop()
            asyncio_handle = loop.call_later(
                scaled_delay,
                lambda: asyncio.ensure_future(self._execute_callback(handle_id, callback, *args))
                if asyncio.iscoroutinefunction(callback)
                else self._execute_sync_callback(handle_id, callback, *args),
            )
            handle = CallbackHandle(handle_id=handle_id, asyncio_handle=asyncio_handle)
        except RuntimeError:
            # No running event loop (e.g., during testing without async)
            handle = CallbackHandle(handle_id=handle_id)

        self._handles[handle_id] = handle
        return handle

    async def _execute_callback(self, handle_id: str, callback: Callable, *args):
        """Execute an async callback if not cancelled."""
        handle = self._handles.get(handle_id)
        if handle and not handle.cancelled:
            await callback(*args)
            self._handles.pop(handle_id, None)

    def _execute_sync_callback(self, handle_id: str, callback: Callable, *args):
        """Execute a sync callback if not cancelled."""
        handle = self._handles.get(handle_id)
        if handle and not handle.cancelled:
            callback(*args)
            self._handles.pop(handle_id, None)

    def cancel(self, handle: CallbackHandle) -> None:
        """Cancel a scheduled callback."""
        if handle:
            handle.cancel()
            self._handles.pop(handle.id, None)

    def set_time_scale(self, scale: float) -> None:
        """Set the time scale factor.

        Args:
            scale: 1.0 for real-time, 30.0 for demo mode (30x speed).
        """
        if scale <= 0:
            raise ValueError("Time scale must be positive")
        self._time_scale = scale

    def get_time_scale(self) -> float:
        """Return current time scale factor."""
        return self._time_scale

    def is_demo_mode(self) -> bool:
        """Return True if time scale is greater than 1.0 (demo mode)."""
        return self._time_scale > 1.0

    def get_active_handles(self) -> list[str]:
        """Return IDs of all active (non-cancelled) callback handles."""
        return [h.id for h in self._handles.values() if not h.cancelled]

    # --- Testing Support ---

    def enable_test_mode(self) -> None:
        """Enable test mode — callbacks are stored but not scheduled on event loop."""
        self._test_mode = True
        self._test_callbacks = []

    def advance(self, seconds: float) -> list[Callable]:
        """Advance time by seconds and fire any callbacks that would have triggered.

        Only works in test mode. Returns list of callbacks that were fired.
        """
        if not self._test_mode:
            raise RuntimeError("advance() only works in test mode")

        fired = []
        remaining = []

        for delay, callback, handle_id in self._test_callbacks:
            handle = self._handles.get(handle_id)
            if handle and handle.cancelled:
                continue

            new_delay = delay - seconds
            if new_delay <= 0:
                # Fire this callback
                if handle and not handle.cancelled:
                    callback()
                    fired.append(callback)
                    self._handles.pop(handle_id, None)
            else:
                remaining.append((new_delay, callback, handle_id))

        self._test_callbacks = remaining
        return fired

    def reset(self) -> None:
        """Reset clock state — cancel all pending callbacks."""
        for handle in list(self._handles.values()):
            handle.cancel()
        self._handles.clear()
        self._test_callbacks.clear()
        self._time_scale = 1.0
