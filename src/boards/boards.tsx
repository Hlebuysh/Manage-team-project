import { useState, useEffect } from 'react';
import { Button, TextField, List, ListItem, ListItemText, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Typography, IconButton, Chip, Box, Grid } from '@mui/material';
import { makeStyles } from '@mui/styles';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import { useAuthState } from 'react-firebase-hooks/auth';
import { useNavigate, useLocation } from 'react-router-dom';

import { auth, database } from '../firebase/firebase.js';
import { getBoards, createBoard, updateBoard, deleteBoard, updateUsersInBoard } from '../firebase/firebase.js';

import { getRandomColor } from '../homepage/color';

const useStyles = makeStyles({
  root: {
    marginLeft: 'auto',
    marginRight: 'auto',
  },
});

function BoardsPage() {
  interface User {
      email: string;
      id: string;
      color: string;
      role: string;
  }

  const { workspaceId, workspaceTitle, workspaceUsers } = useLocation().state;
  const classes = useStyles();

  const [boards, setBoards] = useState([]);
  const [open, setOpen] = useState(false);
  const [editIndex, setEditIndex] = useState(null);

  const [newBoardName, setNewBoardName] = useState('');
  const [newBoardDescription, setNewBoardDescription] = useState('');

  const [selectedBoard, setSelectedBoard] = useState(null);

  const [selectedUsers, setSelectedUsers] = useState([]);
  const [tempUsers, setTempUsers] = useState({});
  const [deletedUserIds, setDeletedUserIds] = useState([]);


  const [user] = useAuthState(auth);
  const navigate = useNavigate();

  useEffect(() => {
    if (workspaceId) {
      getBoards(workspaceId, user.uid).then((_boards) => {
        if (_boards) {
          setBoards(_boards);
        }
      });
    }
  }, [workspaceId]);

  const handleOpen = (index = null) => {
    if (index !== null) {
      setEditIndex(index);
      setNewBoardName(boards[index].title);
      setNewBoardDescription(boards[index].description);
    } else {
      setNewBoardName('');
      setNewBoardDescription('');
    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditIndex(null);
    setNewBoardName('');
    setNewBoardDescription('');
    setSelectedBoard(null);
    setSelectedUsers([]);
    setTempUsers([]);
    setDeletedUserIds([]);
  };

  const handleAddOrEditBoard = async () => {
    if (editIndex !== null) {
      // Редактирование существующей доски
      const existingBoardNames = boards.map(board => board.title);
      const index = existingBoardNames.indexOf(newBoardName);
      if (index !== -1 && editIndex !== index) {
        alert('Доска с таким названием уже существует.');
        return;
      }
      const newBoards = [...boards];
      newBoards[editIndex] = { boardId: boards[editIndex].boardId, title: newBoardName, description: newBoardDescription, users: boards[editIndex].users, boardColor: getRandomColor()+"50" };
      setBoards(newBoards);
      await updateBoard(workspaceId, boards[editIndex].boardId, newBoardName, newBoardDescription);
    } else {
      // Создание новой доски
      const existingBoardNames = boards.map(board => board.title);
      if (existingBoardNames.includes(newBoardName)) {
        alert('Доска с таким названием уже существует.');
        return;
      }
      let firstUsers = {};

      // **Поиск пользователя с ролью "owner"**
      const ownerUser = workspaceUsers.find((user) => user.role === 'owner');

      if (ownerUser) {
        // **Добавление пользователя с ролью "owner" и текущего пользователя**
        firstUsers[ownerUser.id] = 'workspace_owner';
        firstUsers[user.uid] = 'board_owner';
      } else {
        // **Текущий пользователь становится "workspace_owner"**
        firstUsers[user.uid] = 'workspace_owner';
      }
      const newBoardId = await createBoard(workspaceId, newBoardName, newBoardDescription, firstUsers);
      setBoards([...boards, { boardId: newBoardId, title: newBoardName, description: newBoardDescription, users:  firstUsers, boardColor: getRandomColor()+"50"}]);
    }
    handleClose();
  };

  const handleDeleteBoard = async (index) => {
    const newBoards = [...boards];
    await deleteBoard(workspaceId, boards[index].boardId);
    newBoards.splice(index, 1);
    setBoards(newBoards);
  };

  const handleAddUserToBoard = (user) => {
    setSelectedUsers([...selectedUsers, user]);
    const newUsers = { ...tempUsers };
    newUsers[user.id] = "simple_user";
    setTempUsers(newUsers);
  };
  
  const handleRemoveUserFromBoard = (user) => {
    setDeletedUserIds([...deletedUserIds, user.id])
    setSelectedUsers(selectedUsers.filter((u) => u.email !== user.email));
    const newUsers = { ...tempUsers };
    delete newUsers[user.id];
    setTempUsers(newUsers);
  };

  const handleSaveUsers = async () => {
    if (selectedBoard !== null){
      const newBoards = [...boards];
      newBoards[selectedBoard].users = tempUsers;
      setBoards(newBoards);
      await updateUsersInBoard(workspaceId, tempUsers, deletedUserIds, boards[selectedBoard].boardId);
      handleClose();

    }
  };

  const handleFindUsers = (index) => {
    setSelectedBoard(index);
    let _selectedUsers = [];
    for (const userId in boards[index].users) {
      if (userId !== user.uid && boards[index].users[userId] !== "workspace_owner"){
        const selectedUser = workspaceUsers.find((u) => u.id === userId);
        _selectedUsers = _selectedUsers.concat(selectedUser);
      }
    }
    setSelectedUsers([..._selectedUsers]);
    setTempUsers({...boards[index].users});
  }
  
  const handleBoardClick = (index) => {
    handleClose();
    navigate(`/${workspaceId}/${boards[index].boardId}/lists`, {
      state: {
        workspaceId: workspaceId,
        boardId: boards[index].boardId,
        boardTitle: boards[index].title,
        boardUsers: boards[index].users
      },
    });
  };

  return (
    <div className={classes.root}>
      <Typography variant="h4" align="center">
        Доски в рабочем пространстве "{workspaceTitle}"
      </Typography>
      <Box sx={{ display: "flex", flexWrap: "wrap" }}>
        {boards.map((board, index) => (
          <Box onClick={() => handleBoardClick(index)}
            key={index}
            sx={{
              borderRadius: 4,
              boxShadow: 1,
              backgroundColor: boards[index].boardColor,
              margin: 1,
              padding: 4,
              width: 300,
              height: 200,
              position: "relative",
              "&:hover": {
                "& .MuiIconButton-root": {
                  display: "block",
                },
              },
            }}
          >
            <Typography variant="h6" fontWeight="bold">{board.title}</Typography>
            <Typography variant="body1">{board.description}</Typography>
            <div style={{ position: "absolute", top: "50%", right: 8, transform: "translateY(-50%)" }}>
              <IconButton
                color="primary"
                onClick={() => handleFindUsers(index)}
                sx={{ display: "none" }}
              >
                <PersonAddIcon />
              </IconButton>
              <IconButton
                color="primary"
                onClick={() => handleOpen(index)}
                sx={{ display: "none" }}
              >
                <EditIcon />
              </IconButton>
              <IconButton
                color="secondary"
                onClick={() => handleDeleteBoard(index)}
                sx={{ display: "none" }}
              >
                <DeleteIcon />
              </IconButton>
            </div>
          </Box>
        ))}
        <Box
          sx={{
            borderRadius: 4,
            backgroundColor: "#f5f5f5",
            margin: 1,
            padding: 2,
            width: 300,
            height: 200,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            cursor: "pointer",
            "&:hover": {
              backgroundColor: "#ddd",
            },
          }}
          onClick={ () => handleOpen() }
        >
          <Typography variant="h5">+</Typography>
        </Box>
      </Box>
      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>{editIndex === null ? 'Создать новую' : 'Редактировать'} доску</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Введите название и описание доски.
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            label="Название доски"
            type="text"
            fullWidth
            value={newBoardName}
            onChange={(event) => setNewBoardName(event.target.value)}
          />
          <TextField
            margin="dense"
            label="Описание доски"
            type="text"
            fullWidth
            value={newBoardDescription}
            onChange={(event) => setNewBoardDescription(event.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Отменить</Button>
          <Button variant="contained" onClick={handleAddOrEditBoard} disabled={newBoardName === ''}>
            {editIndex === null ? 'Добавить' : 'Сохранить'}
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog open={selectedBoard !== null} onClose={handleClose}>
        <DialogTitle>Добавить пользователей</DialogTitle>
        <DialogContent>
          <List>
            {workspaceUsers && (workspaceUsers as User[]).filter(
              (user) => !selectedUsers.find((selectedUser) => selectedUser.email === user.email)
            ).map((user) => (
              <ListItem
                divider
                key={user.email}
                onDoubleClick={() => handleAddUserToBoard(user)}
              >
                <ListItemText primary={user.email} />
              </ListItem>
            ))}
          </List>
          <Box sx={{ flexWrap: 'wrap' }}>
            {selectedUsers.map((user) => (
              <Chip
                key={user.email}
                label={user.email}
                sx={{
                  backgroundColor: user.color,
                  margin: '5px',
                }}
                onDelete={() => handleRemoveUserFromBoard(user)}
              />
            ))}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Отмена</Button>
          <Button variant="contained" onClick={handleSaveUsers}>Сохранить</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}

export default BoardsPage;