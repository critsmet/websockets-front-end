import socketIOClient from "socket.io-client";

const initialState = {
  serverResponse: null,
  socket: socketIOClient(process.env.NODE_ENV === "production" ? "https://chatapp-back-end.herokuapp.com" : "http://localhost:4001"),
  user: null,
  users: [],
  messages: [],
  streams: []
}

const appReducer = (state, action) => {
  switch(action.type){
    case "setServerResponse":
      return {...state, serverResponse: action.payload}
    case "setUser":
      return {...state, user: action.payload}
    case "setSocket":
      return {...state, socket: action.payload}
    case "setUsers":
      return {...state, users: action.payload}
    case "addUser":
      return {...state, users: [...state.users, action.payload]}
    case "logoutUser":
      return {...state, users: state.users.filter(user => user.socketId !== action.payload)}
    case "setMessages":
      return {...state, messages: action.payload}
    case "newMessage":
      return {...state, messages: [...state.messages, action.payload]}
    case "addStream":
      return {...state, streams: [...state.streams, action.payload]}
    case "removeStream":
      return {...state, streams: state.streams.filter(streamObj => streamObj.socketId !== action.payload)}
    default:
      return state
  }
}

export {initialState, appReducer}
