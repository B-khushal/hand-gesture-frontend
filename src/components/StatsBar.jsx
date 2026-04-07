/**
 * StatsBar
 * Shows live session stats: FPS, frame count, connection status.
 */

import React from 'react'
import styles from './StatsBar.module.css'

export default function StatsBar({ connected, streaming, fps, frameCount, backendInfo }) {
  const detectorValue = backendInfo?.detector === 'mediapipe' ? 'MediaPipe Hands' : 'OpenCV Fallback'
  const detectorColor = backendInfo?.landmarkDetectionEnabled ? 'var(--accent)' : 'var(--danger)'

  const rows = [
    { label: 'STATUS',   value: connected ? (streaming ? 'ACTIVE' : 'IDLE') : 'OFFLINE',
      color: connected ? (streaming ? 'var(--accent)' : 'var(--warn)') : 'var(--danger)' },
    { label: 'PROC FPS', value: streaming ? fps : '—',
      color: fps >= 8 ? 'var(--accent)' : 'var(--warn)' },
    { label: 'FRAMES',   value: frameCount.toLocaleString() },
    { label: 'TRANSPORT',value: 'WebSocket' },
    { label: 'DETECTOR', value: detectorValue, color: detectorColor },
    { label: 'MODEL',    value: backendInfo?.landmarkDetectionEnabled ? '21-Point Hand Landmarks' : 'HSV+YCbCr Skin Mask' },
    { label: 'PYTHON',   value: backendInfo?.pythonVersion || 'unknown' },
  ]

  return (
    <div className={styles.panel}>
      <div className={styles.header}>SYSTEM INFO</div>
      <div className={styles.rows}>
        {rows.map(r => (
          <div key={r.label} className={styles.row}>
            <span className={styles.label}>{r.label}</span>
            <span className={styles.value} style={r.color ? { color: r.color } : {}}>
              {r.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
