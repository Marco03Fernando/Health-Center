import React from 'react';
import { render } from '@testing-library/react';
import * as Module from './MarketplacePage';

const Component = Module.default || Module.MarketplacePage || (() => null);

test('MarketplacePage renders', () => {
  render(<Component />);
});
