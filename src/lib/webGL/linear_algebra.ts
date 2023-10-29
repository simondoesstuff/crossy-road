export class Vec {
    public readonly n: number;
    public data: number[];

    constructor(...values: number[]) {
        this.n = values.length;
        this.data = values;
    }

    static zero(n: number) {
        return new Vec(...Array(n).fill(0));
    }

    map(f: (x: number, i: number, array: number[]) => number): this {
        return new Vec(...this.data.map(f)) as this;
    }

    merge(other: this, f: (x: number, y: number) => number) {
        if (this.n !== other.n) {
            throw new Error('Cannot merge vectors of different sizes');
        }
        return this.map((x, i) => f(x, other.data[i]));
    }

    add(other: this | number) {
        if (typeof other === 'number') {
            return this.map(x => x + other);
        } else {
            return this.merge(other, (x, y) => x + y);
        }
    }

    sub(other: this | number) {
        if (typeof other === 'number') {
            return this.map(x => x - other);
        } else {
            return this.merge(other, (x, y) => x - y);
        }
    }

    // Component wise multiplication
    mul(other: this | number) {
        if (typeof other === 'number') {
            return this.map(x => x * other);
        } else {
            return this.merge(other, (x, y) => x * y);
        }
    }

    // Component wise division
    div(other: this | number) {
        if (typeof other === 'number') {
            return this.map(x => x / other);
        } else {
            return this.merge(other, (x, y) => x / y);
        }
    }

    /// Dot product
    dot(other: this) {
        return this.data
            .reduce((acc, x, i) =>
                acc + x * other.data[i], 0);
    }

    magnitude() {
        return Math.sqrt(this.dot(this));
    }

    scale(mag: number) {
        return this.normalized().mul(mag);
    }

    normalized() {
        const mag = this.magnitude();
        if (mag === 0) return this;
        return this.div(mag);
    }

    clone(): this {
        return this.map(x => x) as this;
    }

    // Expands the dimensionality of the vector to n
    // by filling the new dimensions with 0
    expandDim(n: number) {
        if (n < this.n) {
            throw new Error('Cannot expand dimensionality to a smaller size');
        }

        for (let i = this.n; i < n; i++) {
            this.data.push(0);
        }
    }

    unwrapF32Array() {
        return new Float32Array(this.data);
    }

    get x() { return this.data[0]; }
    get y() { return this.data[1]; }
    get z() { return this.data[2]; }
    set x(x: number) { this.data[0] = x; }
    set y(y: number) { this.data[1] = y; }
    set z(z: number) { this.data[2] = z; }
}