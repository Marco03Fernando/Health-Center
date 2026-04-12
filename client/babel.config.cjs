// Custom plugin to replace import.meta.env with process.env for Jest (CommonJS)
const transformImportMetaEnv = ({ types: t }) => ({
  visitor: {
    // import.meta.env.FOO  →  process.env.FOO
    MemberExpression(path) {
      const { node } = path;
      if (
        node.object.type === 'MetaProperty' &&
        node.object.meta &&
        node.object.meta.name === 'import' &&
        node.object.property.name === 'meta' &&
        !node.computed &&
        node.property.name === 'env'
      ) {
        path.replaceWith(
          t.memberExpression(t.identifier('process'), t.identifier('env'))
        );
      }
    },
    // bare import.meta  →  { env: process.env }
    MetaProperty(path) {
      const { node } = path;
      if (
        node.meta &&
        node.meta.name === 'import' &&
        node.property.name === 'meta'
      ) {
        path.replaceWith(
          t.objectExpression([
            t.objectProperty(
              t.identifier('env'),
              t.memberExpression(t.identifier('process'), t.identifier('env'))
            ),
          ])
        );
      }
    },
  },
});

module.exports = {
  presets: [
    ['@babel/preset-env', { targets: { node: 'current' } }],
    ['@babel/preset-react', { runtime: 'automatic' }],
    '@babel/preset-typescript'
  ],
  plugins: [
    transformImportMetaEnv,
  ],
};
