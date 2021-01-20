import axios from 'axios';
import {
  ADD_FORMAT,
  ADD_FORMATS,
  ADD_FORMATS_REQUEST,
  SET_FORMATS_LOADING,
  RESET_FORMATS,
  FORMATS_API,
} from '../constants/formats';
import { addErrorNotification, addSuccessNotification } from './notifications';
import getError from '../utils/getError';

export const addDefaultFormats = (query) => {
  return (dispatch) => {
    dispatch(loadingFormats());
    return axios
      .post(FORMATS_API + '/default')
      .then((response) => {
        dispatch(addFormats(response.data.nodes));
        dispatch(
          addFormatsRequest({
            data: response.data.nodes.map((item) => item.id),
            query: query,
            total: response.data.total,
          }),
        );
      })
      .catch((error) => {
        dispatch(addErrorNotification(getError(error)));
      })
      .finally(() => dispatch(stopFormatsLoading()));
  };
};

export const getFormats = (query) => {
  return (dispatch) => {
    dispatch(loadingFormats());
    return axios
      .get(FORMATS_API, {
        params: query,
      })
      .then((response) => {
        dispatch(addFormats(response.data.nodes));
        dispatch(
          addFormatsRequest({
            data: response.data.nodes.map((item) => item.id),
            query: query,
            total: response.data.total,
          }),
        );
      })
      .catch((error) => {
        dispatch(addErrorNotification(getError(error)));
      })
      .finally(() => dispatch(stopFormatsLoading()));
  };
};

export const getFormat = (id) => {
  return (dispatch) => {
    dispatch(loadingFormats());
    return axios
      .get(FORMATS_API + '/' + id)
      .then((response) => {
        dispatch(getFormatByID(response.data));
      })
      .catch((error) => {
        dispatch(addErrorNotification(getError(error)));
      })
      .finally(() => dispatch(stopFormatsLoading()));
  };
};

export const addFormat = (data) => {
  return (dispatch) => {
    dispatch(loadingFormats());
    return axios
      .post(FORMATS_API, data)
      .then(() => {
        dispatch(resetFormats());
        dispatch(addSuccessNotification('Format added'));
      })
      .catch((error) => {
        dispatch(addErrorNotification(getError(error)));
      });
  };
};

export const updateFormat = (data) => {
  return (dispatch) => {
    dispatch(loadingFormats());
    return axios
      .put(FORMATS_API + '/' + data.id, data)
      .then((response) => {
        dispatch(getFormatByID(response.data));
        dispatch(addSuccessNotification('Format updated'));
      })
      .catch((error) => {
        dispatch(addErrorNotification(getError(error)));
      })
      .finally(() => dispatch(stopFormatsLoading()));
  };
};

export const deleteFormat = (id) => {
  return (dispatch) => {
    dispatch(loadingFormats());
    return axios
      .delete(FORMATS_API + '/' + id)
      .then(() => {
        dispatch(resetFormats());
        dispatch(addSuccessNotification('Format deleted'));
      })
      .catch((error) => {
        dispatch(addErrorNotification(getError(error)));
      });
  };
};

export const loadingFormats = () => ({
  type: SET_FORMATS_LOADING,
  payload: true,
});

export const stopFormatsLoading = () => ({
  type: SET_FORMATS_LOADING,
  payload: false,
});

export const getFormatByID = (data) => ({
  type: ADD_FORMAT,
  payload: data,
});

export const addFormats = (data) => ({
  type: ADD_FORMATS,
  payload: data,
});

export const addFormatsRequest = (data) => ({
  type: ADD_FORMATS_REQUEST,
  payload: data,
});

export const resetFormats = () => ({
  type: RESET_FORMATS,
});
