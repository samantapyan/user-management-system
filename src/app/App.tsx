import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import { UsersScreen } from '@/features/users';

/** One screen: a top bar and content centred with a maximum width. */
export function App() {
  return (
    <Box sx={{ minHeight: '100dvh', bgcolor: 'background.default' }}>
      {/* Transparent, or MUI's own grey bands against the page. AppBar stays for the
          banner landmark it gives a screen reader. */}
      <AppBar position="static" color="transparent" elevation={0}>
        <Toolbar>
          <Typography variant="h1" component="h1">
            Users
          </Typography>
        </Toolbar>
      </AppBar>

      <Container component="main" maxWidth="lg" sx={{ py: 3 }}>
        <UsersScreen />
      </Container>
    </Box>
  );
}
