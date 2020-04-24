import socketIOClient from "socket.io-client";

import {createOffer} from "./CreateOffer"

const constraints = {
    audio: true,
    video: {
      facingMode: "user",
      width: { min: 620 },
      height: { min: 480 }
    }
  }

const SocketAdapter = ({url, setUser, usersRef, setMessages, setStreamObjs, broadcasterConnections, watcherConnections}) => {

  const socket = socketIOClient(url)

  let clientStream = null

  //we only want to call this if the user logs out.
  const closeBroadcasterConnection = (socketId) => {
    console.log("broadcaster connections before", broadcasterConnections);
    broadcasterConnections.current = broadcasterConnections.current.filter(connectionObj => {
      if (connectionObj.socketId !== socketId){
        return true
      } else {
        //i think this is okay to do in a filter. use the iterator to location the connection, close it, remove it from streams, and update the ref
        connectionObj.connection.close()
        return false
      }
    })
    console.log("broadcaster connections after", broadcasterConnections);
  }

  const closeWatcherConnection = (socketId) => {
    console.log(`Removing streams and socketIds matched with ${socketId}`);
    console.log("watcher connections and streams before", watcherConnections);
    watcherConnections.current = watcherConnections.current.filter(connectionObj => {
      if (connectionObj.socketId !== socketId){
        return true
      } else {
        //i think this is okay to do in a filter. use the iterator to location the connection, close it, remove it from streams, and update the ref
        connectionObj.connection.close()
        return false
      }
    })
    console.log("watcher connections and streams after", watcherConnections);
  }

  //add all listeners

  //before the user connects, a list of current users is sent to them
  socket.on("loggedInUsers", usersArray => usersRef.current = usersArray)

  socket.on("initializedSession", (userObj, messagesArray) => {
    setUser(userObj)
    setMessages(messagesArray)
    console.log(`Yay! You've initialized a session with the username ${userObj.username}!`);
  })

  //this runs when another user joins that isn't the client
  socket.on("newUserJoin", userObj => {
    usersRef.current = [ ...usersRef.current, userObj ]
    //only send an offer if there is a clientStream currently
    clientStream && createOffer({stream: clientStream, socketConnection: socket, watcherSocketId: userObj.socketId, broadcasterConnections, username: userObj.username})
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
        setStreamObjs(prevState => [...prevState, {socketId: socket.id, stream}])
        usersRef.current.filter(user => user.socketId).forEach(user => createOffer({username: user.username, stream, socketConnection: socket, watcherSocketId: user.socketId, broadcasterConnections}))
      })
    } else {
      alert("Max amount of videos broadcasted")
    }
  })
  socket.on("offer", (socketId, description) => {
    let newRemotePeerConnection = new RTCPeerConnection({iceServers: [{urls: ["stun:stun.1.google.com:19302"]}]})

    newRemotePeerConnection
      .setRemoteDescription(description)
      .then(() => newRemotePeerConnection.createAnswer())
      .then(sdp => newRemotePeerConnection.setLocalDescription(sdp))
      .then(() => socket.emit("answer", socketId, newRemotePeerConnection.localDescription))
      .then(() => console.log("Received offer! Sending back answer!" ))
    watcherConnections.current = [...watcherConnections.current, {socketId, connection: newRemotePeerConnection}]
    console.log("HERE ARE YOUR WATCHER CONNETIONS AND STREAMS", watcherConnections);
    newRemotePeerConnection.ontrack = event => {
      console.log(event.streams);
      //only add to streams array after the audio AND visual have been added
      //the first one is always audio, so if we check for video we know both are added
      event.track.kind === "video" && setStreamObjs(prevState => [...prevState, {socketId, stream: event.streams[0]}])
    }
  })

  socket.on("answer", (socketId, description) => {
    broadcasterConnections.current.find(connectionObj => connectionObj.socketId === socketId).connection.setRemoteDescription(description)
    console.log("Awesome! Your connection should be established! HERE ARE YOUR BROADCASTER CONNECTIONS", broadcasterConnections);
  })

  socket.on("candidate", (socketId, candidate) => {
    console.log("New candidate!!");
    watcherConnections.current.find(connectionObj => connectionObj.socketId === socketId).connection.addIceCandidate(new RTCIceCandidate(candidate))
  })

  socket.on("broadcastEnded", (socketId) => {
    console.log("About to remove watcher connection", watcherConnections.current);
    closeWatcherConnection(socketId)
    setStreamObjs(prevState => prevState.filter(streamObj => streamObj.socketId !== socketId))
    console.log("Removed watcher connection", watcherConnections.current);
  })

  //return socket object
  return socket
}

export default SocketAdapter
