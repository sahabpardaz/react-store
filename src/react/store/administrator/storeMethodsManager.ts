import type { StoreAdministrator } from "./storeAdministrator";

export class StoreMethodsManager {
  methods = new Map<PropertyKey, Function | null>();

  constructor(private storeAdmin: StoreAdministrator) {}

  makeAllAutoBound() {
    Object.entries(this.getMethodsPropertyDescriptors(this.storeAdmin.instance))
      .filter(([key]) => key !== "constructor")
      .filter(([, desc]) => desc.value) // only methods not getter or setter
      .forEach(([methodKey, descriptor]) => {
        this.methods.set(methodKey, this.createMethod(descriptor.value));

        Object.defineProperty(this.storeAdmin.instance, methodKey, {
          enumerable: false,
          configurable: true,
          get: () => this.methods.get(methodKey),
          set: (value: any) => this.methods.set(methodKey, value),
        });
      });
  }

  createMethod(fn: () => any) {
    return fn.bind(this.storeAdmin.instance);
  }

  private getMethodsPropertyDescriptors(
    o: any
  ): Record<PropertyKey, PropertyDescriptor> {
    const _get = (o: any, methods = {}) => {
      const proto = Object.getPrototypeOf(o);
      if (proto && proto !== Object.prototype) {
        methods = { ...methods, ...Object.getOwnPropertyDescriptors(proto) };
        return _get(proto, methods);
      } else {
        return methods;
      }
    };
    return _get(o);
  }
}
