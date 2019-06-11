import React from 'react';

import SwaggerUI from 'swagger-ui-react';
import 'swagger-ui-react/swagger-ui.css';
import './App.css';

import spec from './resources/spec.json';

function App() {
  return (
    <div>
      <SwaggerUI spec={spec} />
    </div>
  );
}

export default App;
