import { INITIALIZE } from 'nexus-module';
import { combineReducers } from 'redux';
import { walletDataReducer } from 'nexus-module';

import ui from './ui';
import settings from './settings';

const isPlainObject = (value) =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/**
 * Merge previously persisted state over the freshly initialised reducer state.
 *
 * A shallow spread would drop any reducer key that did not exist yet when the
 * state was persisted (for example `ui.nft`, or the unconfirmed-order slices
 * that are deliberately excluded from session state), leaving components that
 * read `state.ui.nft.listings` to crash on `undefined`. Merging recursively
 * keeps the reducer defaults for anything the persisted blob does not carry.
 */
export const mergePersistedState = (base, persisted) => {
  if (!isPlainObject(persisted)) return base;
  if (!isPlainObject(base)) return persisted;

  const merged = { ...base };
  for (const key of Object.keys(persisted)) {
    const persistedValue = persisted[key];
    merged[key] =
      isPlainObject(persistedValue) && isPlainObject(base[key])
        ? mergePersistedState(base[key], persistedValue)
        : persistedValue;
  }
  return merged;
};

export default function createReducer() {
  const baseReducer = combineReducers({
    ui,
    settings,
    nexus: walletDataReducer,
  });

  return function (state, action) {
    const newState = baseReducer(state, action);

    if (action.type === INITIALIZE) {
      const { storageData, moduleState } = action.payload || {};
      // Persistence owns the complete host envelope; Redux owns only these
      // reducer roots. Project both disk and session data without altering either
      // input, then retain the existing recursive merge and session precedence.
      let restored = newState;
      for (const persisted of [storageData, moduleState]) {
        if (!isPlainObject(persisted)) continue;
        const owned = {};
        for (const key of Object.keys(newState)) {
          if (Object.prototype.hasOwnProperty.call(persisted, key)) {
            owned[key] = persisted[key];
          }
        }
        restored = mergePersistedState(restored, owned);
      }
      return restored;
    }

    return newState;
  };
}
