import React, { Context, useEffect, useRef, useState } from "react";
import { getFromContainer } from "src/container/container";
import { ClassType } from "src/types";
import uid from "src/utils/uid";
import { ReactApplicationContext } from "../appContext";
import { STORE_ADMINISTRATION } from "../../constant";
import { registerHandlers } from "../handlers/registerHandlers";
import storeInjectionHandler from "../handlers/storeInjectionHandler";
import { StoreAdministration } from "./storeAdministration";
import useLazyRef from "src/utils/useLazyRef";

interface ProviderComponentProps {
  props?: any;
}

export const buildStoreContextProvider = (
  TheContext: Context<StoreAdministration | null>,
  StoreType: ClassType
): React.FC<ProviderComponentProps> => ({ children, props }) => {
  const id = useLazyRef(() => uid()).current;
  const [, setRenderKey] = useState(() => uid());
  const appContext = getFromContainer(ReactApplicationContext);

  // Inject Contextual Store which has been mounted before
  const injectedStores = storeInjectionHandler(StoreType);

  const storeAdministration = useLazyRef(() =>
    appContext.resolveStoreAdmin({
      id,
      StoreType,
      storeDeps: injectedStores,
    })
  ).current;

  // for example if we inject store A  in to other store B
  // if then injected store A change all store b consumer must be
  // notified to rerender base of their deps
  // so here we save store B ref in store A
  // to nofify B if A changed
  if (injectedStores.size) {
    storeAdministration.turnOffRender();
    injectedStores.forEach((injectedStore) => {
      injectedStore.turnOffRender();
      for (const [propertyKey, value] of Object.entries<any>(
        storeAdministration.pureInstance
      )) {
        if (
          (value?.[STORE_ADMINISTRATION] as StoreAdministration)?.id ===
          injectedStore.id
        ) {
          injectedStore.addInjectedInto({ storeAdministration, propertyKey });
        }
      }
      injectedStore.turnOnRender();
    });
    storeAdministration.turnOnRender();
  }

  useEffect(() => {
    const render = () => setRenderKey(uid());
    storeAdministration.consumers.push({ render });
    return () => {
      appContext.removeStoreAdmin(id);
      storeAdministration.consumers = storeAdministration.consumers.filter(
        (cnsr) => cnsr.render !== render
      );
    };
  }, []);

  registerHandlers(storeAdministration, props);

  return (
    <TheContext.Provider value={storeAdministration}>
      {children}
    </TheContext.Provider>
  );
};