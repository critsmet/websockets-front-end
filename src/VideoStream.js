import React, {useRef, useEffect} from 'react'

function VideoStream({streamObj, username}) {
  const videoEl = useRef(null)

  useEffect(() => {
    console.log(streamObj);
      let video = videoEl.current
      video.srcObject = streamObj.stream
      video.play()
    }, [videoEl])

  return (
    <div id={`video-div-${streamObj.socketId}`} className="relative w-100 h-100 ">
      <div className="absolute top-1 tc w-100 white">{username}</div>
      <video
        className="h-75"
        id={`stream-${streamObj.socketId}`}
        ref={videoEl}
        autoPlay={true}
        muted={"muted"}
      />
    </div>
  )
}

export default VideoStream
