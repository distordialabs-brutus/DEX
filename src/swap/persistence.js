// One writer for settings AND the job journal: settings must not erase funding intents.
const clone = value => JSON.parse(JSON.stringify(value));

function createModulePersistence(write, {writeSettings = write} = {}) {
  let data;
  let queue = Promise.resolve();
  let fault = null;
  function healthy(requireJournal = true) {
    if (!data) { throw new Error('Wallet storage has not initialized.'); }
    if (requireJournal && fault) { throw new Error(`Storage unavailable; funding blocked: ${fault.message}`); }
    if (requireJournal && typeof write !== 'function') { throw new Error('Wallet lacks acknowledged module-storage capability; funding blocked.'); }
  }
  function enqueue(change, journal = true) {
    const operation = queue.then(async () => {
      // A failed journal acknowledgement may follow a durable host commit. Our
      // cache cannot prove otherwise, so no later full-snapshot writer (including
      // settings) may overwrite it. Reads remain available for inspection only.
      if (fault) { throw new Error(`Storage unavailable; writes blocked until authoritative recovery: ${fault.message}`); }
      healthy(journal);
      const next = change(clone(data));
      const serialized = JSON.stringify(next);
      if (new TextEncoder().encode(serialized).length > 900000) {
        throw new Error('Module storage is near capacity; export history before funding.');
      }
      const acknowledgement = (journal ? write : writeSettings)(clone(next));
      if (journal && (!acknowledgement || typeof acknowledgement.then !== 'function')) {
        throw new Error('Wallet storage does not acknowledge durable writes; funding blocked.');
      }
      const result = await acknowledgement;
      if (result === false || result?.error) { throw new Error('Wallet rejected storage write.'); }
      data = next;
    });
    queue = operation.catch(error => { if (journal) { fault = error; } });
    return operation;
  }
  return {
    hydrate(initial) {
      if (data) { throw new Error('Wallet storage already initialized.'); }
      if (!initial || typeof initial !== 'object' || Array.isArray(initial)) {
        throw new Error('Invalid wallet storage.');
      }
      data = clone(initial);
    },
    readJournal() {
      healthy(false);
      // Only an absent journal means a fresh installation. Preserve malformed
      // persisted values so job-store validation blocks instead of hiding history.
      return clone(Object.prototype.hasOwnProperty.call(data, 'swapJournal')
        ? data.swapJournal
        : {version: 1, jobs: []});
    },
    writeJournal(journal) { return enqueue(current => ({...current, swapJournal: clone(journal)})); },
    saveSettings(settings) { return enqueue(current => ({...current, settings: clone(settings)}), false); },
    healthy,
  };
}

// Installed during configureStore; importing this module never accesses wallet credentials.
let active;
function installPersistence(write, options) { active = createModulePersistence(write, options); return active; }
function getPersistence() {
  if (!active) { throw new Error('Wallet persistence is not installed.'); }
  return active;
}
module.exports = {createModulePersistence, installPersistence, getPersistence};
