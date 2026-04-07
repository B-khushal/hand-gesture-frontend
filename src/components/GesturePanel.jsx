/**
 * GesturePanel
 * Large prominent display of current detected gesture with action label.
 */

import React, { useEffect, useRef } from 'react'
import styles from './GesturePanel.module.css'

const GESTURE_COLORS = {
  fist:       '#ff4d6d',
  one:        '#40c8ff',
  peace:      '#00ff88',
  three:      '#ffc940',
  four:       '#b988ff',
  open_palm:  '#00ff88',
  thumbs_up:  '#00ff88',
  thumbs_down:'#ff4d6d',
  ok:         '#40c8ff',
  none:       '#3d5e46',
}

export default function GesturePanel({ result }) {
  const gesture = result?.gesture || 'none'
  const emoji   = result?.emoji   || '—'
  const action  = result?.action  || 'No hand detected'
  const fingers = result?.finger_count ?? '—'
  const conf    = result?.confidence != null ? `${(result.confidence * 100).toFixed(0)}%` : '—'
  const color   = GESTURE_COLORS[gesture] || GESTURE_COLORS.none

  const prevGesture = useRef(gesture)
  const emojiRef    = useRef(null)

  // Animate emoji on gesture change
  useEffect(() => {
    if (gesture !== prevGesture.current && emojiRef.current) {
      emojiRef.current.classList.remove(styles.pop)
      void emojiRef.current.offsetWidth
      emojiRef.current.classList.add(styles.pop)
      prevGesture.current = gesture
    }
  }, [gesture])

  return (
    <div className={styles.panel}>
      <div className={styles.panelHeader}>
        <span className={styles.panelTitle}>DETECTED GESTURE</span>
      </div>

      {/* Main display */}
      <div className={styles.main} style={{ '--g-color': color }}>
        <div className={styles.emojiWrap} ref={emojiRef}>
          <span className={styles.emoji}>{emoji}</span>
        </div>

        <div className={styles.name} style={{ color }}>
          {gesture.replace('_', ' ').toUpperCase()}
        </div>

        <div className={styles.action}>{action}</div>
      </div>

      {/* Metrics row */}
      <div className={styles.metrics}>
        <div className={styles.metric}>
          <span className={styles.metricLabel}>FINGERS</span>
          <span className={styles.metricValue}>{fingers}</span>
        </div>
        <div className={styles.metricDivider} />
        <div className={styles.metric}>
          <span className={styles.metricLabel}>CONFIDENCE</span>
          <span className={styles.metricValue} style={{ color: result?.confidence > 0.6 ? 'var(--accent)' : 'var(--warn)' }}>
            {conf}
          </span>
        </div>
      </div>

      {/* Confidence bar */}
      <div className={styles.confBarBg}>
        <div
          className={styles.confBar}
          style={{
            width: `${(result?.confidence || 0) * 100}%`,
            background: color,
          }}
        />
      </div>
    </div>
  )
}
