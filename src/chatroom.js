import React, {useState} from 'react'

import VideoStream from "./VideoStream"

import {createOffer} from "./CreateOffer"

const constraints = {
    audio: true,
    video: {
      facingMode: "user",
      width: { min: 620 },
      height: { min: 480 }
    }
  }

const ChatRoom = ({user, users, socketRef, messages, streamObjs, setStreamObjs, broadcasterConnections}) => {

  const [message, changeMessage] = useState("")

  const loggedInUsers = () => users.filter(user => user.socketId !== null)

  const renderUsers = () => {
    return loggedInUsers().length ? `You are in the chatroom with: ${loggedInUsers().map(user => user.username).join(", ")}` : `No one is here but you, ${user.username}`
  }

  const handleSend = () => {
    socketRef.current.connection.emit("sentMessage", message)
    changeMessage("")
  }

  const renderMessages = () => {
    return messages.map(message => {
      return (<div>{message.username} wrote: {message.message}</div>)
    })
  }

  const startBroadcast = () => {

    console.log("Start the broadcast!");
    //because we want everyone logged in to see us, we are going to iterate over every user in the array and make offers for them.
    //only create offers for users that have a socketId, IE logged in

    navigator.mediaDevices.getUserMedia(constraints)
    .then(stream => {
      socketRef.current.setClientStream(stream)
      setStreamObjs(prevState => [...prevState, {socketId: socketRef.current.connection.id, stream}])
      users.filter(user => user.socketId).forEach(user => createOffer({username: user.username, stream, socketConnection: socketRef.current.connection, watcherSocketId: user.socketId, broadcasterConnections}))
    })
  }


  return(
    <div id="chatroom">
      {renderUsers()}
      <p onClick={() => startBroadcast(socketRef.current.id)}>CAMERA BUTTON</p>
      <div id="messages-container">
      </div>
      <div id="input-field">
        <input onChange={(e) => changeMessage(e.target.value)} value={message} placeholder="Say something..."/>
        <button onClick={() => handleSend()}>Send</button>
        {renderMessages()}
      </div>
      {streamObjs.map(streamObj => <VideoStream key={streamObj.websocketId} streamObj={streamObj}/>) }
    </div>
  )
}

export default ChatRoom
