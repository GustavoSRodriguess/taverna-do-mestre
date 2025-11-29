// Polyfills ArrayBuffer/SharedArrayBuffer resizable APIs expected by whatwg-url/jsdom.
const defineIfMissing = (proto, prop, getter) => {
  const desc = Object.getOwnPropertyDescriptor(proto, prop);
  if (!desc) {
    Object.defineProperty(proto, prop, { get: getter });
  }
};

if (typeof globalThis.ArrayBuffer !== 'undefined') {
  defineIfMissing(ArrayBuffer.prototype, 'resizable', () => false);
  defineIfMissing(ArrayBuffer.prototype, 'maxByteLength', function () {
    return this.byteLength;
  });
}

if (typeof globalThis.SharedArrayBuffer !== 'undefined') {
  defineIfMissing(SharedArrayBuffer.prototype, 'growable', () => false);
  defineIfMissing(SharedArrayBuffer.prototype, 'maxByteLength', function () {
    return this.byteLength;
  });
}
