/**
 * GestureGuide
 * Reference overlay showing all supported gestures and their actions.
 */

import React from 'react'
import styles from './GestureGuide.module.css'

const GESTURES = [
  { emoji: '✊', name: 'FIST',        fingers: 0, action: 'Stop / Select',     color: '#ff4d6d' },
  { emoji: '☝️',  name: 'ONE',         fingers: 1, action: 'Point / Click',     color: '#40c8ff' },
  { emoji: '✌️',  name: 'PEACE',       fingers: 2, action: 'Scroll / Navigate', color: '#00ff88' },
  { emoji: '🤟', name: 'THREE',       fingers: 3, action: 'Volume +',           color: '#ffc940' },
  { emoji: '🖖', name: 'FOUR',        fingers: 4, action: 'Volume -',           color: '#b988ff' },
  { emoji: '🖐️',  name: 'OPEN PALM',  fingers: 5, action: 'Pause / Play',       color: '#00ff88' },
  { emoji: '👍', name: 'THUMBS UP',   fingers: '—', action: 'Confirm / Like',   color: '#00ff88' },
  { emoji: '👎', name: 'THUMBS DOWN', fingers: '—', action: 'Reject / Dislike', color: '#ff4d6d' },
  { emoji: '👌', name: 'OK',          fingers: '—', action: 'OK / Confirm',     color: '#40c8ff' },
]

export default function GestureGuide({ onClose }) {
  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <span className={styles.title}>GESTURE REFERENCE</span>
          <button className={styles.close} onClick={onClose}>✕</button>
        </div>

        <div className={styles.grid}>
          {GESTURES.map(g => (
            <div key={g.name} className={styles.card} style={{ '--c': g.color }}>
              <span className={styles.emoji}>{g.emoji}</span>
              <span className={styles.name} style={{ color: g.color }}>{g.name}</span>
              <span className={styles.fingers}>
                {typeof g.fingers === 'number' ? `${g.fingers} finger${g.fingers !== 1 ? 's' : ''}` : 'shape'}
              </span>
              <span className={styles.action}>{g.action}</span>
            </div>
          ))}
        </div>

        <p className={styles.tip}>
          💡 Use <strong>◎ CALIBRATE</strong> in the video feed to adapt the skin model to your lighting &amp; skin tone.
        </p>
      </div>
    </div>
  )
}
