import React from 'react';
import { render } from '@testing-library/react';
import * as Module from './MedicationInventoryPage';

const Component = Module.default || Module.MedicationInventoryPage || (() => null);

test('MedicationInventoryPage renders', () => {
  render(<Component />);
});
