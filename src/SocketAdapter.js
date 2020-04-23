import socketIOClient from "socket.io-client";

import {createOffer} from "./CreateOffer"

const SocketAdapter = ({url, setUser, setUsers, setMessages, setStreamObjs, broadcasterConnections, watcherConnections}) => {

  const socket = socketIOClient(url)

  let clientStream = null

  const setClientStream = (streamObj) => {
    clientStream = streamObj
  }

  //add all listeners

  socket.on("initializedSession", (userObj, usersArray, messagesArray) => {
    setUser(userObj)
    setUsers(usersArray)
    setMessages(messagesArray)
    console.log(`Yay! You've initialized a session with the username ${userObj.username}!`);
  })

  //this runs when another user joins that isn't the client
  socket.on("newUserJoin", userObj => {
    setUsers(prevState => [ ...prevState, userObj ])
    //only send an offer if there is a clientStream currently
    clientStream && createOffer({stream: clientStream, socketConnection: socket, watcherSocketId: userObj.socketId, broadcasterConnections, username: userObj.username})
    console.log(`${userObj.username} just joined!`)
  })

  //we could get away with just receiving the userId or socketId here, but for consistency we'll receive the userObj
  //this method runs when another user logs out
  //currently there is no "sign out" feature, we just expect users to close the window.
  socket.on("userLogout", userObj => {
    console.log(`${userObj.username} just logged out`);
    watcherConnections.current = watcherConnections.current.filter(connectionObj => {
      if (connectionObj.socketId !== userObj.socketId){
        return true
      } else {
        //i think this is okay to do in a filter. use the iterator to location the connection, close it, remove it from streams, and update the ref
        connectionObj.connection.close()
        setStreamObjs(prevState => prevState.filter(streamObj => streamObj.socketId !== userObj.socketId))
        return false
      }
    })
    setUsers(prevState => prevState.filter(user => user.name !== userObj.name))
  })

  socket.on("newMessage", messageObj => {
    //pessimistic rendering...maybe not the best idea? let's maybe clean this up later
    //in other words, all messages, even ones from the client, go through the server
    //however the speed doesn't seem to be too slow, so let's keep it for now?
    setMessages(prevMessages => [...prevMessages, messageObj])
    console.log("New message received:", messageObj);
  })

  //WebRTC socket communications:
  socket.on("offer", (socketId, description) => {
    let newRemotePeerConnection = new RTCPeerConnection({iceServers: [{urls: ["stun:stun.1.google.com:19302"]}]})

    newRemotePeerConnection
      .setRemoteDescription(description)
      .then(() => newRemotePeerConnection.createAnswer())
      .then(sdp => newRemotePeerConnection.setLocalDescription(sdp))
      .then(() => socket.emit("answer", socketId, newRemotePeerConnection.localDescription))
      .then(() => console.log("Received offer! Sending back answer!"))
    watcherConnections.current = [...watcherConnections.current, {socketId, connection: newRemotePeerConnection}]

    newRemotePeerConnection.ontrack = event => {
      //only add to streams array after the audio AND visual have been added
      //the first one is always audio, so if we check for video we know both are added
      event.track.kind === "video" && setStreamObjs(prevState => [...prevState, {socketId, stream: event.streams[0]}])
    }
  })

  socket.on("answer", (socketId, description) => {
    broadcasterConnections.current.find(connectionObj => connectionObj.socketId === socketId).connection.setRemoteDescription(description)
    console.log("Awesome! Your connection should be established!");
  })

  socket.on("candidate", (socketId, candidate) => {
    console.log("New candidate!!");
    watcherConnections.current.find(connectionObj => connectionObj.socketId === socketId).connection.addIceCandidate(new RTCIceCandidate(candidate))
  })

  //return socket object
  return {connection: socket, setClientStream }
}

export default SocketAdapter
