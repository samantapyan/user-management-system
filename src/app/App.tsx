import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';

/**
 * The application shell.
 *
 * One screen, a top bar, and content centred with a maximum width. There is no
 * sidebar on purpose: a sidebar promises navigation, and there is exactly one
 * screen here, so it would promise something that does not exist.
 */
export function App() {
  return (
    <Box sx={{ minHeight: '100dvh', bgcolor: 'background.default' }}>
      <AppBar position="static" color="default" elevation={0}>
        <Toolbar>
          <Typography variant="h1" component="h1">
            Users
          </Typography>
        </Toolbar>
      </AppBar>

      <Container component="main" maxWidth="lg" sx={{ py: 3 }}>
        {/* The users feature lands here. */}
      </Container>
    </Box>
  );
}
