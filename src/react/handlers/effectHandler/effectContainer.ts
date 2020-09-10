/**
 * This class is a container for effect details
 * Store and ServiceEffectContainer class extends from this
 * because store and service container
 */
export default abstract class EffectsContainer {
  private effects = new Map<PropertyKey, Effect>();

  storeEffet(effectKey: PropertyKey, effect: Effect) {
    this.effects.set(effectKey, effect);
  }

  getEffect(effectKey: PropertyKey) {
    return this.effects.get(effectKey);
  }
}
interface Effect {
  deps: string[];
  depsValues: any[];
  isCalledOnce: boolean;
  clearEffect?: (() => void) | null;
}
