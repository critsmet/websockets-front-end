import React, {useRef, useEffect} from 'react'

const VideoStream = ({streamObj, streamer, isClient}) => {

  const videoEl = useRef(null)

  useEffect(() => {
    //console.log(stream);
    let video = videoEl.current
    video.srcObject = streamObj.stream
    video.play()
  }, [videoEl])

  return (
    <div id={`video-div-${streamObj.socketId}`} className="relative w-100 h-100 ">
      <div className="absolute top-1 tc w-100 white">{streamer.username}</div>
      <video
        className="h-75"
        id={`stream-${streamObj.socketId}`}
        ref={videoEl}
        autoPlay={true}
        muted={isClient ? "muted" : null}
      />
    </div>
  )
}

export default VideoStream
