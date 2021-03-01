import React from 'react';
import { useHistory } from 'react-router-dom';
import { BrowserRouter as Router, Link } from 'react-router-dom';
import { useDispatch, Provider, useSelector } from 'react-redux';
import { Form } from 'antd';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { mount } from 'enzyme';
import { act } from '@testing-library/react';

import '../../matchMedia.mock';
import EditMedium from './EditMedium';
import * as actions from '../../actions/media';

const middlewares = [thunk];
const mockStore = configureMockStore(middlewares);

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useDispatch: jest.fn(),
  useSelector: jest.fn(),
}));

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useHistory: jest.fn(),
  useParams: jest.fn().mockReturnValue({ id: '1' }),
}));

jest.mock('../../actions/media', () => ({
  addMedium: jest.fn(),
  getMedium: jest.fn(),
  updateMedium: jest.fn(),
}));

describe('Media edit component', () => {
  let store;
  let mockedDispatch;

  describe('snapshot testing', () => {
    beforeEach(() => {
      store = mockStore({
        media: {
          req: [
            {
              data: [1],
              query: {
                page: 1,
              },
              total: 1,
            },
          ],
          details: {
            '1': {
              id: 1,
              name: 'name',
              url: 'some-url',
              file_size: 'file_size',
              caption: 'caption',
              description: 'description',
            },
          },
          loading: true,
        },
      });
      store.dispatch = jest.fn(() => ({}));
      mockedDispatch = jest.fn();
      useDispatch.mockReturnValue(mockedDispatch);
    });
    it('should render the component', () => {
      useSelector.mockReturnValueOnce({
        media: {
          id: 1,
          name: 'name',
          url: 'some-url',
          file_size: 'file_size',
          caption: 'caption',
          description: 'description',
        },
        loading: false,
      });
      const tree = mount(
        <Provider store={store}>
          <Router>
            <EditMedium />
          </Router>
        </Provider>,
      );
      expect(tree).toMatchSnapshot();
    });
    it('should match component with empty data', () => {
      useSelector.mockReturnValueOnce({
        media: {},
        loading: false,
      });
      const tree = mount(
        <Provider store={store}>
          <Router>
            <EditMedium />
          </Router>
        </Provider>,
      );
      expect(tree).toMatchSnapshot();
    });
    it('should match skeleton while loading', () => {
      useSelector.mockReturnValueOnce({
        media: {},
        loading: true,
      });
      const tree = mount(
        <Provider store={store}>
          <EditMedium />
        </Provider>,
      );
      expect(tree).toMatchSnapshot();
    });
  });
  describe('component testing', () => {
    let wrapper;
    afterEach(() => {
      wrapper.unmount();
    });
    it('should call get action', () => {
      useSelector.mockReturnValueOnce({ media: null, loading: true });
      actions.getMedium.mockReset();
      act(() => {
        wrapper = mount(
          <Provider store={store}>
            <EditMedium />
          </Provider>,
        );
      });
      expect(actions.getMedium).toHaveBeenCalledWith('1');
    });
    it('should display RecordNotFound when media not found', () => {
      useSelector.mockReturnValueOnce({ media: null, loading: false });
      actions.getMedium.mockReset();
      act(() => {
        wrapper = mount(
          <Provider store={store}>
            <EditMedium />
          </Provider>,
        );
      });
      expect(actions.getMedium).toHaveBeenCalledWith('1');
      expect(wrapper.find('RecordNotFound').length).toBe(1);
    });
    it('should call updateMedia', () => {
      useSelector.mockReturnValueOnce({ media: {}, loading: false });
      actions.updateMedium.mockReset();
      const push = jest.fn();
      useHistory.mockReturnValueOnce({ push });
      act(() => {
        wrapper = mount(
          <Provider store={store}>
            <Router>
              <EditMedium />
            </Router>
          </Provider>,
        );
      });
      wrapper.find(Form).props().onFinish({ test: 'test' });
      expect(actions.updateMedium).toHaveBeenCalledWith({ test: 'test' });
    });
  });
});
