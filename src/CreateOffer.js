//all WebRTC peer connection code here:

const createOffer = ({stream, socketConnection, watcherSocketId, broadcasterConnections, username}) => {
  const newLocalPeerConnection = new RTCPeerConnection({iceServers: [{urls: ["stun:stun.1.google.com:19302"]}]})
  for (const track of stream.getTracks()){
    newLocalPeerConnection.addTrack(track, stream)
  }

  newLocalPeerConnection.onicecandidate = event => {
    console.log("ASKING FOR A CANDIDATE HERE!");
    if (event.candidate) {
      socketConnection.emit("candidate", watcherSocketId, event.candidate);
    }
  };
  newLocalPeerConnection
    .createOffer()
    .then(sdp => newLocalPeerConnection.setLocalDescription(sdp))
    .then(() => socketConnection.emit("offer", watcherSocketId, newLocalPeerConnection.localDescription))
    .then(() => console.log(`Sent the offer! Your broadcast is being establish to ${username}!`))

  broadcasterConnections.current =  [...broadcasterConnections.current, {socketId: watcherSocketId, connection: newLocalPeerConnection}]
}

export { createOffer }
