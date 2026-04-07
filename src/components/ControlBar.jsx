/**
 * ControlBar
 * Start / Stop streaming controls with connection state.
 */

import React from 'react'
import styles from './ControlBar.module.css'

export default function ControlBar({ streaming, connected, connecting, onStart, onStop }) {
  return (
    <div className={styles.bar}>
      <button
        className={`${styles.btn} ${styles.btnStart}`}
        onClick={onStart}
        disabled={streaming || !connected}
      >
        <span className={styles.icon}>▶</span>
        START RECOGNITION
      </button>

      <button
        className={`${styles.btn} ${styles.btnStop}`}
        onClick={onStop}
        disabled={!streaming}
      >
        <span className={styles.icon}>■</span>
        STOP
      </button>

      {!connected && (
        <span className={styles.hint}>
          {connecting
            ? 'Connecting to backend service...'
            : 'Backend unavailable. Check VITE_BACKEND_URL and backend health endpoint.'}
        </span>
      )}
    </div>
  )
}
