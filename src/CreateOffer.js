//all WebRTC peer connection code here:

const createOffer = ({stream, socketConnection, watcherSocketId, broadcasterConnections, username}) => {
  const newLocalPeerConnection = new RTCPeerConnection({iceServers: [{urls: ["stun:stun.1.google.com:19302"]}]})

  broadcasterConnections.current =  [...broadcasterConnections.current, {socketId: watcherSocketId, connection: newLocalPeerConnection}]

  for (const track of stream.getTracks()){
    newLocalPeerConnection.addTrack(track, stream)
  }

  newLocalPeerConnection.onicecandidate = event => {
    console.log("Received event to send candidate to watcher");
    if (event.candidate) {
      socketConnection.emit("candidate", watcherSocketId, event.candidate);
    }
  };
  newLocalPeerConnection
    .createOffer()
    .then(sdp => newLocalPeerConnection.setLocalDescription(sdp))
    .then(() => socketConnection.emit("offer", watcherSocketId, newLocalPeerConnection.localDescription))
    .then(() => console.log(`Sent the offer! Your broadcast is being establish to ${username}!`))

}

export { createOffer }
