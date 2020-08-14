import React from 'react';
import FormatList from './components/FormatList';
import { Space, Button } from 'antd';
import { Link } from 'react-router-dom';

function Formats() {
  return (
    <Space direction="vertical">
      <Link key="1" to="/formats/create">
        <Button>Create New</Button>
      </Link>
      <FormatList />
    </Space>
  );
}

export default Formats;
