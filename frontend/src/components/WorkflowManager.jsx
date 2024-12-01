import React, { useState, useEffect } from 'react';
import { Box, Button, CircularProgress, Typography, Alert, Paper } from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { API_BASE_URL } from '../config';

const WorkflowManager = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [workflowStatus, setWorkflowStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [results, setResults] = useState(null);

  // Poll workflow status if we have an execution ID
  useEffect(() => {
    let intervalId;
    if (workflowStatus?.execution_id && workflowStatus?.status !== 'SUCCESS') {
      intervalId = setInterval(async () => {
        try {
          const response = await fetch(`${API_BASE_URL}/api/workflow_status/${workflowStatus.execution_id}`);
          const data = await response.json();
          
          setWorkflowStatus(data);
          if (data.status === 'SUCCESS' && data.results) {
            setResults(data.results);
            setLoading(false);
          } else if (data.status === 'FAILED') {
            setError('Workflow failed. Please try again.');
            setLoading(false);
          }
        } catch (err) {
          console.error('Error polling workflow status:', err);
        }
      }, 3000); // Poll every 3 seconds
    }
    return () => clearInterval(intervalId);
  }, [workflowStatus?.execution_id, workflowStatus?.status]);

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
      setError(null);
      setResults(null);
    }
  };

  const startWorkflow = async () => {
    if (!selectedFile) {
      setError('Please select an image first');
      return;
    }

    setLoading(true);
    setError(null);
    setResults(null);

    const formData = new FormData();
    formData.append('image', selectedFile);

    try {
      const response = await fetch(`${API_BASE_URL}/api/trigger_workflow`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      
      if (response.ok) {
        setWorkflowStatus(data);
      } else {
        setError(data.error || 'Failed to start workflow');
        setLoading(false);
      }
    } catch (err) {
      setError('Error connecting to server');
      setLoading(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', p: 3 }}>
      <Paper elevation={3} sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>
          Product Detection Workflow
        </Typography>

        <Box sx={{ my: 3 }}>
          <input
            accept="image/*"
            style={{ display: 'none' }}
            id="image-upload"
            type="file"
            onChange={handleFileSelect}
          />
          <label htmlFor="image-upload">
            <Button
              variant="contained"
              component="span"
              startIcon={<CloudUploadIcon />}
              disabled={loading}
            >
              Select Image
            </Button>
          </label>
          {selectedFile && (
            <Typography variant="body2" sx={{ mt: 1 }}>
              Selected: {selectedFile.name}
            </Typography>
          )}
        </Box>

        <Box sx={{ my: 2 }}>
          <Button
            variant="contained"
            color="primary"
            onClick={startWorkflow}
            disabled={!selectedFile || loading}
          >
            {loading ? 'Processing...' : 'Start Detection'}
          </Button>
        </Box>

        {error && (
          <Alert severity="error" sx={{ my: 2 }}>
            {error}
          </Alert>
        )}

        {loading && (
          <Box sx={{ display: 'flex', alignItems: 'center', my: 2 }}>
            <CircularProgress size={24} sx={{ mr: 1 }} />
            <Typography>
              {workflowStatus?.status === 'RUNNING'
                ? 'Processing image...'
                : 'Starting workflow...'}
            </Typography>
          </Box>
        )}

        {results && (
          <Box sx={{ mt: 3 }}>
            <Typography variant="h6" gutterBottom>
              Detection Results
            </Typography>
            {results.map((result, index) => (
              <Paper key={index} sx={{ p: 2, my: 1 }}>
                <Typography variant="subtitle1">
                  Product: {result.product_info.product_name}
                </Typography>
                <img
                  src={result.image_path}
                  alt={`Product ${index + 1}`}
                  style={{ maxWidth: '200px', marginTop: '8px' }}
                />
              </Paper>
            ))}
          </Box>
        )}

        {workflowStatus?.workflow_url && (
          <Typography variant="body2" sx={{ mt: 2 }}>
            View detailed workflow status:{' '}
            <a
              href={workflowStatus.workflow_url}
              target="_blank"
              rel="noopener noreferrer"
            >
              Kestra Dashboard
            </a>
          </Typography>
        )}
      </Paper>
    </Box>
  );
};

export default WorkflowManager;
