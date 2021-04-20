import React from 'react';
import PostForm from './components/PostForm';
import { useDispatch, useSelector } from 'react-redux';
import { addPost } from '../../actions/posts';
import getUserPermission from '../../utils/getUserPermission';
import FormatNotFound from '../../components/ErrorsAndImage/RecordNotFound';

function CreatePost({ formats }) {
  const spaces = useSelector(({ spaces }) => spaces);
  const actions = getUserPermission({ resource: 'posts', action: 'get', spaces });

  const dispatch = useDispatch();
  const onCreate = (values) => {
    dispatch(addPost(values));
  };
  if (!formats.loading && formats.article) {
    return <PostForm onCreate={onCreate} actions={actions} format={formats.article} />;
  }

  return <FormatNotFound status="info" title="Article format not found" link="/formats" />;
}

export default CreatePost;
