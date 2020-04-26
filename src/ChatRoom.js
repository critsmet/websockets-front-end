import React, {useState, useEffect, useRef} from 'react'

import VideoStream from "./VideoStream"

import cameraIcon from "./video.png"

const ChatRoom = ({user, usersRef, socketRef, messages, streamObjs, setStreamObjs, broadcasterConnectionsRef}) => {

  const [message, changeMessage] = useState("")

  const messagesContainerRef = useRef()

  // const colors = ["bg-washed-blue", "bg-washed-red", "bg-washed-green"]
  // let colorSelector = 0

  useEffect(() => {
   messagesContainerRef.current.scrollTo({top: messagesContainerRef.current.scrollHeight, behavior: "smooth"})
 }, [messages]);

  const handleSend = (e) => {
    e.preventDefault()
    socketRef.current.emit("sentMessage", message)
    changeMessage("")
  }

  const renderMessages = () => {
    return messages.map((message, idx )=> {
      // let color = colors[colorSelector]
      // colorSelector = colorSelector == 2 ? 0 : colorSelector + 1
      return (<div className="ma2 br2" key={message.message + `${idx}`}> {message.username}: {message.message}</div>)
    })
  }

  const checkForClientBroadcast = () => {
    return streamObjs.find(streamObj => streamObj.socketId === socketRef.current.id)
  }

  const toggleBroadcast = () => {
    checkForClientBroadcast() ? endBroadcast() : socketRef.current.emit("requestBroadcast")
  }

  const endBroadcast = () => {
    setStreamObjs(prevState => prevState.filter(streamObj => streamObj.socketId !== socketRef.current.id))
    broadcasterConnectionsRef.current.forEach(connectionObj => connectionObj.connection.close())
    broadcasterConnectionsRef.current = []
    socketRef.current.emit("endBroadcast")
  }

  const getUserWithSocketId = (id) => {
    console.log(usersRef.current, streamObjs, id);
    return [...usersRef.current, user].find(user => user.socketId === id)
  }

  const findStreamByPos = (pos) => streamObjs.find(obj => obj.pos === pos)


  return(
    <div id="chatroom-container" className="h-100 w-100">
      <div id="chatroom" className="h-100 w-100 flex pa4">
        <div id="column-1" className="flex-column w-third">
          <div id="square1" className="w-100 h-50 mt3 ">
            {findStreamByPos(1) && <VideoStream streamObj={findStreamByPos(1)} user={getUserWithSocketId(findStreamByPos(1).socketId)} loggedInUser={user}/>}
          </div>
          <div id="square2" className="w-100 h-50 mb3 mb6">
            {findStreamByPos(4) && <VideoStream streamObj={findStreamByPos(4)} user={getUserWithSocketId(findStreamByPos(4).socketId)} loggedInUser={user}/>}
          </div>
        </div>
        <div id="column-2" className="w-third h-100 flex flex-column-reverse pb4">
          <form id="message-input-field" onSubmit={handleSend}className="flex items-center justify-around h-10">
            <img
              src={cameraIcon}
              alt="toggle camera"
              className={`w-auto pt2 h2 pointer${checkForClientBroadcast() ? " o-40" : ""}`}
              onClick={() => toggleBroadcast()}
            />
            <input
              onChange={(e) => changeMessage(e.target.value)}
              value={message}
              placeholder="say something..."
              className="dib bg-washed-yellow w-60 h2 f4"
              spellCheck="false"
            />
            <input
              type="button"
              value="send"
              className="dib w3 h2 br-pill white bg-dark-gray bg-animate hover-bg-mid-gray pointer tc f5"
            />
          </form>
          <div id="messages-container" ref={messagesContainerRef} className="mb3 pl4 pr4 flex h-auto flex-column-reverse overflow-container tl">
            {renderMessages().reverse()}
          </div>
          </div>
        <div id="column-3" className="flex-column w-third">
          <div id="square3" className="w-100 h-50 mt3 ">
            {findStreamByPos(3) && <VideoStream streamObj={findStreamByPos(3)} user={getUserWithSocketId(findStreamByPos(3).socketId)}  loggedInUser={user}/>}
          </div>
          <div id="square4" className="w-100 h-50 mb3 mb6">
            {findStreamByPos(2) && <VideoStream streamObj={findStreamByPos(2)} user={getUserWithSocketId(findStreamByPos(2).socketId)} loggedInUser={user} />}
          </div>
        </div>
      </div>
      <div id="usernames-container" className="bg-washed-yellow mt5 tl f3">
        {usersRef.current.length ? usersRef.current.map(user => <p className="dib ma1" key={user.username}>{user.username}</p>) : `no one's here but you, ${user.username}`}
      </div>
    </div>
  )
}

export default ChatRoom
