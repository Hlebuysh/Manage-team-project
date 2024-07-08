import { useState } from 'react';
import { auth } from '../firebase/firebase.js';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { Link as RouterLink } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { Button, TextField, Box, Typography, Link, Alert } from '@mui/material';

const SignIn = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);

  const navigate = useNavigate();

  const handleLogin = async (event) => {
    event.preventDefault();

    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/homepage')
    } catch (error) {
      setError(error.message);
    }
  };

  return (
    <Box
      component="form"
      onSubmit={handleLogin}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        bgcolor: '#f5f5f5',
        p: 1,
      }}
    >
      <TextField
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        margin="normal"
        variant="outlined"
        sx={{ width: 400, bgcolor: 'white' }}
      />
      <TextField
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
        margin="normal"
        variant="outlined"
        sx={{ width: 400, bgcolor: 'white' }}
      />
      <Button 
        type="submit" 
        variant="contained" 
        color="primary" 
        fullWidth 
        sx={{ width: 400, height: 56, mt: 2 }}
      >
        Login
      </Button>
      <Typography variant="body2" sx={{ mt: 2 }}>
        Not registered yet? <Link component={RouterLink} to="/signup">Sign Up</Link>
      </Typography>
      {error && <Alert severity="error" sx={{ mt: 2, width: 300 }}>{error}</Alert>}
    </Box>
  );
};

export default SignIn;
