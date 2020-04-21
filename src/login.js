import React, {useState} from 'react'

const Login = ({signupUser}) => {

  const [text, inputText] = useState('')

    return (
      <div>
        Enter your name:
        <input onChange={(e => inputText(e.target.value))} type="text"/>
        <input onClick={(e) => signupUser(text)} type="button" value="Submit"/>
      </div>
    )
}

export default Login
