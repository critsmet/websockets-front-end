import socketIOClient from "socket.io-client";

const initialState = {
  serverResponse: null,
  //originally I had the components handling the available spots but realized that this logic could be contained inside the reducer itself
  //is it okay to hold state in redux that it uses internally?
  //the spots available for streaming are removed and replaced when a stream begins and starts
  spotsAvail: [1, 2, 3, 4],
  socket: socketIOClient(process.env.NODE_ENV === 'production' ? "https://chatapp-back-end.herokuapp.com" : "http://localhost:4001"),
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
      return {...state, streams: [...state.streams, {...action.payload, pos: state.spotsAvail[0]}], spotsAvail: state.spotsAvail.slice(1)}
    case "removeStream":
      let streamToBeRemoved
      return {...state, streams: state.streams.filter(streamObj => {
        if(streamObj.socketId !== action.payload){
          return true
        } else {
          streamToBeRemoved = streamObj
          streamToBeRemoved.stream.getTracks().forEach(track => track.stop())
          return false
        }
      }), spotsAvail: [...state.spotsAvail, streamToBeRemoved && streamToBeRemoved.pos]}
    default:
      return state
  }
}

export {initialState, appReducer}
