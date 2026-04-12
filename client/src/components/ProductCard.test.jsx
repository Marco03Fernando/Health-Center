import React from 'react';
import { render, screen } from '@testing-library/react';
import * as Module from './ProductCard';

const Component = Module.default || Module.ProductCard || (() => null);

const mockProduct = {
  id: '1',
  image: '\ud83d\udc8a',
  name: 'Test Medicine',
  description: 'A test pharmaceutical product',
  prescriptionRequired: false,
  price: 500,
  quantity: 10,
};

describe('ProductCard', () => {
  it('renders without crashing', () => {
    render(<Component product={mockProduct} onAddToCart={jest.fn()} />);
  });

  it('displays the product name', () => {
    render(<Component product={mockProduct} onAddToCart={jest.fn()} />);
    expect(screen.getByText('Test Medicine')).toBeTruthy();
  });
});
