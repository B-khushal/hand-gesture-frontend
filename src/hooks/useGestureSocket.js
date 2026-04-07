/**
 * useGestureSocket
 * Manages the Socket.IO connection, paced frame streaming, and result handling.
 */

import { useEffect, useRef, useState, useCallback } from 'react'
import { io } from 'socket.io-client'

const BACKEND_URL = (import.meta.env.VITE_BACKEND_URL || window.location.origin).replace(/\/$/, '')
const FRAME_INTERVAL_MS = 110
const REQUEST_WIDTH = 1920
const REQUEST_HEIGHT = 1080
const JPEG_QUALITY = 0.82
const SOCKET_TIMEOUT_MS = 20000
const MAX_UPLOAD_WIDTH = 960

export function useGestureSocket() {
  const socketRef = useRef(null)
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const streamRef = useRef(null)
  const timeoutRef = useRef(null)
  const watchdogRef = useRef(null)
  const inFlightRef = useRef(false)
  const streamingRef = useRef(false)

  const [connected, setConnected] = useState(false)
  const [streaming, setStreaming] = useState(false)
  const [gestureResult, setGestureResult] = useState(null)
  const [annotatedFrame, setAnnotatedFrame] = useState(null)
  const [skinMask, setSkinMask] = useState(null)
  const [frameCount, setFrameCount] = useState(0)
  const [fps, setFps] = useState(0)
  const [processingMs, setProcessingMs] = useState(0)
  const [error, setError] = useState(null)
  const [connecting, setConnecting] = useState(true)
  const [reconnectCount, setReconnectCount] = useState(0)
  const [backendInfo, setBackendInfo] = useState({
    detector: 'unknown',
    landmarkDetectionEnabled: false,
    runtimeWarning: '',
    pythonVersion: '',
    socketTransport: 'Socket.IO'
  })
  const [debugCounters, setDebugCounters] = useState({
    clientFramesEmitted: 0,
    serverResultsReceived: 0,
    serverFrameCount: 0,
    lastEmitTs: null,
    lastResultTs: null
  })

  const fpsRef = useRef({ last: Date.now(), count: 0 })

  const refreshBackendInfo = useCallback(async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/health`)
      if (!response.ok) return
      const data = await response.json()
      setBackendInfo({
        detector: data.detector || 'unknown',
        landmarkDetectionEnabled: Boolean(data.landmark_detection_enabled),
        runtimeWarning: data.runtime_warning || '',
        pythonVersion: data.python_version || '',
        socketTransport: socket.io.engine?.transport?.name || 'Socket.IO'
      })
    } catch {
      // Ignore transient health fetch failures and keep the last known backend state.
    }
  }, [])

  const clearTimers = useCallback(() => {
    clearTimeout(timeoutRef.current)
    clearTimeout(watchdogRef.current)
    timeoutRef.current = null
    watchdogRef.current = null
  }, [])

  const scheduleNextFrame = useCallback((delay = FRAME_INTERVAL_MS) => {
    clearTimeout(timeoutRef.current)
    if (!streamingRef.current) return
    timeoutRef.current = setTimeout(() => {
      captureAndSend()
    }, delay)
  }, [])

  const captureAndSend = useCallback(() => {
    const video = videoRef.current
    const canvas = canvasRef.current
    const socket = socketRef.current

    if (!streamingRef.current || inFlightRef.current) return
    if (!socket?.connected || !video || !canvas) return
    if (video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
      scheduleNextFrame(100)
      return
    }

    try {
      const sourceWidth = video.videoWidth || 0
      const sourceHeight = video.videoHeight || 0
      if (sourceWidth < 2 || sourceHeight < 2) {
        scheduleNextFrame(120)
        return
      }

      const width = Math.max(320, Math.min(sourceWidth, MAX_UPLOAD_WIDTH))
      const height = Math.max(180, Math.round((sourceHeight * width) / sourceWidth))
      const ctx = canvas.getContext('2d', { willReadFrequently: false })
      if (!ctx) {
        scheduleNextFrame(120)
        return
      }

      canvas.width = width
      canvas.height = height
      ctx.drawImage(video, 0, 0, width, height)

      inFlightRef.current = true
      const emitTs = Date.now()
      socket.emit('frame', {
        frame: canvas.toDataURL('image/jpeg', JPEG_QUALITY),
        client_ts: emitTs
      })
      setDebugCounters((prev) => ({
        ...prev,
        clientFramesEmitted: prev.clientFramesEmitted + 1,
        lastEmitTs: emitTs
      }))

      clearTimeout(watchdogRef.current)
      watchdogRef.current = setTimeout(() => {
        inFlightRef.current = false
        scheduleNextFrame(120)
      }, 1200)
    } catch {
      inFlightRef.current = false
      scheduleNextFrame(150)
    }
  }, [scheduleNextFrame])

  useEffect(() => {
    const socket = io(BACKEND_URL, {
      path: '/socket.io',
      transports: ['websocket', 'polling'],
      upgrade: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 8000,
      randomizationFactor: 0.4,
      timeout: SOCKET_TIMEOUT_MS
    })
    socketRef.current = socket
    setConnecting(true)

    socket.on('connect', () => {
      setConnected(true)
      setConnecting(false)
      setReconnectCount(0)
      setError(null)
      setBackendInfo((prev) => ({
        ...prev,
        socketTransport: socket.io.engine?.transport?.name || prev.socketTransport || 'Socket.IO'
      }))
      refreshBackendInfo()
    })

    socket.on('disconnect', (reason) => {
      setConnected(false)
      setConnecting(true)
      inFlightRef.current = false
      setError(`Socket disconnected: ${reason}`)
      stopStream()
    })

    socket.on('connect_error', (err) => {
      setConnected(false)
      setConnecting(true)
      const message = err?.message || 'Unable to connect to backend'
      setError(`Connection error: ${message}`)
    })

    socket.io.on('reconnect_attempt', (attempt) => {
      setReconnectCount(attempt)
      setConnecting(true)
    })

    socket.io.on('reconnect_failed', () => {
      setError('Unable to reconnect to backend. Check deployment health and CORS settings.')
    })

    socket.on('error', (payload) => {
      inFlightRef.current = false
      setError(payload?.message || 'Unknown backend error')
      scheduleNextFrame(150)
    })

    socket.on('result', (data) => {
      inFlightRef.current = false
      clearTimeout(watchdogRef.current)
      setGestureResult(data.gesture)
      setAnnotatedFrame(data.annotated_frame)
      setSkinMask(data.skin_mask)
      setFrameCount(data.frame_count)
      setProcessingMs(data.processing_ms || 0)
      const resultTs = Date.now()
      setDebugCounters((prev) => ({
        ...prev,
        serverResultsReceived: prev.serverResultsReceived + 1,
        serverFrameCount: Number.isFinite(data.frame_count) ? data.frame_count : prev.serverFrameCount,
        lastResultTs: resultTs
      }))

      const now = Date.now()
      fpsRef.current.count += 1
      if (now - fpsRef.current.last >= 1000) {
        setFps(fpsRef.current.count)
        fpsRef.current = { last: now, count: 0 }
      }

      scheduleNextFrame(FRAME_INTERVAL_MS)
    })

    socket.on('calibrated', () => {
      setError(null)
    })

    refreshBackendInfo()

    return () => {
      clearTimers()
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
        streamRef.current = null
      }
      socket.disconnect()
    }
  }, [clearTimers, refreshBackendInfo, scheduleNextFrame])

  const startStream = useCallback(async () => {
    try {
      if (streamingRef.current) return
      if (!navigator.mediaDevices?.getUserMedia) {
        setError('This browser does not support webcam access.')
        return
      }

      clearTimers()
      setGestureResult(null)
      setAnnotatedFrame(null)
      setSkinMask(null)
      setDebugCounters({
        clientFramesEmitted: 0,
        serverResultsReceived: 0,
        serverFrameCount: 0,
        lastEmitTs: null,
        lastResultTs: null
      })

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: REQUEST_WIDTH },
          height: { ideal: REQUEST_HEIGHT },
          frameRate: { ideal: 24, max: 30 }
        },
        audio: false
      })

      streamRef.current = stream

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }

      streamingRef.current = true
      inFlightRef.current = false
      setStreaming(true)
      setError(null)
      scheduleNextFrame(250)
    } catch (err) {
      const message = err?.name === 'NotAllowedError'
        ? 'Camera permission was denied.'
        : `Camera error: ${err.message}`
      setError(message)
    }
  }, [clearTimers, scheduleNextFrame])

  const stopStream = useCallback(() => {
    clearTimers()
    streamingRef.current = false
    inFlightRef.current = false

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }

    if (videoRef.current) {
      videoRef.current.pause()
      videoRef.current.srcObject = null
    }

    setStreaming(false)
    setAnnotatedFrame(null)
    setSkinMask(null)
  }, [clearTimers])

  const calibrate = useCallback((region) => {
    const canvas = canvasRef.current
    const socket = socketRef.current
    if (!canvas || !socket?.connected) return

    socket.emit('calibrate', {
      frame: canvas.toDataURL('image/jpeg', 0.85),
      region
    })
  }, [])

  return {
    videoRef,
    canvasRef,
    connected,
    streaming,
    gestureResult,
    annotatedFrame,
    skinMask,
    frameCount,
    fps,
    processingMs,
    debugCounters,
    backendInfo,
    error,
    connecting,
    reconnectCount,
    startStream,
    stopStream,
    calibrate
  }
}
