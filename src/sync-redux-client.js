//standardize to work the same way as the server

class SyncReduxClient {
  constructor (url) {
    this.url = url;
    this.store = null;
    this.readyToSend = false;
    this.debug = false;
    this.autoReconnect = true;
  }

  /**
   * Set if the client must send debug information to the console
   * @param debug
   */
  setDebug (debug = false) {
    this.debug = debug;
  }

  /**
   * Init a connection with the server
   * @param store
   */
  init (store = null) {
    try {
      this.ws = new WebSocket(this.url);
    } catch (e) {
      this.store.dispatch({type: "@@SYNC-CONNECT-SERVER-FAILED", url: this.url});
      return;
    }
    // No store previously declared
    if(this.store === null) {
      if(store === null) {
        throw 'A store is required when the server have never been initialised with it';
      }
      this.store = store;
      // Store already defined and param not null
    } else if(store !== null) {
      this.store = store;
    } else {
      // Store already defined but param null, ignoring
    }
    this.ws.onopen = function () {
      if (this.debug) {
        console.log("Sync connected!");
      }
      //send a state dump
      this.readyToSend = true;
      let state = this.store.getState() || {};
      this.store.dispatch({type: "@@SYNC-CONNECT-SERVER-END", state: state});
    }.bind(this);

    this.ws.onmessage = event => {
      if (this.debug) {
        console.log("Sync: Received some stuff from the server", event.data);
      }
      this.store.dispatch(JSON.parse(event.data));
    }
    this.ws.onclose = () => {
      if(this.autoReconnect) {
        setTimeout(this.init.bind(this), 1000)
      }
    };
  }

  /**
   * Send an action to the server
   *
   * @param action
   */
  send (action) {
    this.ws.send(JSON.stringify(action));
  }

  /**
   * Middleware for Redux
   * @returns {Function}
   */
  getClientMiddleware () {
    return store => next => action => {
      //need to enrich next action.
      if (this.debug) {
        console.log('Sync: dispatching ', action);
      }
      let result = next(action);
      // If the action have been already emited, we don't send it back to the server
      if (this.readyToSend && action.senderId === undefined) {
        this.send(action);
      }
      //should be migrated to a reducer?
      if (action.type === "@@SYNC-CONNECT-SERVER-START") this.init(store);
      return result;
    }
  }

  /**
   * Set the client behavior in case the socket connection is closed/notStarted
   *
   * @param reconnect
   */
  setAutoReconnect (reconnect) {
    this.autoReconnect = reconnect;
  }
}
;

module.exports = SyncReduxClient;
