import { useState } from 'react';
import { auth, database } from '../firebase/firebase.js';
import { ref, set } from 'firebase/database';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { Link as RouterLink } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { Button, TextField, Box, Typography, Link, Alert } from '@mui/material';

function SignUp() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [error, setError] = useState(null);

  const navigate = useNavigate();

  const handleRegister = async (event) => {
    event.preventDefault();

    try {
      const user = await createUserWithEmailAndPassword(auth, email, password);
      await set(ref(database, 'users/' + user.user.uid), {
        email: email,
        nickname: nickname
      });


      navigate('/');
    } catch (error) {
      setError(error.message);
    }
  };

  return (
    <Box
      component="form"
      onSubmit={handleRegister}
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
        type="text"
        value={nickname}
        onChange={(e) => setNickname(e.target.value)}
        placeholder="Nickname"
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
        Register
      </Button>
      <Typography variant="body2" sx={{ mt: 2 }}>
        Already have an account? <Link component={RouterLink} to="/">Sign In</Link>
      </Typography>
      {error && <Alert severity="error" sx={{ mt: 2, width: 300 }}>{error}</Alert>}
    </Box>
  );
}

export default SignUp;
