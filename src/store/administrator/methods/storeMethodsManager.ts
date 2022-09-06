import type { StoreAdministrator } from "../storeAdministrator";
import { MethodProxyHandler } from "./methodProxyHandler";
import { Func } from "src/types";

export class StoreMethodsManager {
  private methods = new Map<string, Func>();

  handler = new MethodProxyHandler(this.storeAdmin);

  constructor(private storeAdmin: StoreAdministrator) {}

  bindMethods() {
    const context = new Proxy(this.storeAdmin.instance, this.handler);

    Object.entries(this.getMethodsPropertyDescriptors(this.storeAdmin.instance))
      .filter(([key]) => key !== "constructor")
      .filter(([, desc]) => desc.value) // only methods not getter or setter
      .forEach(([methodKey, descriptor]) => {
        this.methods.set(methodKey, (...args) => {
          const res = (descriptor.value as Func)?.apply(context, args);
          this.handler.directMutatedStoreProperties.clear();
          return res;
        });

        Object.defineProperty(this.storeAdmin.instance, methodKey, {
          enumerable: false,
          configurable: true,
          get: () => this.methods.get(methodKey),
        });
      });
  }

  private getMethodsPropertyDescriptors(
    o: unknown
  ): Record<PropertyKey, PropertyDescriptor> {
    const _get = (o: unknown, methods = {}) => {
      const proto = Object.getPrototypeOf(o);
      if (proto && proto !== Object.prototype) {
        methods = { ...Object.getOwnPropertyDescriptors(proto), ...methods };
        return _get(proto, methods);
      } else {
        return methods;
      }
    };
    return _get(o);
  }
}
