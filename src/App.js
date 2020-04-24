import React, { useEffect, useState, useRef }from "react"

import Signin from "./Signin"
import ChatRoom from "./ChatRoom"

import SocketAdapter from './SocketAdapter'

const IndexPage = () => {

  const [user, setUser] = useState(null)
  const [messages, setMessages] = useState([])

  //streams will be stored in state and passed down, wondering if this could be Ref too, but we want this to cause a re-render
  //still need to see if changed refValues passed as props cause re-renders
  const [streamObjs, setStreamObjs] = useState([])

  //we'll store our connections in Refs, and we'll store them based on who is broadcating and who is watching
  //if the client is not broadcasting, they will have no broadcaster connections, but will automatically have watcher connections for those broadcasting
  const broadcasterConnectionsRef = useRef([])
  const watcherConnectionsRef = useRef([])

  const usersRef = useRef([])

  const socketRef = useRef()

  const objToInitSocketAdapter = {
    url: "https://chatapp-back-end.herokuapp.com/",
    setUser,
    usersRef,
    setMessages,
    setStreamObjs,
    broadcasterConnectionsRef,
    watcherConnectionsRef
  }
  //need to look more into why useRef is the better option here, again
  //I think it's because the callback functions in useEffect don't have access tot he socket state object
  //because they are out of scope or are stored in a previous "version" of the component

  useEffect(() => {
    socketRef.current = SocketAdapter(objToInitSocketAdapter)
  }, [])

  return (
      <div style={{ textAlign: "center", width: "100vw", height: "100vh"}} className={"fl w-100 pa2"}>
        {user === null ?
          <Signin socketRef={socketRef} usersRef={usersRef}/> :
          <ChatRoom
            user={user}
            usersRef={usersRef}
            messages={messages}
            setMessages={setMessages}
            socketRef={socketRef}
            streamObjs={streamObjs}
            setStreamObjs={setStreamObjs}
            broadcasterConnectionsRef={broadcasterConnectionsRef}
            />
        }
      </div>
  );
}

export default IndexPage
