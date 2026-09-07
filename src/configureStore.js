import { createStore, compose, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';

import createReducer from './reducers';
import { INITIALIZE, updateStorage, stateMiddleware } from 'nexus-module';
import { installPersistence } from './swap/persistence';

export default function configureStore() {
  // Current Nexus Interface updateStorage is fire-and-forget. The acknowledged
  // extension below is a REQUIRED FUTURE host capability, not an existing SDK API.
  // See docs/CROSS_CHAIN_SWAPS.md; legacy settings retain their existing writer.
  const persistence = installPersistence(NEXUS.utilities.updateStorageAcknowledged,
    {writeSettings: updateStorage});
  const persistentData = store => next => action => {
    const previousSettings = store.getState()?.settings;
    const result = next(action);
    if (action.type === INITIALIZE) {
      persistence.hydrate(action.payload.storageData || {});
    } else if (store.getState().nexus?.initialized && previousSettings !== store.getState().settings) {
      persistence.saveSettings(store.getState().settings).catch(error => {
        console.error('Wallet storage failed; new swap funding is blocked.', error.message);
      });
    }
    return result;
  };
  //Middlewares will automatically save when the state as changed,
  //ie state.settings will be stored on disk and will save every time state.settings is changed.
  const middlewares = [
    persistentData, // Serialized settings + acknowledged swap journal; never erase pending jobs.
    stateMiddleware(({ ui }) => {
      // Exclude temporary order states from session storage
      if (!ui || !ui.market) {
        return { ui };
      }
      
      const { myUnconfirmedOrders, myCancellingOrders, myUnconfirmedTrades, ...restUiMarket } = ui.market;
      return { 
        ui: {
          ...ui,
          market: {
            ...restUiMarket
          }
        }
      };
    }), //Data saved to session
    thunk
  ];
  const enhancers = [applyMiddleware(...middlewares)];

  const composeEnhancers = compose; // Disable Redux DevTools to prevent serialization errors

  const store = createStore(createReducer(), composeEnhancers(...enhancers));

  if (module.hot) {
    module.hot.accept('./reducers', () => {
      store.replaceReducer(createReducer());
    });
  }

  return store;
}
