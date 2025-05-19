import React, { useEffect, useState } from 'react';
import './App.css';

function App() {
  // example Api call
  const [msg, setMsg] = useState('');

  useEffect(() => {
    fetch('http://localhost:8000/api/hello')
      .then(res => res.json())
      .then(data => setMsg(data.message));
  }, []);
  return <div>{msg}</div>;
}

export default App;
