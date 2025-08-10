import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store';
import { setCurrentForm, Form } from '../store/formSlice';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, List, ListItem, ListItemText, Button } from '@mui/material';
import { v4 as uuidv4 } from 'uuid';

const MyForms = () => {
  const savedForms = useSelector((state: RootState) => state.form.savedForms);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handlePreview = (form: Form) => {
    dispatch(setCurrentForm(form));
    navigate('/preview');
  };

  const handleCreate = () => {
    dispatch(setCurrentForm({
      id: uuidv4(),
      name: '',
      createdAt: new Date().toISOString(),
      fields: [],
    }));
    navigate('/create');
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4">My Forms</Typography>
        <Button variant="contained" color="primary" onClick={handleCreate}>
          Create New Form
        </Button>
      </Box>
      {savedForms.length === 0 ? (
        <Typography sx={{ mt: 2 }}>No forms available. Create a form using the button above.</Typography>
      ) : (
        <List>
          {savedForms.map(form => (
            <ListItem
              key={form.id}
              secondaryAction={
                <Button variant="contained" onClick={() => handlePreview(form)}>
                  Preview
                </Button>
              }
            >
              <ListItemText
                primary={form.name || 'Untitled Form'}
                secondary={`Created: ${new Date(form.createdAt).toLocaleDateString()}`}
              />
            </ListItem>
          ))}
        </List>
      )}
    </Box>
  );
};

export default MyForms;