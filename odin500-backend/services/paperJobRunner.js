// Starts paper background jobs (snapshot hourly, pending orders every 30s).
// Pattern: services/snapshotRefresher.js

const { runPaperSnapshot } = require('../jobs/paperSnapshotJob');
const { checkPendingOrders } = require('../jobs/pendingOrderWatcher');

const ENABLE = process.env.ENABLE_PAPER_JOBS !== '0';
const SNAPSHOT_MS = Number(process.env.PAPER_SNAPSHOT_INTERVAL_MS || 3600000);
const PENDING_MS = Number(process.env.PAPER_PENDING_ORDER_MS || 30000);

let snapshotTimer = null;
let pendingTimer = null;
let snapshotRunning = false;
let pendingRunning = false;

async function runSnapshotOnce() {
  if (snapshotRunning) return;
  snapshotRunning = true;
  const started = Date.now();
  try {
    const info = await runPaperSnapshot();
    console.log(
      `[paper-snapshot] ok in ${Date.now() - started}ms (accounts=${info.count})`
    );
  } catch (err) {
    console.error('[paper-snapshot] failed:', err?.message || err);
  } finally {
    snapshotRunning = false;
  }
}

async function runPendingOnce() {
  if (pendingRunning) return;
  pendingRunning = true;
  try {
    const info = await checkPendingOrders();
    if (info.filled > 0) {
      console.log(`[paper-pending-watcher] filled ${info.filled} order(s)`);
    }
  } catch (err) {
    console.error('[paper-pending-watcher] failed:', err?.message || err);
  } finally {
    pendingRunning = false;
  }
}

function startPaperJobs() {
  if (!ENABLE) {
    console.log('[paper-jobs] disabled (ENABLE_PAPER_JOBS=0)');
    return;
  }

  const snapMs = Number.isFinite(SNAPSHOT_MS) && SNAPSHOT_MS > 0 ? SNAPSHOT_MS : 3600000;
  const pendMs = Number.isFinite(PENDING_MS) && PENDING_MS > 0 ? PENDING_MS : 30000;

  void runSnapshotOnce();
  snapshotTimer = setInterval(() => {
    void runSnapshotOnce();
  }, snapMs);
  if (typeof snapshotTimer?.unref === 'function') snapshotTimer.unref();

  void runPendingOnce();
  pendingTimer = setInterval(() => {
    void runPendingOnce();
  }, pendMs);
  if (typeof pendingTimer?.unref === 'function') pendingTimer.unref();

  console.log(`[paper-jobs] started (snapshot=${snapMs}ms, pending=${pendMs}ms)`);
}

module.exports = { startPaperJobs };
