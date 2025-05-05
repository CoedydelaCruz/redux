// App.js - Complete Code with Add User Functionality
import React, { useEffect, useState } from 'react';
import { Provider, useDispatch, useSelector } from 'react-redux';
import { configureStore, createSlice, createAsyncThunk } from '@reduxjs/toolkit';

// Simulate API delay for demonstration purposes
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Create async thunks
export const fetchUsers = createAsyncThunk(
  'users/fetchUsers',
  async () => {
    // Adding artificial delay to show loading spinner
    await delay(1500);
    const response = await fetch('https://jsonplaceholder.typicode.com/users');
    const data = await response.json();
    return data;
  }
);

export const deleteUser = createAsyncThunk(
  'users/deleteUser',
  async (userId) => {
    // Adding artificial delay to show loading spinner
    await delay(800);
    await fetch(`https://jsonplaceholder.typicode.com/users/${userId}`, {
      method: 'DELETE',
    });
    return userId;
  }
);

export const addUser = createAsyncThunk(
  'users/addUser',
  async (userData) => {
    // Adding artificial delay to show loading spinner
    await delay(1000);
    const response = await fetch('https://jsonplaceholder.typicode.com/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });
    const data = await response.json();
    // For JSONPlaceholder API, it returns the data with id 11 always
    // So we're assigning a unique ID on the client side
    return { 
      ...data, 
      id: Math.floor(Math.random() * 10000) + 100 // Create a random ID
    };
  }
);

// Create users slice
const usersSlice = createSlice({
  name: 'users',
  initialState: {
    list: [],
    loading: false,
    error: null,
    deleteLoading: {},
    addLoading: false,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Handle fetchUsers
      .addCase(fetchUsers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload;
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      // Handle deleteUser
      .addCase(deleteUser.pending, (state, action) => {
        // Set loading state for specific user ID
        state.deleteLoading[action.meta.arg] = true;
      })
      .addCase(deleteUser.fulfilled, (state, action) => {
        // Remove loading state for this user
        state.deleteLoading[action.payload] = false;
        // Remove user from the list
        state.list = state.list.filter(user => user.id !== action.payload);
      })
      .addCase(deleteUser.rejected, (state, action) => {
        state.deleteLoading[action.meta.arg] = false;
        state.error = action.error.message;
      })
      // Handle addUser
      .addCase(addUser.pending, (state) => {
        state.addLoading = true;
      })
      .addCase(addUser.fulfilled, (state, action) => {
        state.addLoading = false;
        state.list.push(action.payload);
      })
      .addCase(addUser.rejected, (state, action) => {
        state.addLoading = false;
        state.error = action.error.message;
      });
  },
});

// Configure store
const store = configureStore({
  reducer: {
    users: usersSlice.reducer,
  },
});

// Spinner Component
const Spinner = () => {
  return (
    <div className="spinner-container">
      <div className="spinner"></div>
    </div>
  );
};

// UserList Component
const UserList = () => {
  const dispatch = useDispatch();
  const { list, loading, error, deleteLoading } = useSelector((state) => state.users);

  useEffect(() => {
    dispatch(fetchUsers());
  }, [dispatch]);

  const handleDelete = (userId) => {
    dispatch(deleteUser(userId));
  };

  if (loading) {
    return <Spinner />;
  }

  if (error) {
    return <div className="error-message">Error: {error}</div>;
  }

  return (
    <div className="user-list">
      <h2>Users</h2>
      {list.length === 0 ? (
        <div className="no-users">No users found. Add a new user above!</div>
      ) : (
        <ul>
          {list.map((user) => (
            <li key={user.id}>
              <div className="user-info">
                <h3>{user.name}</h3>
                <p>Email: {user.email}</p>
                <p>Username: {user.username}</p>
              </div>
              <button 
                className="delete-btn"
                onClick={() => handleDelete(user.id)}
                disabled={deleteLoading[user.id]}
              >
                {deleteLoading[user.id] ? (
                  <span className="btn-spinner"></span>
                ) : (
                  'Delete User'
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

// AddUser Component
const AddUserForm = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    username: '',
  });
  const [formErrors, setFormErrors] = useState({});
  const dispatch = useDispatch();
  const { addLoading } = useSelector((state) => state.users);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    
    // Clear error when user starts typing
    if (formErrors[name]) {
      setFormErrors({ ...formErrors, [name]: '' });
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.name.trim()) errors.name = 'Name is required';
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Email is invalid';
    }
    if (!formData.username.trim()) errors.username = 'Username is required';
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      dispatch(addUser(formData));
      // Clear form after successful submission
      setFormData({ name: '', email: '', username: '' });
    }
  };

  return (
    <div className="add-user-form">
      <h2>Add New User</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="name">Name</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className={formErrors.name ? 'error' : ''}
          />
          {formErrors.name && <span className="error-text">{formErrors.name}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className={formErrors.email ? 'error' : ''}
          />
          {formErrors.email && <span className="error-text">{formErrors.email}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="username">Username</label>
          <input
            type="text"
            id="username"
            name="username"
            value={formData.username}
            onChange={handleChange}
            className={formErrors.username ? 'error' : ''}
          />
          {formErrors.username && <span className="error-text">{formErrors.username}</span>}
        </div>

        <button type="submit" className="add-btn" disabled={addLoading}>
          {addLoading ? <span className="btn-spinner"></span> : 'Add User'}
        </button>
      </form>
    </div>
  );
};

// Main App Component
function App() {
  return (
    <Provider store={store}>
      <div className="app">
        <header>
          <h1>User Management</h1>
        </header>
        <main>
          <AddUserForm />
          <UserList />
        </main>
      </div>
    </Provider>
  );
}

export default App;