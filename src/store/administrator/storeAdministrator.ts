import { STORE_ADMINISTRATION } from "../../constant";
import { StoreForConsumerComponentProxy } from "../../proxy/storeForConsumerComponentProxy";
import { StoreGettersManager } from "./getters/storeGettersManager";
import { HooksManager } from "./hooksManager";
import { StoreMethodsManager } from "./methods/storeMethodsManager";
import { StorePropertyKeysManager } from "./propertyKeys/storePropertyKeysManager";
import { PropsManager } from "./propsManager";
import { StoreEffectsManager } from "./storeEffectsManager";
import { StoreStorePartsManager } from "./storeStorePartsManager";
import { ClassType } from "src/types";

export class StoreAdministrator {
  type: ClassType;

  instance: InstanceType<ClassType>;

  renderContext?: (relax?: boolean) => void;

  injectedInTos = new Set<StoreAdministrator>();

  instanceForComponents: InstanceType<ClassType>;

  propsManager!: PropsManager;

  hooksManager!: HooksManager;

  gettersManager!: StoreGettersManager;

  methodsManager!: StoreMethodsManager;

  effectsManager!: StoreEffectsManager;

  storePartsManager!: StoreStorePartsManager;

  propertyKeysManager!: StorePropertyKeysManager;

  constructor(type: ClassType, renderContext?: (relax?: boolean) => void) {
    this.type = type;
    this.renderContext = renderContext;
    this.propsManager = new PropsManager(this);
    this.hooksManager = new HooksManager(this);
    this.gettersManager = new StoreGettersManager(this);
    this.methodsManager = new StoreMethodsManager(this);
    this.effectsManager = new StoreEffectsManager(this);
    this.storePartsManager = new StoreStorePartsManager(this);
    this.propertyKeysManager = new StorePropertyKeysManager(this);
    this.storePartsManager.createInstances();
  }

  static get(value: unknown) {
    return ((value && typeof value === "object" && value[STORE_ADMINISTRATION]) ||
      null) as null | StoreAdministrator;
  }

  setInstance(instance: InstanceType<ClassType>) {
    this.instance = instance;
    this.instance[STORE_ADMINISTRATION] = this;
    this.instanceForComponents = new Proxy(
      this.instance,
      new StoreForConsumerComponentProxy()
    );

    // !!!! Orders matter !!!!
    this.propsManager.register();
    this.storePartsManager.register();
    this.hooksManager.register();
    this.propertyKeysManager.registerUseStates();
    this.propertyKeysManager.makeAllObservable();
    this.effectsManager.registerEffects();
    this.gettersManager.registerMemos();
    this.methodsManager.bindMethods();
  }

  renderConsumers(relax?: boolean) {
    this.renderContext?.(relax || this.propertyKeysManager.hasPendingSetStates());
    this.propertyKeysManager.doPendingSetStates();
    this.injectedInTos.forEach((st) => st.renderConsumers(relax));
  }
}
