# Todos

- [X] Separate examples from lib when stable.
- [ ] Add checkers md5 to check state
- [ ] Implement rollback + replay
- [ ] Force resync implementation
- [ ] Test performance
- [ ] Investigate a queue of actions for performance.
- [ ] Binary protocol? Need to detect versions and encode messages.
- [ ] Prefix with TRIP

design intentions

- keep track of a buffer of actions. Each action has an id.
- server sends frequently a table of ids. The actions having those ids have to be flushed from the buffer.
- if a hard sync is received, it is received with an action id. All actions subsequent to this id will be replayed on the state.

