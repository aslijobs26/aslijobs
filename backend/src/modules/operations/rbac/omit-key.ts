function omitKey<T extends object>(target: T, key: keyof T): void {
  delete target[key];
}

export { omitKey };
