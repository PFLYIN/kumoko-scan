// Ajuste do webpack usado pelo `nest build` (modo monorepo).
// Os aliases @kumoko/* sao resolvidos aqui porque o tsconfig usa `paths` sem `baseUrl`
// (baseUrl esta deprecado no TypeScript 6). Mantenha em sincronia com tsconfig.json e o jest.
const path = require('node:path');

const LIBS = ['common', 'security', 'observability', 'cache', 'messaging'];

module.exports = (options) => {
  const alias = Object.fromEntries(
    LIBS.map((lib) => [`@kumoko/${lib}`, path.resolve(__dirname, 'libs', lib, 'src')]),
  );
  return {
    ...options,
    resolve: {
      ...options.resolve,
      alias: { ...(options.resolve && options.resolve.alias), ...alias },
    },
  };
};
