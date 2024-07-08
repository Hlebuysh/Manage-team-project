import { useState, useEffect } from 'react';
import { Button, TextField, List, ListItem, ListItemText, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Typography, IconButton, Chip, Box, Grid } from '@mui/material';
import { makeStyles } from '@mui/styles';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import AddIcon from '@mui/icons-material/Add';
import { useAuthState } from 'react-firebase-hooks/auth';
import { useNavigate } from 'react-router-dom';

import { auth, checkUserExists } from '../firebase/firebase.js';
import { getWorkspaces, createWorkspace, updateWorkspace, deleteWorkspace } from '../firebase/firebase.js';
import { updateUsersInWorkspace } from '../firebase/firebase.js';

import { getRandomColor } from './color';



const useStyles = makeStyles({
  root: {
    maxWidth: 600, // Устанавливаем максимальную ширину
    marginLeft: 'auto', // Центрируем контейнер по горизонтали
    marginRight: 'auto', // Центрируем контейнер по горизонтали
  },
});

function HomePage() {
  const classes = useStyles();

  const [groups, setGroups] = useState([]);
  const [open, setOpen] = useState(false);
  const [editIndex, setEditIndex] = useState(null);

  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDescription, setNewGroupDescription] = useState('');
  const [selectedGroup, setSelectedGroup] = useState(null);

  const [newUserEmail, setNewUserEmail] = useState('');
  const [tempUserEmails, setTempUserEmails] = useState([]);
  const [deletedUserIds, setDeletedUserIds] = useState([]);
  const [usersIsChanged, setUsersIsChanged] = useState(false);

  const [user] = useAuthState(auth);
  const navigate = useNavigate();

  useEffect(() => {
    if (selectedGroup !== null) {
      setTempUserEmails([...groups[selectedGroup].users]);
    } else {
      if (groups.length === 0) {
        if (user) {
          getWorkspaces(user.uid).then((workspaces) => {
            if (workspaces) {
              setGroups(workspaces);
            }
          });
        }
      }
      setTempUserEmails([]);
    }
  }, [selectedGroup]);

  const handleOpen = (index = null) => {
    if (index !== null) {
      setEditIndex(index);
      setNewGroupName(groups[index].title);
      setNewGroupDescription(groups[index].description);
    } else {
      if (!user) {
        const shouldRedirect = window.confirm("Необходимо авторизоваться, чтобы создавать рабочие пространства. Перейти на страницу авторизации?");
        if (shouldRedirect) {
          navigate("/"); // Перенаправить пользователя на страницу авторизации
        }
        return;
      }
      setNewGroupName('');
      setNewGroupDescription('');
    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditIndex(null);
    setNewGroupName('');
    setNewGroupDescription('');
    setSelectedGroup(null);
    setNewUserEmail('');
    setTempUserEmails([]);
    setDeletedUserIds([]);
    setUsersIsChanged(false);
  };

  const handleAddOrEditGroup = async () => {
    if (editIndex !== null) {
      // Редактирование существующей группы
      const existingGroupNames = groups.map(group => group.title);
      const index = existingGroupNames.indexOf(newGroupName);
      if (index !== -1 && editIndex !== index) {
        alert("Рабочее пространство с таким названием уже существует.");
        return;
      }
      const newGroups = [...groups];
      newGroups[editIndex] = { workspaceId: groups[editIndex].workspaceId, title: newGroupName, description: newGroupDescription, users: newGroups[editIndex].users };
      setGroups(newGroups);
      await updateWorkspace(newGroups[editIndex].workspaceId, newGroupName, newGroupDescription);
    } else {
      // Создание новой группы
      const existingGroupNames = groups.map(group => group.title);
      if (existingGroupNames.includes(newGroupName)) {
        alert("Рабочее пространство с таким названием уже существует.");
        return;
      }
      const newWorkspaceId = await createWorkspace(newGroupName, newGroupDescription, user.uid);
      setGroups([...groups, { workspaceId: newWorkspaceId, title: newGroupName, description: newGroupDescription, users: [] }]);
    }
    handleClose();
  };
  
  
  const handleDeleteGroup = async (index) => {
    const newGroups = [...groups];
    await deleteWorkspace(groups[index].workspaceId, groups[index].users, user.uid);
    newGroups.splice(index, 1);
    setGroups(newGroups);
  };


  const handleAddUser = async () => {
    if (user.email === newUserEmail) {
      alert("Вы не можете добавить себя в рабочее пространство.");
      return;
    }
  
    const userExistsInWorkspace = tempUserEmails.some(user => user.email === newUserEmail);
    if (userExistsInWorkspace) {
      alert("Пользователь уже добавлен к рабочему пространству.");
      return;
    }
  
    // Проверка существования пользователя в базе данных Firebase
    const userExists = await checkUserExists(newUserEmail);
    if (!userExists) {
      alert("Пользователь не зарегистрирован в системе.");
      return;
    }
  
    setTempUserEmails([...tempUserEmails, { email: newUserEmail, id: userExists, color: getRandomColor(), role: "simple_user"}]);
    setNewUserEmail('');
    setUsersIsChanged(true);
  };

  const handleDeleteUser = (index) => {
    const newEmails = [...tempUserEmails];
    newEmails.splice(index, 1);
    setTempUserEmails(newEmails);
  
    // Сохранение идентификатора удаленного пользователя в отдельном массиве
    setDeletedUserIds([...deletedUserIds, tempUserEmails[index].id]);
    setUsersIsChanged(true);
  };
  

  const handleSaveUsers = async () => {
    if (selectedGroup !== null) {
      const newGroups = [...groups];
      newGroups[selectedGroup].users = tempUserEmails;
      setGroups(newGroups);
      await updateUsersInWorkspace(newGroups[selectedGroup].workspaceId, tempUserEmails, deletedUserIds);
      handleClose();
    }
  };

  const handleWorkspaceClick = (index) => {
    handleClose();
    navigate(`/${groups[index].workspaceId}/boards`, {
      state: {
        workspaceId: groups[index].workspaceId,
        workspaceTitle: groups[index].title,
        workspaceUsers: groups[index].users
      },
    });
  };
  
  return (
    <div className={classes.root}>
      <Button variant="contained" color="primary" onClick={() => handleOpen()}>
        Создать рабочее пространство
      </Button>
      {groups.length === 0 ? (
        <Typography variant="body1">
          У вас пока нет рабочих пространств. <Button color="primary" onClick={() => handleOpen()}>Создать рабочее пространство</Button>
        </Typography>
      ) : (
        <List>
          {groups.map((group, index) => (
            <ListItem key={index} divider onDoubleClick={() => handleWorkspaceClick(index)}>
              <ListItemText primary={group.title} secondary={group.description} />
              <IconButton color="primary" onClick={() => setSelectedGroup(index)}>
                <PersonAddIcon />
              </IconButton>
              <IconButton color="primary" onClick={() => handleOpen(index)}>
                <EditIcon />
              </IconButton>
              <IconButton color="secondary" onClick={() => handleDeleteGroup(index)}>
                <DeleteIcon />
              </IconButton>
            </ListItem>
          ))}
        </List>
      )}
      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>{editIndex === null ? 'Создать новое' : 'Редактировать'} рабочее пространство</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Введите название и описание рабочего пространства.
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            label="Название пространства"
            type="text"
            fullWidth
            value={newGroupName}
            onChange={(event) => setNewGroupName(event.target.value)}
          />
          <TextField
            margin="dense"
            label="Описание пространства"
            type="text"
            fullWidth
            value={newGroupDescription}
            onChange={(event) => setNewGroupDescription(event.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Отменить</Button>
          <Button variant="contained" onClick={handleAddOrEditGroup} disabled={newGroupName === ''}>
            {editIndex === null ? 'Добавить' : 'Сохранить'}
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog open={selectedGroup !== null} onClose={handleClose}>
        <DialogTitle>Управление пользователями</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Добавьте или удалите пользователей для этого рабочего пространства.
          </DialogContentText>
          <Grid container spacing={1} alignItems="center">
            <Grid item xs={10}>
              <TextField
                autoFocus
                margin="dense"
                label="Email пользователя"
                type="email"
                fullWidth
                value={newUserEmail}
                onChange={(event) => setNewUserEmail(event.target.value)}
              />
            </Grid>
            <Grid item xs={2}>
              <IconButton color="primary" onClick={handleAddUser} style={{ height: '56px', width: '56px', alignSelf: 'center' }}>
                <AddIcon />
              </IconButton>
            </Grid>
          </Grid>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', marginTop: '10px' }}>
            {tempUserEmails.map((user, index) => (
              <Chip
                key={index}
                label={user.email}
                style={{ marginRight: '5px', backgroundColor: user.color, color: 'white' }}
                onDelete={() => handleDeleteUser(index)}
              />
            ))}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Закрыть</Button>
          <Button variant="contained" onClick={handleSaveUsers} disabled={usersIsChanged === false}>
            Сохранить
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}

export default HomePage;