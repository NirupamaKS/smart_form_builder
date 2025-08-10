import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import {
  Box, TextField, FormControl, InputLabel, Select, MenuItem, FormControlLabel, Checkbox,
  RadioGroup, Radio, Typography, FormHelperText
} from '@mui/material';
import { Field } from '../store/formSlice'; // Import Field type explicitly

const FormPreview = () => {
  const currentForm = useSelector((state: RootState) => state.form.currentForm);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Initialize formData with default values
  useEffect(() => {
    if (currentForm) {
      const initialData: Record<string, any> = {};
      currentForm.fields.forEach(field => {
        initialData[field.id] = field.defaultValue ?? '';
      });
      setFormData(initialData);
      // Validate all fields on initialization
      const initialErrors: Record<string, string> = {};
      currentForm.fields.forEach(field => {
        initialErrors[field.id] = validateField(field, initialData[field.id]);
      });
      setErrors(initialErrors);
    }
  }, [currentForm]);

  // Safely evaluate derived field formulas
  const evaluateFormula = (formula: string, parentValues: Record<string, any>) => {
    try {
      // Replace field IDs with their values in the formula
      let evalFormula = formula;
      Object.keys(parentValues).forEach(fieldId => {
        const value = parentValues[fieldId];
        // Handle date fields for year extraction
        if (evalFormula.includes(`year(${fieldId})`)) {
          const date = value ? new Date(value) : new Date();
          evalFormula = evalFormula.replace(`year(${fieldId})`, date.getFullYear().toString());
        } else {
          evalFormula = evalFormula.replace(fieldId, JSON.stringify(value));
        }
      });
      // Use Function constructor for safe evaluation
      return new Function(`return ${evalFormula}`)();
    } catch (error) {
      console.error('Error evaluating formula:', error);
      return 'Invalid formula';
    }
  };

  // Update derived fields when parent fields change
  useEffect(() => {
    if (currentForm) {
      const updatedData = { ...formData };
      const updatedErrors = { ...errors };
      currentForm.fields.forEach(field => {
        if (field.derived) { // Check if field.derived is defined
          const parentValues: Record<string, any> = {};
          field.derived.parentFields.forEach(parentId => {
            parentValues[parentId] = formData[parentId] ?? '';
          });
          updatedData[field.id] = evaluateFormula(field.derived.formula, parentValues);
          updatedErrors[field.id] = validateField(field, updatedData[field.id]);
        }
      });
      setFormData(updatedData);
      setErrors(updatedErrors);
    }
  }, [formData, currentForm]);

  const validateField = (field: Field, value: any) => {
    // Required validation
    if (field.required && (value === '' || value === undefined || value === null)) {
      return 'Field is required';
    }
    // Skip further validation for derived fields since they're computed
    if (field.derived) {
      return '';
    }
    // Text and textarea validations
    if (['text', 'textarea'].includes(field.type)) {
      if (field.validationRules?.minLength && value && value.length < field.validationRules.minLength) {
        return `Minimum length is ${field.validationRules.minLength} characters`;
      }
      if (field.validationRules?.maxLength && value && value.length > field.validationRules.maxLength) {
        return `Maximum length is ${field.validationRules.maxLength} characters`;
      }
      if (field.validationRules?.emailFormat && value && !/^\S+@\S+\.\S+$/.test(value)) {
        return 'Invalid email format';
      }
      if (field.validationRules?.passwordRule && value && !/^(?=.*\d).{8,}$/.test(value)) {
        return 'Password must be 8+ characters with at least one number';
      }
    }
    return '';
  };

  const handleChange = (fieldId: string, value: any) => {
    setFormData(prev => ({ ...prev, [fieldId]: value }));
    const field = currentForm?.fields.find(f => f.id === fieldId);
    if (field && !field.derived) { // Check if field is not derived
      setErrors(prev => ({ ...prev, [fieldId]: validateField(field, value) }));
    }
  };

  if (!currentForm) return <Typography>No form selected</Typography>;

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4">{currentForm.name || 'Untitled Form'}</Typography>
      {currentForm.fields.map(field => (
        <Box key={field.id} sx={{ my: 2 }}>
          {field.type === 'text' && (
            <TextField
              label={field.label}
              required={field.required}
              value={formData[field.id] ?? ''}
              onChange={(e) => handleChange(field.id, e.target.value)}
              error={!!errors[field.id]}
              helperText={errors[field.id]}
              fullWidth
              disabled={!!field.derived} // Disable if derived is defined
            />
          )}
          {field.type === 'number' && (
            <TextField
              type="number"
              label={field.label}
              required={field.required}
              value={formData[field.id] ?? ''}
              onChange={(e) => handleChange(field.id, parseFloat(e.target.value))}
              error={!!errors[field.id]}
              helperText={errors[field.id]}
              fullWidth
              disabled={!!field.derived}
            />
          )}
          {field.type === 'textarea' && (
            <TextField
              multiline
              rows={4}
              label={field.label}
              required={field.required}
              value={formData[field.id] ?? ''}
              onChange={(e) => handleChange(field.id, e.target.value)}
              error={!!errors[field.id]}
              helperText={errors[field.id]}
              fullWidth
              disabled={!!field.derived}
            />
          )}
          {field.type === 'select' && (
            <FormControl fullWidth required={field.required} error={!!errors[field.id]}>
              <InputLabel>{field.label}</InputLabel>
              <Select
                value={formData[field.id] ?? ''}
                onChange={(e) => handleChange(field.id, e.target.value)}
                disabled={!!field.derived}
              >
                {field.options?.map(option => (
                  <MenuItem key={option} value={option}>{option}</MenuItem>
                ))}
              </Select>
              <FormHelperText>{errors[field.id]}</FormHelperText>
            </FormControl>
          )}
          {field.type === 'radio' && (
            <FormControl component="fieldset" required={field.required} error={!!errors[field.id]}>
              <Typography>{field.label}</Typography>
              <RadioGroup
                value={formData[field.id] ?? ''}
                onChange={(e) => handleChange(field.id, e.target.value)}
              >
                {field.options?.map(option => (
                  <FormControlLabel
                    key={option}
                    value={option}
                    control={<Radio disabled={!!field.derived} />}
                    label={option}
                  />
                ))}
              </RadioGroup>
              <FormHelperText>{errors[field.id]}</FormHelperText>
            </FormControl>
          )}
          {field.type === 'checkbox' && (
            <FormControlLabel
              control={
                <Checkbox
                  checked={formData[field.id] ?? false}
                  onChange={(e) => handleChange(field.id, e.target.checked)}
                  disabled={!!field.derived}
                />
              }
              label={field.label}
              required={field.required}
            />
          )}
          {field.type === 'date' && (
            <TextField
              type="date"
              label={field.label}
              required={field.required}
              value={formData[field.id] ?? ''}
              onChange={(e) => handleChange(field.id, e.target.value)}
              error={!!errors[field.id]}
              helperText={errors[field.id]}
              fullWidth
              InputLabelProps={{ shrink: true }}
              disabled={!!field.derived}
            />
          )}
        </Box>
      ))}
    </Box>
  );
};

export default FormPreview;