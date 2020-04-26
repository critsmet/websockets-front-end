import socketIOClient from "socket.io-client";

const constraints = {
    audio: true,
    video: {
      facingMode: "user",
      width: { min: 620 },
      height: { min: 480 }
    }
  }

const SocketAdapter = ({url, setUser, usersRef, setMessages, setStreamObjs, broadcasterConnectionsRef, watcherConnectionsRef}) => {

  const socket = socketIOClient(url)

  let clientStream = null

  let streamPos = 1

  let iceServersConfig = null

  const createOffer = (user) => {
    console.log("iceServerConfig Received?", !!iceServersConfig, typeof(iceServersConfig));

    const newLocalPeerConnection = new RTCPeerConnection({iceServers: iceServersConfig})

    broadcasterConnectionsRef.current =  [...broadcasterConnectionsRef.current, {socketId: user.socketId, connection: newLocalPeerConnection}]

    for (const track of clientStream.getTracks()){
      newLocalPeerConnection.addTrack(track, clientStream)
    }

    newLocalPeerConnection.onicecandidate = (event) => event.candidate && (socket.emit("candidate", user.socketId, "fromBroadcaster", event.candidate) && console.log("GOT SOME ICE CANDIDATES FOR YA"))

    newLocalPeerConnection
      .createOffer()
      .then(sdp => newLocalPeerConnection.setLocalDescription(sdp))
      .then(() => socket.emit("offer", user.socketId, newLocalPeerConnection.localDescription))
      .then(() => console.log(`Sent the offer! Your broadcast is being establish to ${user.username}!`))
  }

  //we only want to call this if the user logs out.
  const closeBroadcasterConnection = (socketId) => {
    console.log("broadcaster connections before", broadcasterConnectionsRef);
    broadcasterConnectionsRef.current = broadcasterConnectionsRef.current.filter(connectionObj => {
      if (connectionObj.socketId !== socketId){
        return true
      } else {
        //i think this is okay to do in a filter. use the iterator to location the connection, close it, remove it from streams, and update the ref
        connectionObj.connection.close()
        return false
      }
    })
    console.log("broadcaster connections after", broadcasterConnectionsRef);
  }

  const closeWatcherConnection = (socketId) => {
    console.log(`Removing streams and socketIds matched with ${socketId}`);
    console.log("watcher connections and streams before", watcherConnectionsRef);
    watcherConnectionsRef.current = watcherConnectionsRef.current.filter(connectionObj => {
      if (connectionObj.socketId !== socketId){
        return true
      } else {
        //i think this is okay to do in a filter. use the iterator to location the connection, close it, remove it from streams, and update the ref
        connectionObj.connection.close()
        return false
      }
    })
    console.log("watcher connections and streams after", watcherConnectionsRef);
  }

  //add all listeners

  socket.on("iceServers", iceServersArray => {
    iceServersConfig = iceServersArray
  })

  socket.on("initializedSession", (userObj, usersArray, messagesArray) => {
    console.log(userObj, usersArray, messagesArray);
    setUser(userObj)
    usersRef.current = usersArray
    setMessages(messagesArray)
    console.log(`Yay! You've initialized a session with the username ${userObj.username}!`);
  })

  //this runs when another user joins that isn't the client
  socket.on("newUserJoin", userObj => {
    usersRef.current = [ ...usersRef.current, userObj ]
    //only send an offer if there is a clientStream currently
    clientStream && createOffer(userObj)
    console.log(`${userObj.username} just joined!`)
  })

  //we could get away with just receiving the userId or socketId here, but for consistency we'll receive the userObj
  //this method runs when another user logs out
  //currently there is no "sign out" feature, we just expect users to close the window.
  socket.on("userLogout", userObj => {
    console.log(`${userObj.username} just logged out`);
    usersRef.current = usersRef.current.filter(user => user.username !== userObj.username)
    closeWatcherConnection(userObj.socketId)
    closeBroadcasterConnection(userObj.socketId)
    setStreamObjs(prevState => prevState.filter(streamObj => streamObj.socketId !== userObj.socketId))
  })

  socket.on("newMessage", messageObj => {
    //pessimistic rendering...maybe not the best idea? let's maybe clean this up later
    //in other words, all messages, even ones from the client, go through the server
    //however the speed doesn't seem to be too slow, so let's keep it for now?
    setMessages(prevMessages => [...prevMessages, messageObj])
    console.log("New message received:", messageObj);
  })

  //WebRTC socket communications:

  socket.on("broadcastRequestResponse", (message) => {
    console.log("getting message back...!");
    if (message.approved){

      navigator.mediaDevices.getUserMedia(constraints)
      .then(stream => {
        clientStream = stream
        console.log("getting stream", stream);
        setStreamObjs(prevState => [...prevState, {socketId: socket.id, stream, pos: streamPos}])
        streamPos = streamPos === 4 ? 1 : streamPos + 1
        console.log("stream position", streamPos);
        usersRef.current.filter(user => user.socketId).forEach(createOffer)
      })
    } else {
      alert("Max amount of videos broadcasted")
    }
  })
  socket.on("offer", (socketId, description) => {
    let newRemotePeerConnection = new RTCPeerConnection({iceServers: iceServersConfig})
    console.log("andd we have the ice servers here?" iceServerConfig);
    watcherConnectionsRef.current = [...watcherConnectionsRef.current, {socketId, connection: newRemotePeerConnection}]

    newRemotePeerConnection.onicecandidate = (event) => event.candidate && socket.emit("candidate", socketId, "fromWatcher", event.candidate)

    newRemotePeerConnection
      .setRemoteDescription(description)
      .then(() => newRemotePeerConnection.createAnswer())
      .then(sdp => newRemotePeerConnection.setLocalDescription(sdp))
      .then(() => socket.emit("answer", socketId, newRemotePeerConnection.localDescription))
      .then(() => console.log("Received offer! Sending back answer!" ))
    console.log("HERE ARE YOUR WATCHER CONNETIONS AND STREAMS", watcherConnectionsRef);
    newRemotePeerConnection.ontrack = event => {
      console.log(event.streams);
      //only add to streams array after the audio AND visual have been added
      //the first one is always audio, so if we check for video we know both are added
      console.log("Woweee adding a track!");
      if (event.track.kind === "video"){
        let pos = streamPos
        setStreamObjs(prevState => [...prevState, {socketId, stream: event.streams[0], pos: pos}])
        console.log("Stream pos", pos);
        streamPos = streamPos === 4 ? 1 : streamPos + 1
      }
    }
  })

  socket.on("answer", (socketId, description) => {
    broadcasterConnectionsRef.current.find(connectionObj => connectionObj.socketId === socketId).connection.setRemoteDescription(description)
    console.log("Awesome! Your connection should be established!");
  })

  socket.on("candidate", (socketId, sender, candidate) => {

    let ref = sender === "fromWatcher" ? broadcasterConnectionsRef : watcherConnectionsRef

    ref.current.find(connectionObj => connectionObj.socketId === socketId).connection.addIceCandidate(new RTCIceCandidate(candidate))
    .then(
                () => console.log("addIceCandidate success! Received candidate " + sender),
                error =>
                    console.error(
                        "failed to add ICE Candidate",
                        error.toString()
                    )
            );
  })

  socket.on("broadcastEnded", (socketId) => {
    console.log("About to remove watcher connection", watcherConnectionsRef.current);
    closeWatcherConnection(socketId)
    setStreamObjs(prevState => prevState.filter(streamObj => streamObj.socketId !== socketId))
    console.log("Removed watcher connection", watcherConnectionsRef.current);
  })

  //return socket object
  return socket
}

export default SocketAdapter
