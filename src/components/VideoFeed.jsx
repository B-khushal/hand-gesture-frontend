/**
 * VideoFeed
 * Shows webcam feed alongside annotated processed frame and optional skin mask.
 * Supports click-to-calibrate: user draws a rectangle on their skin.
 */

import React, { useRef, useState, useCallback } from 'react'
import styles from './VideoFeed.module.css'

export default function VideoFeed({
  videoRef, canvasRef,
  annotatedFrame, skinMask,
  streaming, gestureResult, calibrate
}) {
  const overlayRef = useRef(null)
  const [drawStart, setDrawStart] = useState(null)
  const [drawRect, setDrawRect] = useState(null)
  const [calMode, setCalMode] = useState(false)
  const [calDone, setCalDone] = useState(false)

  const handleMouseDown = useCallback((e) => {
    if (!calMode) return
    const rect = overlayRef.current.getBoundingClientRect()
    setDrawStart({ x: e.clientX - rect.left, y: e.clientY - rect.top })
    setDrawRect(null)
  }, [calMode])

  const handleMouseMove = useCallback((e) => {
    if (!calMode || !drawStart) return
    const rect = overlayRef.current.getBoundingClientRect()
    const cur = { x: e.clientX - rect.left, y: e.clientY - rect.top }
    setDrawRect({
      x: Math.min(drawStart.x, cur.x),
      y: Math.min(drawStart.y, cur.y),
      w: Math.abs(cur.x - drawStart.x),
      h: Math.abs(cur.y - drawStart.y)
    })
  }, [calMode, drawStart])

  const handleMouseUp = useCallback(() => {
    const overlay = overlayRef.current
    const video = videoRef.current

    if (!calMode || !drawRect || drawRect.w < 10 || drawRect.h < 10 || !overlay || !video) {
      return
    }

    const sourceWidth = video.videoWidth || 640
    const sourceHeight = video.videoHeight || 480
    const scaleX = sourceWidth / overlay.offsetWidth
    const scaleY = sourceHeight / overlay.offsetHeight

    calibrate({
      x: Math.round(drawRect.x * scaleX),
      y: Math.round(drawRect.y * scaleY),
      w: Math.round(drawRect.w * scaleX),
      h: Math.round(drawRect.h * scaleY)
    })

    setDrawStart(null)
    setDrawRect(null)
    setCalMode(false)
    setCalDone(true)
    setTimeout(() => setCalDone(false), 2500)
  }, [calMode, drawRect, calibrate, videoRef])

  const gesture = gestureResult?.stable_gesture || gestureResult?.gesture || 'none'

  return (
    <div className={styles.wrapper}>
      <div className={styles.feedRow}>
        <div className={styles.feedCard}>
          <div className={styles.feedLabel}>
            <span className={styles.labelDot} />
            {streaming ? 'LIVE FEED' : 'STANDBY'}
          </div>

          <div
            className={`${styles.feedBox} ${calMode ? styles.calActive : ''}`}
            ref={overlayRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
          >
            <video
              ref={videoRef}
              className={`${styles.video} ${annotatedFrame ? styles.hidden : ''}`}
              muted
              playsInline
            />

            {annotatedFrame && (
              <img
                src={annotatedFrame}
                alt="Annotated"
                className={styles.annotated}
              />
            )}

            {drawRect && (
              <div
                className={styles.calRect}
                style={{
                  left: drawRect.x, top: drawRect.y,
                  width: drawRect.w, height: drawRect.h
                }}
              />
            )}

            {streaming && gestureResult && gesture !== 'none' && (
              <div className={styles.gestureBadge}>
                <span className={styles.gestureEmoji}>{gestureResult.emoji}</span>
                <span className={styles.gestureName}>{gesture.toUpperCase()}</span>
              </div>
            )}

            {!streaming && (
              <div className={styles.placeholder}>
                <div className={styles.placeholderIcon}>🖐</div>
                <div className={styles.placeholderText}>CAMERA INACTIVE</div>
              </div>
            )}

            {calDone && (
              <div className={styles.calToast}>✓ SKIN MODEL CALIBRATED</div>
            )}
          </div>

          {streaming && (
            <button
              className={`${styles.calBtn} ${calMode ? styles.calBtnActive : ''}`}
              onClick={() => {
                setCalMode((mode) => !mode)
                setDrawStart(null)
                setDrawRect(null)
              }}
            >
              {calMode ? '✕ CANCEL CALIBRATION' : '◎ CALIBRATE SKIN COLOR'}
            </button>
          )}
          {calMode && (
            <p className={styles.calHint}>Draw a rectangle over your palm or forearm</p>
          )}
        </div>

        {skinMask && (
          <div className={styles.feedCard}>
            <div className={styles.feedLabel}>
              <span className={`${styles.labelDot} ${styles.labelDotSkin}`} />
              SKIN MASK
            </div>
            <div className={styles.feedBox}>
              <img src={skinMask} alt="Skin mask" className={styles.annotated} />
            </div>
          </div>
        )}
      </div>

      <canvas ref={canvasRef} className={styles.hiddenCanvas} />
    </div>
  )
}
