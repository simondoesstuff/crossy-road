export class Event<T extends Function> {
    private handlers: T[] = [];

    public add(handler: T) {
        this.handlers.push(handler);
    }

    public remove(handler: T) {
        this.handlers = this.handlers.filter(h => h !== handler);
    }

    public fire(...args: any[]) {
        this.handlers.slice(0).forEach(h => h(...args));
    }
}

// A Store is a special case of an event. It represents an object that stores a single
// value of which subscribers can "listen" for changes to it. All changes to the value
// are controlled by the Store so that the Store can reliably alert its subscribers.
export class Store<T> {
    private value: T;
    private readonly listeners: Event<(value: T) => void> = new Event();

    public constructor(value: T) {
        this.value = value;
    }

    public get() {
        return this.value;
    }

    public set(value: T) {
        if (value === this.value) return;
        this.value = value;
        this.listeners.fire(value);
    }

    public listen(handler: (value: T) => void) {
        this.listeners.add(handler);
    }

    public unlisten(handler: (value: T) => void) {
        this.listeners.remove(handler);
    }

    public listenWhile(handler: (value: T) => boolean) {
        const listener = (value: T) => {
            if (!handler(value)) this.unlisten(listener);
        };
        this.listen(listener);
    }

    public listenFor(state: T, handler: () => void) {
        this.listen((t) => {
            if (state !== t) return;
            handler();
        });
    }
}

export async function importFile(path: string) {
    const resp = await fetch(path);
    return await resp.text();
}