import { StoreProvider } from "./StoreProvider";
import React from "react";
import { ClassType } from "src/types";

export const connectStore =
  <T extends object>(Component: React.FC<T>, storeType: ClassType): React.FC<T> =>
  (props: T) =>
    <StoreProvider type={storeType} props={props} render={Component} />;
