import React, {useState, useEffect, useRef} from 'react'

import VideoStream from "./VideoStream"

import {useDispatch, useSelector} from "react-redux"

import cameraIcon from "../media/video.png"

const ChatRoom = ({broadcasterConnections}) => {

  const dispatch = useDispatch()
  const socket = useSelector(state => state.socket)
  const user = useSelector(state => state.user)
  const users = useSelector(state => state.users)
  const messages = useSelector(state => state.messages)
  const streams = useSelector(state => state.streams)
  const clientStream = useSelector(state => state.streams).find(stream => stream.socketId === socket.id)

  const [message, changeMessage] = useState("")
  const [clicked, toggleClicked] = useState(false)

  const messagesContainerRef = useRef()

  useEffect(() => {
    //scroll to the bottom of the chat whenever a new message comes in
    //smooth only works on chrome right now
   messagesContainerRef.current.scrollTo({top: messagesContainerRef.current.scrollHeight, behavior: "smooth"})
 }, [messages]);

  const handleSend = (e) => {
    //sends message to server, once it's processed the client will see it too
    e.preventDefault()
    socket.emit("sentMessage", message)
    changeMessage("")
  }

  const toggleBroadcast = () =>  {
    //when the video call button is clicked twice rapidly, this prevents two streams from beginning and keeps the icon color in sync
    if (clicked && clientStream){
      endBroadcast()
      toggleClicked(false)
    } else if (clicked && !clientStream) {
      return null
    } else {
      toggleClicked(true)
      socket.emit("requestBroadcast")
    }
  }

  const endBroadcast = () => {
    //if we had kept the broadcaster connections in the reducer, we could've used useSelector to grab them here
    //see lines 17-20 in App.js for reason why we used a ref instead of redux
    //console.log("Closing connections");
    //console.log(broadcasterConnections);
    broadcasterConnections.current.forEach(connectionObj => connectionObj.connection.close())
    broadcasterConnections.current = []
    dispatch({type: "removeStream", payload: socket.id})
    socket.emit("endBroadcast")
  }

  const renderStream = (pos) => {
    //console.log(streams);
    let stream = streams.find(obj => obj.pos === pos)
    if (stream){
      console.log(stream, pos);
      //find the streamer
      let streamer = [...users, user].find(user => user.socketId === stream.socketId)
      //if the streamer is the client, then mute them
      let isClient = streamer.socketId === user.socketId
      return <VideoStream key={pos} streamObj={stream} streamer={streamer} isClient={isClient}/>
    } else {
      return null
    }
  }

  const renderMessages = () => {
    return messages.map((message, idx )=> {
      return (<div className="ma2 br2" key={message.message + `${idx}`}> {message.username}: {message.message}</div>)
    })
  }

  return(
    <div id="chatroom-container" className="h-100 w-100 helvetica">
      <div id="chatroom" className="h-100 w-100 flex pa4">
        <div id="column-1" className="flex-column w-third">
          <div id="square1" className="w-100 h-50 mt3 ">
            {renderStream(1)}
          </div>
          <div id="square2" className="w-100 h-50 mb3 mb6">
            {renderStream(4)}
          </div>
        </div>
        <div id="column-2" className="w-third h-100 flex flex-column-reverse pb4">
          <form id="message-input-field" onSubmit={handleSend}className="flex items-center justify-around h-10">
            <img
              src={cameraIcon}
              alt="toggle camera"
              className={`w-auto pt2 h2 pointer${clicked ? " o-40" : ""}`}
              onClick={toggleBroadcast}
            />
            <input
              onChange={(e) => changeMessage(e.target.value)}
              value={message}
              placeholder="say something..."
              className="dib bg-washed-yellow w-60 h2 f4"
              spellCheck="false"
            />
            <input
              type="submit"
              value="send"
              className="dib w3 h2 br-pill white bg-dark-gray bg-animate hover-bg-mid-gray pointer tc f5"
            />
          </form>
          <div id="messages-container" ref={messagesContainerRef} className="mb3 pl4 pr4 flex h-auto flex-column-reverse overflow-y-scroll tl">
            {renderMessages().reverse()}
          </div>
          </div>
        <div id="column-3" className="flex-column w-third">
          <div id="square3" className="w-100 h-50 mt3 ">
            {renderStream(3)}
          </div>
          <div id="square4" className="w-100 h-50 mb3 mb6">
            {renderStream(2)}
          </div>
        </div>
      </div>
      <div id="usernames-container" className="bg-washed-yellow mt5 tl f3">
        {users.length ? users.map(user => <p className="dib ma1" key={user.username}>{user.username}</p>) : `no one's here but you, ${user.username}`}
      </div>
    </div>
  )
}

export default ChatRoom
