const React = require('react');

// Create a forwardRef component with a displayName — required by toast.jsx
function makeComponent(name) {
  const Comp = React.forwardRef(function MockToastComp({ children, ...props }, ref) {
    return React.createElement('div', { 'data-mock': name, ref }, children || null);
  });
  Comp.displayName = name;
  return Comp;
}

const Provider   = makeComponent('ToastProvider');
const Viewport   = makeComponent('ToastViewport');
const Root       = makeComponent('ToastRoot');
const Action     = makeComponent('ToastAction');
const Close      = makeComponent('ToastClose');
const Title      = makeComponent('ToastTitle');
const Description = makeComponent('ToastDescription');

module.exports = {
  Provider,
  Viewport,
  Root,
  Action,
  Close,
  Title,
  Description,
};
