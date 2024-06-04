import React, { useRef, useState,useEffect } from 'react';
import './App.css';

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, query, orderBy, limit, addDoc, serverTimestamp, getDocs, setDoc, doc } from 'firebase/firestore';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { getAnalytics } from 'firebase/analytics';
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';

import { useAuthState } from 'react-firebase-hooks/auth';
import { useCollectionData } from 'react-firebase-hooks/firestore';
import 'firebase/compat/firestore';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyANXTxQdsfjBjOrxFkFFoC9EEEuGfD5qFs",
  authDomain: "chatty4624.firebaseapp.com",
  projectId: "chatty4624",
  storageBucket: "chatty4624.appspot.com",
  messagingSenderId: "277094486878",
  appId: "1:277094486878:web:92e96a6f43db3d1e0075cf",
  measurementId: "G-BT2X9EW4ME"
};
// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const firestore = getFirestore(app);
const analytics = getAnalytics(app);

function App() {
  const [user, loading, error] = useAuthState(auth);
  const [chatRoom, setChatRoom] = useState(null);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  return (
    <div className="App">
      <header>
        <h1>Chatty Says HI!</h1>
        <SignOut />
      </header>
      <section>
        {user ? (
          chatRoom ? (
            <ChatRoom chatRoom={chatRoom} setChatRoom={setChatRoom} />
          ) : (
            <ChatRoomSelector setChatRoom={setChatRoom} />
          )
        ) : (
          <SignIn />
        )}
      </section>
    </div>
  );
}

function SignIn() {
  const signInWithGoogle = () => {
    const provider = new GoogleAuthProvider();
    signInWithPopup(auth, provider).catch(error => alert(error.message));
  }

  return (
    <>
      <button className="sign-in" onClick={signInWithGoogle}>Sign in with Google</button>
      <p>Chatty Says Hi! Come join us become friends..</p>
    </>
  );
}

function SignOut() {
  return auth.currentUser && (
    <button className="sign-out" onClick={() => signOut(auth)}>Sign Out</button>
  );
}

function ChatRoomSelector({ setChatRoom }) {
  const [roomName, setRoomName] = useState('');
  const [rooms, setRooms] = useState([]);useEffect(() => {
    fetchChatRooms();
  }, []);

  const fetchChatRooms = async () => {
    const chatRoomsCollection = collection(firestore, 'chatRooms');
    const chatRoomsSnapshot = await getDocs(chatRoomsCollection);
    const chatRoomsList = chatRoomsSnapshot.docs.map(doc => doc.id);
    setRooms(chatRoomsList);
  };

  const handleCreateRoom = async () => {
    if (roomName.trim()) {
      try {
        const chatRoomDoc = doc(firestore, 'chatRooms', roomName);
        await setDoc(chatRoomDoc, {});
        setChatRoom(roomName); // Assuming roomName is the chat room ID or name
      } catch (error) {
        console.error("Error creating room: ", error);
        alert(error.message);
      }
    } else {
      alert('Room name cannot be empty');
    }
  };

  return (
    <div>
      <h2>Select or Create a Chat Room</h2>
      <input
        value={roomName}
        onChange={(e) => setRoomName(e.target.value)}
        placeholder="Enter chat room name"
      />
      <button onClick={handleCreateRoom}>Create Room</button>
      <h3>Available Rooms</h3>
      <ul>
        {rooms.map(room => (
          <li key={room} onClick={() => setChatRoom(room)}>{room}</li>
        ))}
      </ul>
    </div>
  );
}

function ChatRoom({ chatRoom, setChatRoom }) {
  const [formValue, setFormValue] = useState('');
  const dummy = useRef();
  const messagesRef = collection(firestore, 'chatRooms', chatRoom, 'messages');
  const messagesQuery = query(messagesRef, orderBy('createdAt'), limit(25));
  const [messages, loading, error] = useCollectionData(messagesQuery, { idField: 'id' });

  const sendMessage = async (e) => {
    e.preventDefault();

    if (formValue.trim()) {
      try {
        await addDoc(messagesRef, {
          text: formValue,
          createdAt: serverTimestamp(),
          uid: auth.currentUser.uid,
          photoURL: auth.currentUser.photoURL,
        });
        setFormValue('');
        dummy.current.scrollIntoView({ behavior: 'smooth' });
      } catch (error) {
        alert(error.message);
        console.error('Error adding document:', error);
      }
    }
  };

  if (loading) {
    return <div>Loading messages...</div>;
  }

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  return (
    <>
      <button onClick={() => setChatRoom(null)}>Back to Room Selection</button>
      <main>
        {messages && messages.map(msg => <ChatMessage key={msg.id} message={msg} />)}
        <span ref={dummy}></span>
      </main>
      <form onSubmit={sendMessage}>
        <input
          value={formValue}
          onChange={(e) => setFormValue(e.target.value)}
          placeholder="say something nice"
        />
        <button type="submit" disabled={!formValue}>🕊️</button>
      </form>
    </>
  );
}
function ChatMessage(props) {
  const { text, uid, photoURL, createdAt } = props.message;

  const messageClass = uid === auth.currentUser.uid ? 'sent' : 'received';
  const formattedTime = createdAt ? new Date(createdAt.seconds * 1000).toLocaleString() : '';

  return (
    <div className={`message ${messageClass}`}>
      <img
        src={photoURL || 'https://api.adorable.io/avatars/23/abott@adorable.png'}
      alt="Avatar"
    />
    <p>{text}</p>

    <div className="timestamp">{formattedTime}</div>
  </div>
);
}
export default App;