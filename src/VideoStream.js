import React, {useRef, useEffect} from 'react'

function VideoStream({streamObj}) {
  const videoEl = useRef(null)

  useEffect(() => {
    console.log(streamObj);
      let video = videoEl.current
      video.srcObject = streamObj.stream
      video.play()
    }, [videoEl])

  return (<video id={`stream-${streamObj.websocketId}`}style={{backgroundColor: 'black'}} ref={videoEl} autoPlay={true} muted={"muted"}></video>)
}

export default VideoStream
