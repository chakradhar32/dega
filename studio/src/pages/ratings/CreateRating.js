import React from 'react';
import RatingCreateForm from './components/RatingForm';
import { useDispatch } from 'react-redux';
import { createRating } from '../../actions/ratings';
import { useHistory } from 'react-router-dom';

function CreateRating() {
  const history = useHistory();

  const dispatch = useDispatch();
  const onCreate = (values) => {
    dispatch(createRating(values)).then(() => history.push('/ratings'));
  };
  return <RatingCreateForm onCreate={onCreate} />;
}

export default CreateRating;
