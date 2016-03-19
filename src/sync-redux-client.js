//standardize to work the same way as the server

class SyncReduxClient {
  constructor (url, options) {
    //properties
    const defaultOptions = {
      //delay between reconnect tries
      autoReconnectDelay:1000,
      //null for unlimited autoReconnect, 0 will disable autoReconnect, 1 will try only once etc.
      autoReconnectMaxTries:null,
      //callback called just before sending to the server.
      shouldSend:null,
      debug:false,
    };

    this.options = Object.assign({},defaultOptions,options);

    //state
    this.url = url;
    this.store = null;
    this.readyToSend = false;
    this.connectTriesCount = 0;
  }

  log() {
    if (this.options.debug) {
        console.log("redux-share-client: ",...arguments);
      }
  }

  /**
   * Inits a connection with the server
   * @param store
   */
  init (store = null) {
    this.log('Initializing the socket');
    this.ws = new WebSocket(this.url);

    if(store === null ) {
       throw 'You must provide a redux store as the sole parameter of the init function.';
    }
    
    this.store = store;

    this.ws.onerror = () => {
      this.store.dispatch({type: "@@SYNC-CONNECT-SERVER-FAILED", url: this.url});
    };

    this.ws.onopen = function () { 
      this.log('Socket initialized, sending a dump of the full state to the server.'); 
      this.connectTriesCount = 0;
      //send a state dump
      this.readyToSend = true;
      let state = this.store.getState() || {};
      this.store.dispatch({type: "@@SYNC-CONNECT-SERVER-END", state: state});
    }.bind(this);

    this.ws.onmessage = event => {
      this.log("Received an action from the server", event.data);
      this.store.dispatch(JSON.parse(event.data));
    }
    
    this.ws.onclose = () => {
      this.readyToSend = false;
      this.log("Socket closed.")
      this.reconnect();      
  }
}
  reconnect() {
    if (this.options.autoReconnectMaxTries === null || this.connectTriesCount < this.options.autoReconnectMaxTries) {
        this.log("Reconnecting automatically... "+this.connectTriesCount++);
        setTimeout(this.init.bind(this, this.store), this.options.autoReconnectDelay)
      }
      else if(this.connectTriesCount == this.options.autoReconnectMaxTries) {
        this.log("Reached the maximum of authorized reconnect tries.");
        this.store.dispatch({type: "@@SYNC-CONNECT-SERVER-FAILED-FATAL", url: this.url});
      }
  }

  /**
   * Sends an action to the server
   *
   * @param action
   */
  send (action) {
    if( typeof(this.options.shouldSend) == 'function' && !this.options.shouldSend.apply(this, [action, this.ws])) {
      return;
    }
    else {
      this.log('Sending to the server the action ', action);
      this.ws.send(JSON.stringify(action));
    }
  }

  /**
   * Get the middleware for Redux
   * @returns {Function}
   */
  getClientMiddleware () {
    return store => next => action => {
      //need to enrich next action.
      let result = next(action);
      // If the action have been already emited, we don't send it back to the server
      if (this.readyToSend) {
        this.send(action);
      }
      //should be migrated to a reducer?
      if (action.type === "@@SYNC-CONNECT-SERVER-START") this.init(store);
      return result;
    }
  }
}
;

module.exports = SyncReduxClient;
