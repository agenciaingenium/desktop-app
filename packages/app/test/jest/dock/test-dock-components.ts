/* eslint-disable @typescript-eslint/no-explicit-any */
import * as React from 'react';
import AppIcon from '../../../src/dock/components/AppIcon';
import TrafficLights from '../../../src/dock/components/TrafficLights';

const renderChildren = (element: React.ReactElement<any>) =>
  React.Children.toArray(element.props.children) as React.ReactElement<any>[];

describe('dock components', () => {
  describe('AppIcon', () => {
    it('renders a sized themed icon image', () => {
      const element = new AppIcon({ imgUrl: 'https://example.com/icon.png', themeColor: '#123456', size: 42 }).render();

      expect(element.props.style).toEqual(expect.objectContaining({
        width: 42,
        height: 42,
        borderRadius: 100,
        backgroundColor: '#123456',
        overflow: 'hidden',
      }));

      const image = renderChildren(element).find(child => child.type === 'img');
      expect(image).toBeDefined();
      expect(image!.props.src).toBe('https://example.com/icon.png');
      expect(image!.props.alt).toBe('');
      expect(image!.props.style).toEqual(expect.objectContaining({
        position: 'absolute',
        width: '100%',
        transform: 'scale(1.2)',
      }));
    });

    it('renders an empty placeholder when no image is provided', () => {
      const element = new AppIcon({ themeColor: '#abcdef' }).render();

      expect(element.props.style).toEqual(expect.objectContaining({
        width: 30,
        height: 30,
        backgroundColor: '#abcdef',
      }));

      const placeholder = renderChildren(element).find(child => child.type === 'span');
      expect(placeholder).toBeDefined();
    });
  });

  describe('TrafficLights', () => {
    it('renders close, minimize, and expand controls with their callbacks', () => {
      const handleClose = jest.fn();
      const handleMinimize = jest.fn();
      const handleExpand = jest.fn();

      const element = new TrafficLights({ focused: true, handleClose, handleMinimize, handleExpand }).render();

      expect(element.props.style).toEqual(expect.objectContaining({
        display: 'flex',
        justifyContent: 'space-between',
        width: 50,
      }));

      const dotElements = renderChildren(element);
      expect(dotElements).toHaveLength(3);

      expect(dotElements[0].props.onClick).toBe(handleClose);
      expect(dotElements[1].props.onClick).toBe(handleMinimize);
      expect(dotElements[2].props.onClick).toBe(handleExpand);

      expect(dotElements[0].props.style).toEqual(expect.objectContaining({
        width: 10,
        height: 10,
        backgroundColor: '#FFF',
        opacity: 0.5,
      }));
    });

    it('uses traffic light colors directly when allHover is enabled', () => {
      const element = new TrafficLights({ focused: false, allHover: true, handleClose: jest.fn(), handleMinimize: jest.fn(), handleExpand: jest.fn() }).render();

      const dotElements = renderChildren(element);

      expect(dotElements.map(dot => dot.props.style.backgroundColor)).toEqual([
        '#FF6059',
        '#FFBD2E',
        '#29C941',
      ]);
      expect(dotElements.map(dot => dot.props.style.opacity)).toEqual([1, 1, 1]);
    });
  });
});
