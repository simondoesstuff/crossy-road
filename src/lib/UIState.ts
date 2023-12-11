import * as glManager from './webGL/glManager'
import {alive as aliveStoreBack} from './webGL/scene/state/player'
import {score as scoreStoreBack} from './webGL/scene/state/tileState'
import {Store} from "$lib/webGL/utils";

/*
    This module is used to re-expose game state to the UI.

    The problems this solves:   useful game state stores are scattered throughout different
    modules, this module centralizes them. Additionally, they are initialized at different times
    and almost none are initialized at the import-time, but the UI will automatically attempt
    to poll their values at import-time. This module solves that problem by providing a superficial
    store that the UI can subscribe to immediately, but won't start producing values until the real
    backing stores have been initialized.

    There is complicated higher-order logic going on here. The forward() function is a lot like a class
    that stores a "front" store and "backing" store. The UI components subscribe to the front store
    immediately and the backing store is set later by an event. When it is set, the forward() object
    will begin listening on the backing store and forwarding it's output to the front store.

    Additionally, this allows for small amounts of logic to be applied to the backing store's output
    before it reaches the UI.

    ** IMPORTANT:     The UI should only READ from the stores in this module. Writing will not reflect
    back to the backing stores. This was necessary because the outputs from the backing stores are slightly
    modified before reaching the UI and there's no implementation for reversing that modification.
 */

export let scoreStore: Store<number>;
export let aliveStore: Store<boolean>;

function forward<T>(defaultValue?: T) {
    // @ts-ignore
    const store = new Store<T>(defaultValue);
    let backingStore;

    return {
        front: store,
        setBackingStore: (back: Store<T>, postProcess?: (v: T) => T) => {
            backingStore = back;
            backingStore.listen((v: T) => {
                if (postProcess) {
                    v = postProcess(v);
                }
                store.set(v);
            });
        }
    }
}

// module initialization
{
    const ready = glManager.events.ready;

    const scoreForward = forward<number>(0);
    scoreStore = scoreForward.front;
    ready.add(() => scoreForward.setBackingStore(scoreStoreBack, (v: number) => v - 5));

    const aliveForward = forward<boolean>(true);
    aliveStore = aliveForward.front;
    ready.add(() => aliveForward.setBackingStore(aliveStoreBack));
}