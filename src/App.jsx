import React, { useState } from 'react'
import { useGestureSocket } from './hooks/useGestureSocket'
import VideoFeed from './components/VideoFeed'
import GesturePanel from './components/GesturePanel'
import ControlBar from './components/ControlBar'
import StatsBar from './components/StatsBar'
import GestureGuide from './components/GestureGuide'
import styles from './styles/App.module.css'

export default function App() {
  const [showMask, setShowMask] = useState(false)
  const [showGuide, setShowGuide] = useState(false)

  const {
    videoRef, canvasRef,
    connected, streaming,
    gestureResult, annotatedFrame, skinMask,
    frameCount, fps, error, backendInfo,
    connecting, reconnectCount,
    startStream, stopStream, calibrate
  } = useGestureSocket()

  return (
    <div className={styles.root}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.logo}>
          <span className={styles.logoAccent}>▶</span> GESTURE<span className={styles.logoOs}>OS</span>
        </div>
        <div className={styles.headerMeta}>
          <span className={`${styles.dot} ${connected ? styles.dotLive : styles.dotOff}`} />
          <span className={styles.statusText}>
            {connected ? (streaming ? 'STREAMING' : 'CONNECTED') : 'DISCONNECTED'}
          </span>
        </div>
        <nav className={styles.nav}>
          <button
            className={`${styles.navBtn} ${showGuide ? styles.navBtnActive : ''}`}
            onClick={() => setShowGuide(g => !g)}
          >
            [GUIDE]
          </button>
          <button
            className={`${styles.navBtn} ${showMask ? styles.navBtnActive : ''}`}
            onClick={() => setShowMask(m => !m)}
          >
            [SKIN MASK]
          </button>
        </nav>
      </header>

      {/* Main layout */}
      <main className={styles.main}>
        {/* Left: video feeds */}
        <section className={styles.feedSection}>
          <VideoFeed
            videoRef={videoRef}
            canvasRef={canvasRef}
            annotatedFrame={annotatedFrame}
            skinMask={showMask ? skinMask : null}
            streaming={streaming}
            gestureResult={gestureResult}
            calibrate={calibrate}
          />
          <ControlBar
            streaming={streaming}
            connected={connected}
            connecting={connecting}
            onStart={startStream}
            onStop={stopStream}
          />
          {connecting && !connected && (
            <div className={styles.infoBanner}>
              Attempting backend connection{reconnectCount > 0 ? ` (retry ${reconnectCount})` : ''}...
            </div>
          )}
          {error && (
            <div className={styles.errorBanner}>⚠ {error}</div>
          )}
          {!error && backendInfo.runtimeWarning && (
            <div className={styles.warnBanner}>⚠ {backendInfo.runtimeWarning}</div>
          )}
        </section>

        {/* Right: gesture + stats */}
        <aside className={styles.sidePanel}>
          <GesturePanel result={gestureResult} />
          <StatsBar
            connected={connected}
            streaming={streaming}
            fps={fps}
            frameCount={frameCount}
            backendInfo={backendInfo}
          />
        </aside>
      </main>

      {/* Gesture reference guide overlay */}
      {showGuide && <GestureGuide onClose={() => setShowGuide(false)} />}
    </div>
  )
}
