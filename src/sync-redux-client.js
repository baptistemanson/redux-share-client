//standardize to work the same way as the server

class SyncReduxClient {
  constructor (url) {
    this.url = url;
    this.readyToSend = false;
    this.debug = false;
  }

  setDebug (debug = false) {
    this.debug = debug;
  }

  init (store) {
    this.ws = new WebSocket(this.url);
    this.store = store;
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
    this.ws.onclose = () => setTimeout(this.init.bind(this), 1000);
  }

  send (action) {
    this.ws.send(JSON.stringify(action));
  }

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
}
;

module.exports = SyncReduxClient;
