/**
 * BlackjackModal - Waiting mode modal with a WebGL-rendered blackjack game.
 * Game state persists when modal is closed and reopened.
 * Cards are rendered and animated on a WebGL canvas.
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { X } from 'lucide-react';
import { createInitialState, deal, hit, stand, getHandTotal } from '../services/blackjackGame';
import { CardRenderer } from '../services/cardRenderer';

// Persistent game state across modal open/close
let persistedGameState = createInitialState();

function computeCardPositions(gameState, canvasWidth) {
  const cards = [];
  const cardW = 90;
  const gap = 16;
  const isPlaying = gameState.status === 'playing';

  // Dealer hand (top)
  const dealerHand = gameState.dealerHand || [];
  const dealerStartX = (canvasWidth - dealerHand.length * (cardW + gap)) / 2;
  dealerHand.forEach((card, i) => {
    cards.push({
      card,
      faceDown: isPlaying && i === 1,
      x: dealerStartX + i * (cardW + gap),
      y: 20,
      dealAnim: undefined,
    });
  });

  // Player hand (bottom)
  const playerHand = gameState.playerHand || [];
  const playerStartX = (canvasWidth - playerHand.length * (cardW + gap)) / 2;
  playerHand.forEach((card, i) => {
    cards.push({
      card,
      faceDown: false,
      x: playerStartX + i * (cardW + gap),
      y: 180,
      dealAnim: undefined,
    });
  });

  return cards;
}

export default function BlackjackModal({ open, onClose }) {
  const [, forceRender] = useState(0);
  const rerender = useCallback(() => forceRender((n) => n + 1), []);

  const canvasRef = useRef(null);
  const overlayRef = useRef(null);
  const rendererRef = useRef(null);
  const animFrameRef = useRef(null);

  const state = persistedGameState;
  const isPlaying = state.status === 'playing';
  const gameOver = ['bust', 'win', 'lose', 'push', 'blackjack'].includes(state.status);

  // Initialize/update WebGL renderer when modal opens or game state changes
  useEffect(() => {
    if (!open) return;

    // Wait for next frame to ensure canvas is in the DOM
    const frameId = requestAnimationFrame(() => {
      if (!canvasRef.current) return;

      if (!rendererRef.current || rendererRef.current.failed) {
        rendererRef.current = new CardRenderer(canvasRef.current);
      }

      const renderer = rendererRef.current;
      if (renderer.failed) return;

      const positions = computeCardPositions(state, canvasRef.current.width);
      renderer.setCards(positions);
      renderer.start();

      // Text overlay loop
      const drawOverlay = () => {
        const ctx = overlayRef.current?.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, overlayRef.current.width, overlayRef.current.height);
          renderer.drawTextOverlays(ctx);
        }
        animFrameRef.current = requestAnimationFrame(drawOverlay);
      };
      drawOverlay();
    });

    return () => {
      cancelAnimationFrame(frameId);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [open, state.playerHand.length, state.dealerHand.length, state.status]);

  // Stop renderer when modal closes
  useEffect(() => {
    if (!open && rendererRef.current) {
      rendererRef.current.stop();
    }
  }, [open]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (rendererRef.current) {
        rendererRef.current.destroy();
        rendererRef.current = null;
      }
    };
  }, []);

  // Keyboard handler
  useEffect(() => {
    if (!open) return;
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  const handleDeal = () => {
    persistedGameState = deal(state);
    rerender();
  };

  const handleHit = () => {
    persistedGameState = hit(state);
    rerender();
  };

  const handleStand = () => {
    persistedGameState = stand(state);
    rerender();
  };

  const modalStyle = open ? {} : { display: 'none' };

  const playerTotal = state.playerHand.length > 0 ? getHandTotal(state.playerHand) : null;
  const dealerTotal = gameOver && state.dealerHand.length > 0 ? getHandTotal(state.dealerHand) : null;

  return (
    <div className="blackjack-overlay" role="dialog" aria-label="Waiting Mode - Blackjack" aria-modal="true" style={modalStyle}>
      <div className="blackjack-modal">
        <div className="blackjack-modal__header">
          <h2>🕷️ Spider-Jack: Waiting Mode</h2>
          <button onClick={onClose} className="blackjack-modal__close" aria-label="Close waiting mode">
            <X size={20} />
          </button>
        </div>

        <div className="blackjack-modal__body">
          <div className="blackjack-canvas-container">
            <canvas
              ref={canvasRef}
              width={540}
              height={340}
              className="blackjack-webgl-canvas"
            />
            <canvas
              ref={overlayRef}
              width={540}
              height={340}
              className="blackjack-overlay-canvas"
            />
          </div>

          <div className="blackjack-scores">
            {dealerTotal != null && <span>Dealer: {dealerTotal}</span>}
            {playerTotal != null && <span>You: {playerTotal}</span>}
          </div>

          {state.message && (
            <div className="blackjack-message">{state.message}</div>
          )}

          <div className="blackjack-controls">
            {state.status === 'idle' && (
              <button className="blackjack-btn blackjack-btn--deal" onClick={handleDeal}>Deal</button>
            )}
            {isPlaying && (
              <>
                <button className="blackjack-btn blackjack-btn--hit" onClick={handleHit}>Hit</button>
                <button className="blackjack-btn blackjack-btn--stand" onClick={handleStand}>Stand</button>
              </>
            )}
            {gameOver && (
              <button className="blackjack-btn blackjack-btn--deal" onClick={handleDeal}>New Hand</button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
