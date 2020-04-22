import React, { useEffect, useState, useRef }from "react"

import socketIOClient from "socket.io-client";
import Login from "./login"
import ChatRoom from "./chatroom"
import Video from "./Video"

const IndexPage = () => {

  const [user, setUser] = useState(null)
  const [users, setUsers] = useState([])
  const [messages, setMessages] = useState([])
  //peer connection IDs are determined by the socketID of who started broadcasting
  //so the person's own broadcast is their peerConnection ID
  const broadcasterConnections = useRef([])
  const watcherConnections = useRef([])


  //need to look more into why useRef is the better option here, again
  //I think it's because the callback functions don't have access tot he socket state object
  //because they do not update correctly
  const socket = useRef(null)

  const [streams, setStreams] = useState([])
  //let's hold our peer connection in a ref as well, just in case

  useEffect(() => checkForLoggedInUser(), [])

  const checkForLoggedInUser = () => {
    const loginId = localStorage.getItem('websocketUserId')
    if(loginId){
      console.log(`Yup, a user with the ID of ${loginId} was already logged in`);
      loginUser(parseInt(loginId))
    } else {
      console.log("Nope, nothing in localStorage. Please log in.");
    }
  }

  const loginUser = (loginId) => {
    //doesn't reset localStorage if already set
    establishConnection()
    emitLogin(loginId)
  }

  const signupUser = (username) => {
    establishConnection()
    emitSignup(username)
  }

  //LET'S REFACTOR ALL OF THIS TO BE ITS OWN CLASS?
  const establishConnection = () => {
    socket.current = socketIOClient("http://localhost:4001")
    console.log("establishing connection!!");
    addListeners()
  }

  const emitSignup = (username) => {
    socket.current.emit("signup", username)
  }

  const emitLogin = (loginId) => {
    socket.current.emit("login", loginId)
  }

  const addListeners = () => {
    socket.current.on("successfulLogin", userObj => {
      //no need to set the localStorage here as that's where we derived the original ID from
      setUser(userObj)
      console.log(`Yay! ${userObj.username} has logged back in!`);
    })
    socket.current.on("successfulSignup", userObj => {
      //set user to local storage
      localStorage.setItem('websocketUserId', userObj.id)
      setUser(userObj)
      console.log(`Woo! ${userObj.username} has signed up!`)
    })
    socket.current.on("newUser", userObj => {
      setUsers(prevState => {
        return [ ...prevState, userObj ]
      })
      console.log(`${userObj.username} just signed up`)
    })
    socket.current.on("newLogin", userObj => {
      console.log(`${userObj.username} just logged in`);
      setUsers(prevState => {
        return prevState.map(user => user.id !== userObj.id ? user : {...user, socketId: userObj.socketId})
      })
    })
    //we could get away with just receiving the userId or socketId here, but for consistency we'll receive the userObj
    socket.current.on("userLogout", userObj => {
      console.log(`${userObj.username} just logged out`);
      watcherConnections.current = watcherConnections.current.filter(connectionObj => {
        if (connectionObj.socketId !== userObj.socketId){
          return true
        } else {
          connectionObj.connection.close()
          setStreams(prevState => prevState.filter(streamObjs => streamObjs.socketId !== userObj.socketId))
          return false
        }
      })
      setUsers(prevState => prevState.map(user => user.id !== userObj.id ? user : {...user, socketId: null}))
    })
    socket.current.on("allUsers", usersArray => {
      setUsers(usersArray)
      console.log("From server - here are all these users have already signed up:", usersArray)
    })
    socket.current.on("newMessage", messageObj => {
      //pessimistic rendering...maybe not the best idea? let's maybe clean this up later
      setMessages(prevMessages => [...prevMessages, messageObj])
      console.log("New message received:", messageObj);
    })
    socket.current.on("allMessages", messagesArray => {
      setMessages(messagesArray)
      console.log("From server - here are all the messages already logged:", messagesArray);
    })
    //WebRTC socket communications:
    socket.current.on("offer", (socketId, description) => {
      let newRemotePeerConnection = new RTCPeerConnection(config)

      newRemotePeerConnection
        .setRemoteDescription(description)
        .then(() => newRemotePeerConnection.createAnswer())
        .then(sdp => newRemotePeerConnection.setLocalDescription(sdp))
        .then(() => socket.current.emit("answer", socketId, newRemotePeerConnection.localDescription))
        .then(() => console.log("Should've sent the answer back!!!"))
      watcherConnections.current = [...watcherConnections.current, {socketId, connection: newRemotePeerConnection}]

      newRemotePeerConnection.onaddstream = event => {
        console.log("Should be putting in a new stream!!", event);
        setStreams(prevState => [...prevState, {socketId, stream: event.stream}])
      }
    })
    socket.current.on("answer", (socketId, description) => {
      console.log("DESCRIPTION BACK FROM THE ANSWERRRR:", description);
      broadcasterConnections.current.find(connectionObj => connectionObj.socketId === socketId).connection.setRemoteDescription(description)
      console.log("Awesome! Your connection should be established!");
    })

    socket.current.on("candidate", (socketId, candidate) => {
      console.log("WOWOWOWOW NEW CANDIDATE ADDED~!!");
      watcherConnections.current.find(connectionObj => connectionObj.socketId === socketId).connection.addIceCandidate(new RTCIceCandidate(candidate))
    })
  }

  //all WebRTC peer connection code here:

  const constraints = {
      audio: true,
      video: {
        facingMode: "user",
        width: { min: 620 },
        height: { min: 480 }
      }
    }

  const config = {iceServers: [{urls: ["stun:stun.1.google.com:19302"]}]}

  const createOffer = (stream, watcherSocketId) => {
    const newLocalPeerConnection = new RTCPeerConnection(config)
    newLocalPeerConnection.addStream(stream)

    newLocalPeerConnection.onicecandidate = event => {
      console.log("ASKING FOR A CANDIDATE HERE!", event.candidate);
      if (event.candidate) {
        socket.current.emit("candidate", watcherSocketId, event.candidate);
      }
    };

    newLocalPeerConnection
      .createOffer()
      .then(sdp => newLocalPeerConnection.setLocalDescription(sdp))
      .then(() => socket.current.emit("offer", watcherSocketId, newLocalPeerConnection.localDescription))
      .then(() => console.log(`Sent! Your Broadcast is being establish to ${users.find(user => user.socketId === watcherSocketId).username}!`))

    broadcasterConnections.current =  [...broadcasterConnections.current, {socketId: watcherSocketId, connection: newLocalPeerConnection}]
  }

  const startBroadcast = () => {
    console.log("Start the broadcast!");
    //because we want everyone logged in to see us, we are going to iterate over every user in the array and make offers for them.
    //only create offers for users that have a socketId, IE logged in

    navigator.mediaDevices.getUserMedia(constraints)
      .then(stream => {
        setStreams(prevState => [...prevState, {socketId: socket.current.id, stream}])
        users.filter(user => user.socketId).forEach(user => createOffer(stream, user.socketId))
      })
  }


  return (
      <div style={{ textAlign: "center" }}>
        {user === null && <Login signupUser={signupUser}/>}
        {user !== null && <ChatRoom startBroadcast={startBroadcast} user={user} users={users} messages={messages} setMessages={setMessages} socket={socket}/>}
        {streams.map(streamObj => <Video key={streamObj.socketId} stream={streamObj.stream}/>)}
        {  console.log(watcherConnections)}
        {  console.log(broadcasterConnections)}
      </div>
  );
}

export default IndexPage
