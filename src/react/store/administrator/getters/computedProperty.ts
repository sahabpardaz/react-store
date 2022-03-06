import { AccessedPath } from "../propertyKeys/storePropertyKeysManager";
import { StoreAdministrator } from "../storeAdministrator";
import lodashGet from "lodash/get";

export class ComputedProperty {
  private hasStoreValCopiedToStateVal = true;

  private readonly lastValue: {
    store: unknown;
    state: unknown;
  } = { state: null, store: null };

  deps: AccessedPath[] = [];

  constructor(
    private getterName: string,
    private getterFn: () => unknown,
    private storeAdmin: StoreAdministrator
  ) {
    this.calcStoreValue();
    this.lastValue.state = this.lastValue.store;
  }

  getValue(from: "State" | "Store") {
    if (!this.hasStoreValCopiedToStateVal && from === "State") {
      this.copyStoreValueToStateValueIfPossible();
    }
    return this.lastValue[from.toLowerCase()];
  }

  private calcStoreValue() {
    const propertyKeysManager = this.storeAdmin.propertyKeysManager;
    propertyKeysManager.clearAccessedProperties();

    this.lastValue.store = this.getterFn.call(this.storeAdmin.instance);

    this.deps = propertyKeysManager
      .calcPaths()
      .filter((p) => p.type === "GET")
      .map((p) => p.path);

    this.hasStoreValCopiedToStateVal = false;
  }

  tryRecomputeIfNeed(setPaths: AccessedPath[]) {
    let recompute = setPaths.some((setPath) =>
      this.deps.some((dep) =>
        // dep.every((item, index) => item === setPath[index]) ||
        setPath.every((item, index) => item === dep[index])
      )
    );
    /**
     * Check if any of this getter dependencies path
     * is from injected store (store or store parts)
     */
    recompute ||= this.deps.some((path) => {
      const firstPathElementValue = this.storeAdmin.propertyKeysManager.propertyKeys
        .get(path[0])
        ?.getValue("Store");

      return StoreAdministrator.get(firstPathElementValue)?.lastSetPaths.some(
        (setPath) => setPath.every((item, index) => item === path[index + 1])
      );
    });
    if (recompute) {
      this.storeAdmin.lastSetPaths.push([this.getterName]);
      this.calcStoreValue();
    }
  }

  private copyStoreValueToStateValueIfPossible() {
    // Because react 18 transition mode
    const doCopy = this.deps.every(
      (dep) =>
        lodashGet(this.storeAdmin.instance, dep) ===
        lodashGet(this.storeAdmin.instanceForComponents, dep)
    );
    if (doCopy) {
      this.lastValue.state = this.lastValue.store;
      this.hasStoreValCopiedToStateVal = true;
    }
  }
}
