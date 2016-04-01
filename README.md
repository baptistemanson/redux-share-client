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

The system is currently provided with an express middleware for the server side implementation, while the client is agnostic.

This package is experimental and API will change.


The client a bit more complex, as your need to sync your state with the server upon connection.

```

           Local      WS
             +        +
             |        |
             |        |
             v        v  onActionReceived
        +----+--------+----+
        |                  |
        |                  |
        |    Middleware    |
        |                  |
        |                  |
        +--------+---------+
                 |       ShouldDispatch?
        +--------v---------+
        |                  |
        |     Reducers     |
        |      (next)      |
        |                  |
        +--------+---------+
                 |
        +--------v---------+
        |                  |
        |    Middleware    |
        |                  |
        +--------+---------+
                 |       ShouldSend?
                 v
                 WS

```


The [server side is available here](https://github.com/baptistemanson/redux-share-server) and you can also get some [examples of usage](https://github.com/baptistemanson/redux-share-examples).

```javascript
//client.js
var SyncReduxClient = require('redux-share-client');

var syncReduxClient = new SyncReduxClient('ws://localhost:2000');

//apply the middleware
store = createStore(reducer,applyMiddleware(syncReduxClient.getClientMiddleware()));

//open a socket to the server, then dump the state to the server
store.dispatch({type:"@@SYNC-CONNECT-SERVER-START"});
```


## List of special actions types


* @@SYNC-CONNECT-SERVER-START: call it to initiate the connection. This action will not be seen by the server.
* @@SYNC-CONNECT-SERVER-SUCCESS: called on the client after the connection is successful, with the state in the payload. This action is the first the server will see.
* @@SYNC-CONNECT-SERVER-FAILED: dispatched when the connection fails.
* @@SYNC-CONNECT-SERVER-FAILED-FATAL: dispatched when the connection fails, and it won't try to reconnect.

