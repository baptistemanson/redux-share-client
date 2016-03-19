//standardize to work the same way as the server

class SyncReduxClient {
  constructor (url, options) {

    let defaultOptions = {autoReconnect:true,autoReconnectDelay:1000,debug:false,shouldSend:null};

    this.url = url;
    this.store = null;
    this.readyToSend = false;

    this.options = Object.assign(defaultOptions,options);
    console.log(this.options);
    this.autoReconnect = options.autoReconnect;
    
    this.shouldSend = options.shouldSend;
    this.debug = options.debug;
  }

  log() {
    if (this.debug) {
        console.log("redux-share-client: ",...arguments);
      }
  }

  /**
   * Init a connection with the server
   * @param store
   */
  init (store = null) {
    this.log('Initializing the socket');
    this.ws = new WebSocket(this.url);

    if(store === null ) {
       throw 'A redux store is required';
       this.log("Please provide a redux store as the parameter of the init function.");
    }
    
    this.store = store;

    this.ws.onerror = () => {
      this.store.dispatch({type: "@@SYNC-CONNECT-SERVER-FAILED", url: this.url});
    };

    this.ws.onopen = function () {
      
      //send a state dump
      this.readyToSend = true;
      let state = this.store.getState() || {};
      this.store.dispatch({type: "@@SYNC-CONNECT-SERVER-END", state: state});
    }.bind(this);

    this.ws.onmessage = event => {
      if (this.debug) {
        this.log("Sync: Received some stuff from the server", event.data);
      }
      this.store.dispatch(JSON.parse(event.data));
    }
    
    this.ws.onclose = () => {
      if (this.autoReconnect) {
        setTimeout(this.init.bind(this, this.store), this.options.autoReconnectDelay)
      }
  }
}

  /**
   * Send an action to the server
   *
   * @param action
   */
  send (action) {
    if(this.shouldSend !== null && !this.shouldSend.apply(this, [action, this.ws])) {
      return;
    }
    else {
      this.ws.send(JSON.stringify(action));
    }
  }

  /**
   * Middleware for Redux
   * @returns {Function}
   */
  getClientMiddleware () {
    return store => next => action => {
      //need to enrich next action.
      this.log('Dispatching ', action);
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
