import {Event} from './utils';


const keyMap = {
    'KeyW': 'forward',
    'KeyS': 'backward',
    'KeyA': 'left',
    'KeyD': 'right',

    'ArrowUp': 'forward',
    'ArrowDown': 'backward',
    'ArrowLeft': 'left',
    'ArrowRight': 'right',

    'Space': 'forward',
    'Enter': 'forward',

    'Escape': 'pause',
    'KeyP': 'pause'
};

const keyState = new Map<string, boolean>();

export type Action = 'forward' | 'backward' | 'left' | 'right' | 'pause';
type InputEvent = () => void;

// interface to the real "unsafe" map
const safeMap = (map: Map<Action, Event<InputEvent>>) => {
    return {
        add: (action: Action, handler: InputEvent) => map.get(action)!.add(handler),
        remove: (action: Action, handler: InputEvent) => map.get(action)!.remove(handler),
    }
}

const downMap: Map<Action, Event<InputEvent>> = new Map();
const upMap: Map<Action, Event<InputEvent>> = new Map();

export const up = safeMap(upMap);
export const down = safeMap(downMap);

export function init() {
    for (const action of new Set(Object.values(keyMap))) {
        downMap.set(action as Action, new Event());
        upMap.set(action as Action, new Event());
    }

    document.addEventListener('keydown', (e) => {
        // @ts-ignore
        const action = keyMap[e.code] as Action;
        if (!action) return;
        if (keyState.get(action)) return;
        keyState.set(action, true);
        downMap.get(action)!.fire(action);
    });

    document.addEventListener('keyup', (e) => {
        // @ts-ignore
        const action = keyMap[e.code] as Action;
        if (!action) return;
        if (!keyState.get(action)) return;
        keyState.set(action, false);
        upMap.get(action)!.fire(action);
    });
}

export function isDownNow(action: string) {
    return keyState.get(action) ?? false;
}
