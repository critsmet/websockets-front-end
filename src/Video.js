import React, {useRef, useEffect} from 'react'

function Video({stream}) {
  const videoEl = useRef(null)

  useEffect(() => {
    console.log(stream);
      let video = videoEl.current
      video.srcObject = stream
      video.play()
    }, [videoEl])

  return (<video style={{backgroundColor: 'black'}} ref={videoEl} autoPlay={true} muted={"muted"}></video>)
}

export default Video
