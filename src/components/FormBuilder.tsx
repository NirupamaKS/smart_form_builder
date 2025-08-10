import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store';
import { addField, updateField, deleteField, reorderFields, saveForm, setCurrentForm } from '../store/formSlice';
import { v4 as uuidv4 } from 'uuid';
import {
  Box, Button, TextField, Select, MenuItem, FormControl, InputLabel, Switch, FormControlLabel,
  Typography, IconButton, List, ListItem, Grid, Snackbar, Checkbox, FormGroup, Chip
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import DragHandleIcon from '@mui/icons-material/DragHandle';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

const FormBuilder = () => {
  const dispatch = useDispatch();
  const currentForm = useSelector((state: RootState) => state.form.currentForm);
  const [formName, setFormName] = useState('');
  const [newField, setNewField] = useState({
    type: 'text' as 'text' | 'number' | 'textarea' | 'select' | 'radio' | 'checkbox' | 'date',
    label: '',
    required: false,
    defaultValue: '',
    validationRules: { notEmpty: false, minLength: '', maxLength: '', emailFormat: false, passwordRule: false },
    options: [] as string[],
    derived: undefined as { parentFields: string[]; formula: string } | undefined,
  });
  const [optionInput, setOptionInput] = useState(''); // For select/radio options
  const [isDerived, setIsDerived] = useState(false); // Toggle for derived field
  const [parentFields, setParentFields] = useState<string[]>([]); // Selected parent fields
  const [formula, setFormula] = useState(''); // Formula input
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  // Initialize currentForm
  useEffect(() => {
    if (!currentForm) {
      dispatch(setCurrentForm({
        id: uuidv4(),
        name: '',
        createdAt: new Date().toISOString(),
        fields: [],
      }));
    }
  }, [currentForm, dispatch]);

  const handleAddField = () => {
    if (!newField.label) {
      setSnackbarMessage('Please provide a field label.');
      setSnackbarOpen(true);
      return;
    }
    if (['select', 'radio'].includes(newField.type) && !newField.options.length) {
      setSnackbarMessage('Please add at least one option for select or radio fields.');
      setSnackbarOpen(true);
      return;
    }
    if (isDerived && (!parentFields.length || !formula)) {
      setSnackbarMessage('Please select parent fields and provide a formula for derived fields.');
      setSnackbarOpen(true);
      return;
    }
    const field = {
      ...newField,
      id: uuidv4(),
      validationRules: {
        notEmpty: newField.validationRules.notEmpty,
        minLength: newField.validationRules.minLength ? parseInt(newField.validationRules.minLength) : undefined,
        maxLength: newField.validationRules.maxLength ? parseInt(newField.validationRules.maxLength) : undefined,
        emailFormat: newField.validationRules.emailFormat,
        passwordRule: newField.validationRules.passwordRule,
      },
      derived: isDerived ? { parentFields, formula } : undefined,
    };
    dispatch(addField(field));
    setNewField({
      type: 'text',
      label: '',
      required: false,
      defaultValue: '',
      validationRules: { notEmpty: false, minLength: '', maxLength: '', emailFormat: false, passwordRule: false },
      options: [],
      derived: undefined,
    });
    setOptionInput('');
    setIsDerived(false);
    setParentFields([]);
    setFormula('');
    setSnackbarMessage('Field added successfully!');
    setSnackbarOpen(true);
  };

  const handleAddOption = () => {
    if (optionInput.trim()) {
      setNewField({ ...newField, options: [...newField.options, optionInput.trim()] });
      setOptionInput('');
    }
  };

  const handleDeleteOption = (option: string) => {
    setNewField({ ...newField, options: newField.options.filter(opt => opt !== option) });
  };

  const handleSaveForm = () => {
    if (!currentForm) {
      setSnackbarMessage('No form initialized.');
      setSnackbarOpen(true);
      return;
    }
    if (!formName) {
      setSnackbarMessage('Please provide a form name.');
      setSnackbarOpen(true);
      return;
    }
    if (!currentForm.fields.length) {
      setSnackbarMessage('Please add at least one field.');
      setSnackbarOpen(true);
      return;
    }
    dispatch(saveForm({ ...currentForm, name: formName }));
    setFormName('');
    dispatch(setCurrentForm({
      id: uuidv4(),
      name: '',
      createdAt: new Date().toISOString(),
      fields: [],
    }));
    setSnackbarMessage('Form saved successfully!');
    setSnackbarOpen(true);
  };

  const onDragEnd = (result: any) => {
    if (!result.destination || !currentForm) return;
    const items = Array.from(currentForm.fields);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    dispatch(reorderFields(items));
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4">Form Builder</Typography>
      <TextField
        label="Form Name"
        value={formName}
        onChange={(e) => setFormName(e.target.value)}
        fullWidth
        margin="normal"
      />
      <Box sx={{ my: 2 }}>
        <FormControl fullWidth margin="normal">
          <InputLabel>Field Type</InputLabel>
          <Select
            value={newField.type}
            onChange={(e) => setNewField({ ...newField, type: e.target.value as any })}
          >
            <MenuItem value="text">Text</MenuItem>
            <MenuItem value="number">Number</MenuItem>
            <MenuItem value="textarea">Textarea</MenuItem>
            <MenuItem value="select">Select</MenuItem>
            <MenuItem value="radio">Radio</MenuItem>
            <MenuItem value="checkbox">Checkbox</MenuItem>
            <MenuItem value="date">Date</MenuItem>
          </Select>
        </FormControl>
        <TextField
          label="Label"
          value={newField.label}
          onChange={(e) => setNewField({ ...newField, label: e.target.value })}
          fullWidth
          margin="normal"
        />
        <FormControlLabel
          control={<Switch checked={newField.required} onChange={(e) => setNewField({ ...newField, required: e.target.checked })} />}
          label="Required"
        />
        <TextField
          label="Default Value"
          value={newField.defaultValue}
          onChange={(e) => setNewField({ ...newField, defaultValue: e.target.value })}
          fullWidth
          margin="normal"
          disabled={isDerived}
        />
        <Box sx={{ my: 2 }}>
          <Typography variant="subtitle1">Validation Rules</Typography>
          <FormGroup>
            <FormControlLabel
              control={<Checkbox checked={newField.validationRules.notEmpty} onChange={(e) => setNewField({ ...newField, validationRules: { ...newField.validationRules, notEmpty: e.target.checked } })} />}
              label="Not Empty"
            />
            {['text', 'textarea'].includes(newField.type) && (
              <>
                <TextField
                  label="Minimum Length"
                  type="number"
                  value={newField.validationRules.minLength}
                  onChange={(e) => setNewField({ ...newField, validationRules: { ...newField.validationRules, minLength: e.target.value } })}
                  fullWidth
                  margin="normal"
                />
                <TextField
                  label="Maximum Length"
                  type="number"
                  value={newField.validationRules.maxLength}
                  onChange={(e) => setNewField({ ...newField, validationRules: { ...newField.validationRules, maxLength: e.target.value } })}
                  fullWidth
                  margin="normal"
                />
              </>
            )}
            {newField.type === 'text' && (
              <>
                <FormControlLabel
                  control={<Checkbox checked={newField.validationRules.emailFormat} onChange={(e) => setNewField({ ...newField, validationRules: { ...newField.validationRules, emailFormat: e.target.checked } })} />}
                  label="Email Format"
                />
                <FormControlLabel
                  control={<Checkbox checked={newField.validationRules.passwordRule} onChange={(e) => setNewField({ ...newField, validationRules: { ...newField.validationRules, passwordRule: e.target.checked } })} />}
                  label="Password Rule (min 8 chars, 1 number)"
                />
              </>
            )}
          </FormGroup>
        </Box>
        {['select', 'radio'].includes(newField.type) && (
          <Box sx={{ my: 2 }}>
            <Typography variant="subtitle1">Options</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <TextField
                label="Add Option"
                value={optionInput}
                onChange={(e) => setOptionInput(e.target.value)}
                fullWidth
                margin="normal"
              />
              <Button onClick={handleAddOption} variant="outlined">Add</Button>
            </Box>
            <Box sx={{ mt: 1 }}>
              {newField.options.map((option) => (
                <Chip
                  key={option}
                  label={option}
                  onDelete={() => handleDeleteOption(option)}
                  sx={{ m: 0.5 }}
                />
              ))}
            </Box>
          </Box>
        )}
        <Box sx={{ my: 2 }}>
          <FormControlLabel
            control={<Switch checked={isDerived} onChange={(e) => setIsDerived(e.target.checked)} />}
            label="Derived Field"
          />
          {isDerived && (
            <>
              <FormControl fullWidth margin="normal">
                <InputLabel>Parent Fields</InputLabel>
                <Select
                  multiple
                  value={parentFields}
                  onChange={(e) => setParentFields(e.target.value as string[])}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((value) => (
                        <Chip key={value} label={currentForm?.fields.find(f => f.id === value)?.label || value} />
                      ))}
                    </Box>
                  )}
                >
                  {currentForm?.fields.map((field) => (
                    <MenuItem key={field.id} value={field.id}>
                      {field.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField
                label="Formula (e.g., 'field1 + field2' or 'new Date().getFullYear() - year(field1)')"
                value={formula}
                onChange={(e) => setFormula(e.target.value)}
                fullWidth
                margin="normal"
                helperText="Use field IDs or JavaScript expressions."
              />
            </>
          )}
        </Box>
        <Button onClick={handleAddField} variant="contained" sx={{ mt: 2 }}>
          Add Field
        </Button>
      </Box>
      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="fields">
          {(provided) => (
            <List {...provided.droppableProps} ref={provided.innerRef}>
              {currentForm?.fields.map((field, index) => (
                <Draggable key={field.id} draggableId={field.id} index={index}>
                  {(provided) => (
                    <ListItem
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                    >
                      <Grid container spacing={2} alignItems="center">
                        <Grid item>
                          <DragHandleIcon />
                        </Grid>
                        <Grid item xs>
                          <Typography>
                            {field.label} ({field.type})
                            {field.derived && ` [Derived: ${field.derived.formula}]`}
                          </Typography>
                        </Grid>
                        <Grid item>
                          <IconButton onClick={() => dispatch(deleteField(field.id))}>
                            <DeleteIcon />
                          </IconButton>
                        </Grid>
                      </Grid>
                    </ListItem>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </List>
          )}
        </Droppable>
      </DragDropContext>
      <Button
        onClick={handleSaveForm}
        variant="contained"
        disabled={!formName || !currentForm?.fields.length}
      >
        Save Form
      </Button>
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpen(false)}
        message={snackbarMessage}
      />
    </Box>
  );
};

export default FormBuilder;