import { FC } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import './style.css';

import SignIn from './signin/signin';
import SignUp from './signup/signup';
import HomePage from './homepage/homepage';
import BoardsPage from './boards/boards';
import Lists from './lists/lists';

export const App: FC<{ name: string }> = ({ name }) => {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/homepage" element={<HomePage />} />
          <Route path="/:workspaceId/boards" element={<BoardsPage />} />
          <Route path="/:workspaceId/:boardId/lists" element={<Lists />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;
