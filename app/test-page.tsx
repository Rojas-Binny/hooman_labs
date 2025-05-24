'use client';

import { Container, Typography, Box } from '@mui/material';

export default function TestPage() {
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box>
        <Typography variant="h3" component="h1" gutterBottom>
          Test Page - Dashboard Loading
        </Typography>
        <Typography variant="h6" color="text.secondary">
          If you can see this, the basic React app is working.
        </Typography>
      </Box>
    </Container>
  );
} 