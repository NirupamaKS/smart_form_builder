import { Routes, Route } from 'react-router-dom';
import FormBuilder from './components/FormBuilder';
import FormPreview from './components/FormPreview';
import MyForms from './components/MyForms';
import { Container } from '@mui/material';

function App() {
  return (
    <Container maxWidth="lg">
      <Routes>
        <Route path="/create" element={<FormBuilder />} />
        <Route path="/preview" element={<FormPreview />} />
        <Route path="/myforms" element={<MyForms />} />
        <Route path="/" element={<MyForms />} />
      </Routes>
    </Container>
  );
}

export default App;