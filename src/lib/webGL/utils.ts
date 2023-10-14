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

export async function importFile(path: string) {
    return (await import(path + '?raw')).default;
}

async function wrapInResponse(data: string, type: string) {
    const blob = new Blob([data], { type });
    return new Response(blob);
}

export async function importFileAsResponse(path: string) {
    return wrapInResponse(await importFile(path), null!);
}
