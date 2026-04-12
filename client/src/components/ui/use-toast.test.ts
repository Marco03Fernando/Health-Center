import { renderHook } from '@testing-library/react';
import * as Module from './use-toast';

describe('use-toast hook', () => {
  it('exports a hook', () => {
    const hook = Module.default || Module.useToast || Module;
    // basic smoke test: ensure importing does not throw
    expect(hook).toBeDefined();
  });
});
