import React from "react";
import { getFromContainer } from "src/container";
import { ClassType } from "src/types";
import ReactAppContext from "../appContext";
import buildProviderComponent from "./buildProviderComponent";

const appContext = getFromContainer(ReactAppContext);

const createStoreContext = <T extends ClassType>(storeType: T) => {
  const TheContext = React.createContext<T | null>(null);
  const ContextProvider = buildProviderComponent(TheContext, storeType);

  // store context provider in app container
  // to use context ref in useStore to get context value
  appContext.registerStoreContext({ storeType, context: TheContext });
  return ContextProvider;
};

export default createStoreContext;
