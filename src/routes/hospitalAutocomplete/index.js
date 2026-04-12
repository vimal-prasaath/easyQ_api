import express from 'express';
import { hospitalAutocomplete, saveHospitalSuggestion, listHospitalSuggestions } from '../../controller/hospitalAutocompleteController.js';

const router = express.Router();

// Open API - Hospital Autocomplete
// POST /api/hospital/autocomplete
router.post('/autocomplete', hospitalAutocomplete);

// Open API - Save Hospital Suggestion
// POST /api/hospital/suggest
router.post('/suggest', saveHospitalSuggestion);

// Open API - List Hospital Suggestions with User Details
// GET /api/hospital/suggestions
router.get('/suggestions', listHospitalSuggestions);

export default router;


