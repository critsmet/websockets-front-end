import React, {useState} from 'react'

const ChatRoom = ({user, users, socket, messages}) => {

  const [message, changeMessage] = useState("")

  const loggedInUsers = () => users.filter(user => user.socketId !== null)

  const renderUsers = () => {
    return loggedInUsers().length ? `You are in the chatroom with: ${loggedInUsers().map(user => user.username).join(", ")}` : `No one is here but you, ${user.username}`
  }

  const handleSend = () => {
    socket.current.emit("sentMessage", message)
    changeMessage("")
  }

  //make it faster to get authored messages by id, is this the best way?
  const idsUsernames = () => {
    let idsUsernamesObj = {}
    //include the client's user here
    let usersArray = [...users, user]
    usersArray.forEach(user => idsUsernamesObj[`${user.id}`] = user.username)
    return idsUsernamesObj
  }

  const renderMessages = () => {
    let idsUsernamesObj = idsUsernames()
    return messages.map(message => {
      return (<div>{idsUsernamesObj[`${message.userId}`]} wrote: {message.message}</div>)
    })
  }

  return(
    <div id="chatroom">
      {renderUsers()}
      <div id="messages-container">
      </div>
      <div id="input-field">
        <input onChange={(e) => changeMessage(e.target.value)} value={message} placeholder="Say something..."/>
        <button onClick={() => handleSend()}>Send</button>
        {renderMessages()}
      </div>
    </div>
  )
}

export default ChatRoom
