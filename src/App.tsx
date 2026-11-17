import React from 'react';
import { Box } from '@mui/material';
import { TopBar } from '@/components/layout';
import { RulesPage } from '@/components/rules';

const App: React.FC = () => {
  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: 'var(--bg-base)' }}>
      <TopBar />
      <RulesPage />
    </Box>
  );
};

export default App;
