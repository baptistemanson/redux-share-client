# redux-share-client

```
  /$$$$$$  /$$                                    
 /$$__  $$| $$                                    
| $$  \__/| $$$$$$$   /$$$$$$   /$$$$$$   /$$$$$$ 
|  $$$$$$ | $$__  $$ |____  $$ /$$__  $$ /$$__  $$
 \____  $$| $$  \ $$  /$$$$$$$| $$  \__/| $$$$$$$$
 /$$  \ $$| $$  | $$ /$$__  $$| $$      | $$_____/
|  $$$$$$/| $$  | $$|  $$$$$$$| $$      |  $$$$$$$
 \______/ |__/  |__/ \_______/|__/       \_______/
```

Share redux state across the network between multiple clients and server!

_This package is experimental and API will change._

Here is the client lib that you cand use in your browser-based or node-based
project. Only works if your browser supports webSockets.

## Install

```
$ npm install redux-share-client

// client.js
import SyncReduxClient from 'redux-share-client';
import redux from 'redux';

var options = { /** your options here **/ };
var reduxShare = new SyncReduxClient('ws://localhost:2000', options);
var store = redux.createStore(
  reducers, // your reducers, as usual
  redux.applyMiddleware( reduxShare.getReduxMiddleware() )
);

// This action starts the connection to the server.
store.dispatch({type:"@@SYNC-CONNECT-SERVER-START"});
```

## Flow

Here is the general flow of the redux middleware.

```

      store.dispatch  WS
             |        |
             |  onActionReceived()
             |        |
             v        v
        +------------------+
        |                  |
        |                  |
        |    Middleware    |
        |                  |
        |                  |
        +--------+---------+
                 |      
         ShouldDispatch()? --------+
                 |                 |
      (next middleware...then)     |
        +--------v---------+       |
        |                  |       |
        |                  |       |
        |     Reducers     |       |
        |                  |       |
        |                  |       |
        +--------+---------+       |
                 |                 |
                 |<----------------+
                 |
        +--------v---------+
        |                  |
        |    Middleware    |
        |                  |
        +--------+---------+
                 |      
                 V
            ShouldSend()?
                 |
                 V
                 WS


```

## Possible Options

### debug

Takes on `boolean` value. If `true`, messages would be logged when significant
server events take place.
_By default, this is set to false._

### autoReconnectDelay:

Takes on a `Number` value. If `null` or `0`, autoReconnect will be disabled. If
`1`, it will try only once.
_By default, this is set to 1000.

Please consult the [server](https://github.com/baptistemanson/redux-share-server) for the full documentation.


