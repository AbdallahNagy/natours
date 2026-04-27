export default (
  obj: Record<string, any>,
  ...allowed: string[]
): Record<string, any> => {
  const out: Record<string, any> = {};
  allowed.forEach(key => {
    if (obj[key] !== undefined) out[key] = obj[key];
  });
  return out;
};
