import { initializeApp } from "firebase/app";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { getDatabase, ref, get, push, set, update, remove } from "firebase/database";
import { useAuthState } from 'react-firebase-hooks/auth';
import { getRandomColor } from '../homepage/color';

const firebaseConfig = {
  apiKey: "AIzaSyDNfKrmfbCfxtkBOUqPxKnVJyzFZdWWG3g",
  authDomain: "test-app-77345.firebaseapp.com",
  // databaseURL: "https://test-app-77345-default-rtdb.firebaseio.com",
  projectId: "test-app-77345",
  storageBucket: "test-app-77345.appspot.com",
  messagingSenderId: "308323914899",
  appId: "1:308323914899:web:6a6e92b641b7d78d65e966",
  // measurementId: "G-D28T1Q3N8D"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const database = getDatabase(app);

export const checkUserExists = async (email) => {
  const usersRef = ref(database, 'users');
  const snapshot = await get(usersRef);
  const users = snapshot.val();
  for (const userId in users) {
    if (users[userId].email === email) {
      return userId;
    }
  }
  return false;
};

export const createWorkspace = async (title, description, ownerId) => {
  const workspaceRef = ref(database, 'workspaces');
  const newWorkspaceId = push(workspaceRef).key;
  const newWorkspaceData = {
    title: title,
    description: description,
    users: {
      [ownerId]: "owner",
    },
  };
  const promises = [];
  promises.push(set(ref(database, `workspaces/${newWorkspaceId}`), newWorkspaceData));
  promises.push(set(ref(database, `users/${ownerId}/workspaces/${newWorkspaceId}`), "owner"));
  await Promise.all(promises);
  return newWorkspaceId;
};

export const updateWorkspace = async (workspaceId, title, description) => {
  const updates = {};
  if (title) updates['title'] = title;
  if (description) updates['description'] = description;
  await update(ref(database, `workspaces/${workspaceId}`), updates);
};

export const deleteWorkspace = async (workspaceId, userEmails, ownerId) => {
  const promises = [];
  promises.push(remove(ref(database, `users/${ownerId}/workspaces/${workspaceId}`)));
  for (const user of userEmails) {
    promises.push(remove(ref(database, `users/${user.id}/workspaces/${workspaceId}`)));
  }
  promises.push(remove(ref(database, `workspaces/${workspaceId}`)));
  await Promise.all(promises);
};


export const updateUsersInWorkspace = async (workspaceId, userEmails, deletedUserIds) => {
  const promises = [];
  for (const user of userEmails) {
    promises.push(set(ref(database, `workspaces/${workspaceId}/users/${user.id}`), "simple_user"));
  }
  for (const userId of deletedUserIds) {
    promises.push(remove(ref(database, `workspaces/${workspaceId}/users/${userId}`)));
  }

  for (const user of userEmails) {
    promises.push(set(ref(database, `users/${user.id}/workspaces/${workspaceId}`), "simple_user"));
  }
  for (const userId of deletedUserIds) {
    promises.push(remove(ref(database, `users/${userId}/workspaces/${workspaceId}`)));
  }
  await Promise.all(promises);
};

export const getWorkspaces = async (userId) => {
  const snapshot = await get(ref(database, `users/${userId}`));
  const user = snapshot.val();
  const formattedWorkspaces = [];
  try {
    const workspaceIds = Object.keys(user.workspaces);
    const promises = [];
    for (const workspaceId of workspaceIds) {
      promises.push(get(ref(database, `workspaces/${workspaceId}`)));
    }
    const workspaces = await Promise.all(promises);
    for (const workspace of workspaces) {
      const workspaceData = workspace.val();
      const users = workspaceData.users;
      const formattedUsers = [];
      
      for (const usersId in users) {
        if (usersId !== userId) {
          const userRole = users[usersId];
          const userSnapshot = await get(ref(database, `users/${usersId}`));
          const userData = userSnapshot.val();
          const userColor = getRandomColor();
          formattedUsers.push({ email: userData.email, id: usersId, color: userColor, role: userRole });
        }
      }
      formattedWorkspaces.push({ workspaceId: workspace.key, title: workspaceData.title, description: workspaceData.description, users: formattedUsers });
    }
    return formattedWorkspaces;
  } catch(err) {
    return [];
  }
};



export async function getBoards(workspaceId, user) {
  const boardsRef = ref(database, `workspaces/${workspaceId}/boards`);
  const snapshot = await get(boardsRef);
  if (snapshot.exists()) {
    const formattedBoards = [];
    snapshot.forEach((childSnap) => {
        const boardsData = childSnap.val();
        let isAllowed = false;

        if (boardsData.users && boardsData.users[user]) {
          isAllowed = true;
        }

        if (isAllowed === true){
          formattedBoards.push({ boardId: childSnap.key, title: boardsData.title, description: boardsData.description, users: boardsData.users, boardColor: getRandomColor()+"50" })
        }
    });
    return formattedBoards;
  } else {
    return [];
  }
}

// Создание новой доски
export async function createBoard(workspaceId, title, description, users) {
  const boardsRef = ref(database, `workspaces/${workspaceId}/boards`);
  const newBoardRef = push(boardsRef);
  await set(newBoardRef, { title, description, users });
  return newBoardRef.key;
}

// Обновление информации о доске
export async function updateBoard(workspaceId, boardId, title, description) {
  const boardRef = ref(database, `workspaces/${workspaceId}/boards/${boardId}`);
  await update(boardRef, { title, description });
}

// Удаление доски
export async function deleteBoard(workspaceId, boardId) {
  const boardRef = ref(database, `workspaces/${workspaceId}/boards/${boardId}`);
  await remove(boardRef);
}

export const updateUsersInBoard = async (workspaceId, userEmails, deletedUserIds, boardId) => {
  const promises = [];
  for (const user in userEmails) {
    promises.push(set(ref(database, `workspaces/${workspaceId}/boards/${boardId}/users/${user}`), userEmails[user]));
  }
  for (const userId of deletedUserIds) {
    promises.push(remove(ref(database, `workspaces/${workspaceId}/boards/${boardId}/users/${userId}`)));
  }
  await Promise.all(promises);
};

export const getColumns = async (workspaceId, boardId, callback) => {
  const columnsRef = ref(database, `workspaces/${workspaceId}/boards/${boardId}/columns`);
  onValue(columnsRef, (snapshot) => {
    const columnsData = snapshot.val();
    const columns = [];
    for (const columnId in columnsData) {
      columns.push({
        ...columnsData[columnId],
        columnId: columnId,
      });
    }
    callback(columns.sort((a, b) => a.position - b.position));
  });
};

export const createColumn = async (workspaceId, boardId, title) => {
  const columnsRef = ref(database, `workspaces/${workspaceId}/boards/${boardId}/columns`);
  const newColumnId = push(columnsRef).key;
  const newColumnData = {
    title,
    position: 0, //  Задаем начальную позицию
  };
  await set(ref(database, `workspaces/${workspaceId}/boards/${boardId}/columns/${newColumnId}`), newColumnData);
  return newColumnId;
};

export const updateColumnTitle = async (workspaceId, boardId, columnId, title) => {
  await update(ref(database, `workspaces/${workspaceId}/boards/${boardId}/columns/${columnId}`), {
    title,
  });
};

export const deleteColumn = async (workspaceId, boardId, columnId) => {
  await remove(ref(database, `workspaces/${workspaceId}/boards/${boardId}/columns/${columnId}`));
};

export const updateColumnPositions = async (workspaceId, boardId, columnPositions) => {
  //  Обновляем позиции колонок
  const updates = {};
  for (const columnId in columnPositions) {
    updates[`workspaces/${workspaceId}/boards/${boardId}/columns/${columnId}/position`] = columnPositions[columnId];
  }
  await update(database, updates);
};