import React, {useState, useEffect} from 'react'

const Signin = ({socketRef, usersRef}) => {

  const [username, changeUsername] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    const listener = event => {
      if (event.code === "Enter" || event.code === "NumpadEnter") {
        signupUser()
      }
    };
    document.addEventListener("keydown", listener);
    return () => {
      document.removeEventListener("keydown", listener);
    };
  }, []);

  const signupUser = () => {
    if (username === "" ) {
      setMessage("please enter a handle")
    } else if (usersRef.current.find(user=> user.username === username)){
      setMessage("username taken")
    } else {
      socketRef.current.emit("initializeSession", username)
    }
  }

  const formatInput = (value) => {
    console.log(value);
    setMessage('')
    if (value.length >= 13){
      setMessage("max 12 characters")
    } else if (value.match(/\W/)){
      setMessage("invalid character")
    } else if (value === ""){
      changeUsername(value)
    } else {
      changeUsername("@" + value)
    }
  }

    return (
      <div id="signup" className="w-40 flex flex-column items-center">
        <p className="h1 pt1">{message}</p>
        <input
          placeholder="enter a handle"
          onChange={(e => formatInput(e.target.value[0] === "@" ? e.target.value.slice(1) : e.target.value))}
          type="text"
          className="db w-75 mb3 h3 bg-washed-yellow fw2 grow tc f2"
          spellCheck="false"
          value={username}
        />
        <input
          onClick={signupUser}
          type="button"
          value="join"
          className="db w-25 h2 p3 br-pill white bg-dark-gray bg-animate hover-bg-mid-gray pointer tc f4"
        />
      </div>
    )
}

export default Signin
