/**
 * @param {{ open: boolean, onStartTour: () => void, onLater: () => void, onNever: () => void }} props
 */
export function TourPromptModal({ open, onStartTour, onLater, onNever }) {
  if (!open) return null;

  return (
    <div className="wl-manage-overlay tour-prompt-overlay" role="presentation" onMouseDown={onLater}>
      <div
        className="wl-manage-modal tour-prompt-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="tour-prompt-title"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="wl-manage-modal__head">
          <h2 id="tour-prompt-title" className="wl-manage-modal__title">
            Strategy account created
          </h2>
        </div>
        <div className="wl-manage-modal__body">
          <p className="paper-modal-msg">
            Want a quick tour of rules, watchlist signals, and how to run your automation?
          </p>
        </div>
        <div className="wl-manage-modal__foot">
          <button type="button" className="wl-manage-btn wl-manage-btn--ghost" onClick={onNever}>
            Don&apos;t show again
          </button>
          <button type="button" className="wl-manage-btn wl-manage-btn--ghost" onClick={onLater}>
            Later
          </button>
          <button type="button" className="wl-manage-btn wl-manage-btn--primary" onClick={onStartTour}>
            Start tour
          </button>
        </div>
      </div>
    </div>
  );
}
