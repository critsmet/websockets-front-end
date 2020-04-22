import React, {useRef, useEffect} from 'react'

export function VideoFeed() {
  const videoEl = useRef(null)

  useEffect(() => {
    if (!videoEl) {
      return
    }
    navigator.mediaDevices.getUserMedia({video:true})
      .then(stream => {
        let video = videoEl.current
        video.srcObject = stream
        video.play()
      })
  }, [videoEl])

  return <video ref={videoEl} />
}
