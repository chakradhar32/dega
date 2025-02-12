import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { useDispatch, Provider } from 'react-redux';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { act } from 'react-dom/test-utils';

import '../../matchMedia.mock';
import Pages from './index';
import FormatNotFound from '../../components/ErrorsAndImage/RecordNotFound';
import { shallow, mount } from 'enzyme';
import { getPages } from '../../actions/pages';

const middlewares = [thunk];
const mockStore = configureMockStore(middlewares);

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useDispatch: jest.fn(),
}));

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useHistory: () => ({
    push: jest.fn(),
  }),
}));

jest.mock('../../actions/pages', () => ({
  getPages: jest.fn(),
  addPage: jest.fn(),
}));
const formats = {
  article: { id: 1, name: 'article', slug: 'article' },
  factcheck: { id: 2, name: 'factcheck', slug: 'fact-check' },
  loading: false,
};
let state = {
  pages: {
    req: [],
    details: {},
    loading: true,
  },
  authors: {
    req: [],
    details: {},
    loading: true,
  },
  tags: {
    req: [],
    details: {},
    loading: true,
  },
  categories: {
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
    orgs: [{ id: 1, organazation: 'Organization 1', spaces: [11] }],
    details: {
      11: { id: 11, name: 'Space 11' },
    },
    loading: false,
    selected: 11,
  },
  sidebar: {
    collapsed: false,
  },
};
describe('Page component', () => {
  let store;
  let mockedDispatch;

  beforeEach(() => {
    store = mockStore(state);
    store.dispatch = jest.fn(() => ({}));
    mockedDispatch = jest.fn();
    useDispatch.mockReturnValue(mockedDispatch);
  });
  describe('snapshot testing', () => {
    it('should render the component', () => {
      const tree = mount(
        <Provider store={store}>
          <Router>
            <Pages permission={{ actions: ['create'] }} formats={formats} />
          </Router>
        </Provider>,
      );
      expect(tree).toMatchSnapshot();
    });
    it('should render the component with data', () => {
      const store2 = mockStore({
        pages: {
          req: [
            {
              data: [1],
              query: {},
              total: 1,
            },
          ],
          details: {
            1: {
              id: 1,
              title: 'Page-1',
              slug: 'page-1',
              tag_line: 'tag_line',
              medium_id: 1,
              format_id: 1,
            },
          },
          loading: false,
        },
        spaces: {
          orgs: [{ id: 1, organazation: 'Organization 1', spaces: [11] }],
          details: {
            11: { id: 11, name: 'Space 11' },
          },
          loading: false,
          selected: 11,
        },
        sidebar: {
          collapsed: false,
        },
      });
      const tree = shallow(
        <Provider store={store2}>
          <Router>
            <Pages permission={{ actions: ['create'] }} formats={formats} />
          </Router>
        </Provider>,
      );
      expect(tree).toMatchSnapshot();
      expect(getPages).toHaveBeenCalledWith({});
    });
    it('should display FormatNotFound if format not found', () => {
      const tree = mount(
        <Provider store={store}>
          <Router>
            <Pages
              permission={{ actions: ['create'] }}
              formats={{
                loading: false,
              }}
            />
          </Router>
        </Provider>,
      );
      expect(tree.find(FormatNotFound).length).toBe(1);
    });
  });
  describe('component testing', () => {
    beforeEach(() => {
      jest.clearAllMocks();
      mockedDispatch = jest.fn(() => new Promise((resolve) => resolve(true)));
      useDispatch.mockReturnValue(mockedDispatch);
    });
    it('should handle url search params', () => {
      let wrapper;
      window.history.pushState({}, '', '/pages?limit=20&page=1&q=desc&author=1');
      const state2 = { ...state };
      state2.pages = {
        req: [
          {
            data: [1],
            query: {
              page: 1,
              limit: 20,
              q: 'desc',
              author: [1],
            },
            total: 1,
          },
        ],
        details: {
          1: {
            id: 1,
            title: 'Page-1',
            slug: 'page-1',
            tag_line: 'tag_line',
            medium_id: 1,
            format_id: 1,
            author_id: 1,
            categories: [1],
            tags: [1],
          },
        },
        loading: false,
      };
      state2.tags = {
        req: [
          {
            data: [1],
            query: {
              page: 1,
              limit: 20,
            },
            total: 1,
          },
        ],
        details: {
          1: {
            id: 1,
            name: 'Tag 1',
          },
        },
        loading: false,
      };
      state2.categories = {
        req: [
          {
            data: [1],
            query: {
              page: 1,
              limit: 20,
            },
            total: 1,
          },
        ],
        details: {
          1: {
            id: 1,
            name: 'Category 1',
          },
        },
        loading: false,
      };
      const store2 = mockStore(state2);
      act(() => {
        wrapper = mount(
          <Provider store={store2}>
            <Router>
              <Pages permission={{ actions: ['create'] }} formats={formats} />
            </Router>
          </Provider>,
        );
      });
      expect(getPages).toHaveBeenCalledWith({ page: 1, limit: 20, q: 'desc', author: [1] });
    });
    it('should submit filters', () => {
      store = mockStore({
        pages: {
          req: [
            {
              data: [1],
              query: {
                page: 1,
                limit: 20,
              },
              total: 1,
            },
          ],
          details: {
            1: {
              id: 1,
              title: 'Page-1',
              slug: 'page-1',
              tag_line: 'tag_line',
              medium_id: 1,
              format_id: 1,
            },
          },
          loading: false,
        },
        spaces: {
          orgs: [{ id: 1, organazation: 'Organization 1', spaces: [11] }],
          details: {
            11: { id: 11, name: 'Space 11' },
          },
          loading: false,
          selected: 11,
        },
        authors: {
          req: [],
          details: {},
          loading: false,
        },
        tags: {
          req: [],
          details: {},
          loading: false,
        },
        categories: {
          req: [],
          details: {},
          loading: false,
        },
        sidebar: {
          collapsed: false,
        },
        media: {
          req: [],
          details: {
            id: 1,
            name: 'uppy/english/2020/8/1600852886756_pnggrad16rgb.png',
            slug: 'uppy-english-2020-8-1600852886756-pnggrad16rgb-png',
            type: 'image/png',
            title: 'png',
            description: 'png',
            caption: 'png',
            alt_text: 'png',
            file_size: 3974,
            url: 'http://storage.googleapis.com/sample.png',
          },
          loading: false,
        },
      });
      let wrapper;
      act(() => {
        wrapper = mount(
          <Provider store={store}>
            <Router>
              <Pages permission={{ actions: ['create'] }} formats={formats} />
            </Router>
          </Provider>,
        );
      });
      act(() => {
        const moreFilter = wrapper.find('Button').at(1);
        expect(moreFilter.text()).toBe('More Filters ');
        moreFilter.simulate('click');
      });
      wrapper.update();
      act(() => {
        wrapper
          .find('FormItem')
          .at(0)
          .find('Input')
          .simulate('change', { target: { value: 'Explainer' } });
        wrapper
          .find('FormItem')
          .at(3)
          .find('Select')
          .props()
          .onChange({ target: { value: 'asc' } });
        wrapper
          .find('FormItem')
          .at(2)
          .find('Select')
          .props()
          .onChange({ target: { value: 'all' } });
        wrapper
          .find('FormItem')
          .at(4)
          .find('Selector')
          .at(0)
          .props()
          .onChange({ target: { value: [2] } });
        wrapper
          .find('FormItem')
          .at(5)
          .find('Selector')
          .at(0)
          .props()
          .onChange({ target: { value: [] } });

        const submitButtom = wrapper.find('Button').at(0);
        expect(submitButtom.text()).toBe('Search');
        submitButtom.simulate('submit');
      });
      setTimeout(() => {
        expect(getPages).toHaveBeenCalledWith({
          page: 1,
          limit: 20,
          sort: 'asc',
          format: [1],
          q: 'Explainer',
          tag: [2],
          category: [],
        });
      }, 0);
    });
  });
});
