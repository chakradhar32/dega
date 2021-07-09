import React from 'react';
import { useDispatch } from 'react-redux';
import { addFormat } from '../../actions/formats';
import { useHistory } from 'react-router-dom';
import FormatCreateForm from './components/FormatForm';

function CreateFormat() {
  const history = useHistory();

  const dispatch = useDispatch();
  const onCreate = (values) => {
    dispatch(addFormat(values)).then(() => history.push('/formats'));
  };
  return <FormatCreateForm onCreate={onCreate} />;
}

export default CreateFormat;
