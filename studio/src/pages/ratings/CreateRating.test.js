import React from 'react';
import { useHistory } from 'react-router-dom';
import { useDispatch, Provider } from 'react-redux';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { mount } from 'enzyme';
import { act } from '@testing-library/react';

import '../../matchMedia.mock';
import CreateRating from './CreateRating';
import * as actions from '../../actions/ratings';
import RatingForm from './components/RatingForm';

const middlewares = [thunk];
const mockStore = configureMockStore(middlewares);

jest.mock('@editorjs/editorjs');
jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useDispatch: jest.fn(),
}));

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useHistory: jest.fn(),
}));

jest.mock('../../actions/ratings', () => ({
  getRatings: jest.fn(),
  addRating: jest.fn(),
}));

describe('Ratings create component', () => {
  let store;
  let mockedDispatch;

  store = mockStore({
    ratings: {
      req: [],
      details: {},
      loading: true,
    },
    media: {
      req: [],
      details: {},
      loading: true,
    },
    spaces: {
      orgs: [],
      details: {},
      loading: true,
    },
  });
  store.dispatch = jest.fn(() => ({}));
  mockedDispatch = jest.fn(() => Promise.resolve({}));
  useDispatch.mockReturnValue(mockedDispatch);

  describe('snapshot component', () => {
    window.HTMLCanvasElement.prototype.getContext = () => {
      return;
      // return whatever getContext has to return
    };
    it('should render the component', () => {
      const tree = mount(
        <Provider store={store}>
          <CreateRating />
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
    it('should call addRating', (done) => {
      actions.addRating.mockReset();
      const push = jest.fn();
      useHistory.mockReturnValueOnce({ push });
      act(() => {
        wrapper = mount(
          <Provider store={store}>
            <CreateRating />
          </Provider>,
        );
      });
      wrapper.find(RatingForm).props().onCreate({ test: 'test' });
      setTimeout(() => {
        expect(actions.addRating).toHaveBeenCalledWith({ test: 'test' });
        expect(push).toHaveBeenCalledWith('/ratings');
        done();
      }, 0);
    });
  });
});
