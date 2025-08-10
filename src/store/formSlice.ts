import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface Field {
  id: string;
  type: 'text' | 'number' | 'textarea' | 'select' | 'radio' | 'checkbox' | 'date';
  label: string;
  required: boolean;
  defaultValue?: string | number | boolean;
  validationRules?: {
    notEmpty?: boolean;
    minLength?: number;
    maxLength?: number;
    emailFormat?: boolean;
    passwordRule?: boolean;
  };
  options?: string[];
  derived?: {
    parentFields: string[];
    formula: string;
  };
}

export interface Form {
  id: string;
  name: string;
  createdAt: string;
  fields: Field[];
}

interface FormState {
  currentForm: Form | null;
  savedForms: Form[];
}

const initialState: FormState = {
  currentForm: null,
  savedForms: JSON.parse(localStorage.getItem('forms') || '[]'),
};

const formSlice = createSlice({
  name: 'form',
  initialState,
  reducers: {
    setCurrentForm: (state, action: PayloadAction<Form | null>) => {
      state.currentForm = action.payload;
    },
    addField: (state, action: PayloadAction<Field>) => {
      if (state.currentForm) {
        state.currentForm.fields.push(action.payload);
      }
    },
    updateField: (state, action: PayloadAction<Field>) => {
      if (state.currentForm) {
        const index = state.currentForm.fields.findIndex(f => f.id === action.payload.id);
        if (index !== -1) {
          state.currentForm.fields[index] = action.payload;
        }
      }
    },
    deleteField: (state, action: PayloadAction<string>) => {
      if (state.currentForm) {
        state.currentForm.fields = state.currentForm.fields.filter(f => f.id !== action.payload);
      }
    },
    reorderFields: (state, action: PayloadAction<Field[]>) => {
      if (state.currentForm) {
        state.currentForm.fields = action.payload;
      }
    },
    saveForm: (state, action: PayloadAction<Form>) => {
      const form = { ...action.payload, createdAt: new Date().toISOString() };
      state.savedForms = [...state.savedForms.filter(f => f.id !== form.id), form];
      localStorage.setItem('forms', JSON.stringify(state.savedForms));
    },
  },
});

export const { setCurrentForm, addField, updateField, deleteField, reorderFields, saveForm } = formSlice.actions;
export default formSlice.reducer;