import React, {useState} from 'react'

import SocketAdapter from './SocketAdapter'

const Signin = ({socketRef, objToInitSocketAdapter}) => {

  const signupUser = (username) => {
    socketRef.current = SocketAdapter(objToInitSocketAdapter)
    socketRef.current.connection.emit("initializeSession", username)
  }

  const [text, inputText] = useState('')

    return (
      <div>
        Enter your name:
        <input onChange={(e => inputText(e.target.value))} type="text"/>
        <input onClick={(e) => signupUser(text)} type="button" value="Submit"/>
      </div>
    )
}

export default Signin
