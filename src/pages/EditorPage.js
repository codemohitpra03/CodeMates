import React, { useState, useRef, useEffect } from 'react';
import toast from 'react-hot-toast';
import ACTIONS from '../Actions';
import Client from '../components/Client';
import Editor from '../components/Editor';
import { initSocket } from '../socket';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import MenuIcon from '@mui/icons-material/Menu';
import Snackbar from '@mui/material/Snackbar';
import MuiAlert from '@mui/material/Alert';
import Drawer from '@mui/material/Drawer';
import Box from '@mui/material/Box';
import Avatar from '@mui/material/Avatar';
import List from '@mui/material/List';
import Divider from '@mui/material/Divider';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import LogoutIcon from '@mui/icons-material/Logout';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import CloudQueueIcon from '@mui/icons-material/CloudQueue';
import logo from '../logo/icon-removebg-preview.png' 

import {
    useLocation,
    useNavigate,
    Navigate,
    useParams,
} from 'react-router-dom';

const EditorPage = () => {
    const socketRef = useRef(null);
    const codeRef = useRef(null);
    const location = useLocation();
    const { roomId } = useParams();
    const reactNavigator = useNavigate();
    const [clients, setClients] = useState([]);
    const [openSucces, setOpenSuccess] = React.useState(false); //snackbar
    const [openWarning, setOpenWarning] = React.useState(false); //snackbar error
    const [openJoin, setOpenJoin] = React.useState({open:false, name:""}); //new join
    const [openLeave, setOpenLeave] = React.useState({open:false, name:""}); //left
    const [openDrawer, setOpenDrawer] = React.useState(false);

    const toggleDrawer = (open) => (event) => {
        if (event.type === 'keydown' && (event.key === 'Tab' || event.key === 'Shift')) {
            return;
        }

        setOpenDrawer(open);
    };

    function stringToColor(string) {
        let hash = 0;
        let i;
      
        /* eslint-disable no-bitwise */
        for (i = 0; i < string.length; i += 1) {
          hash = string.charCodeAt(i) + ((hash << 5) - hash);
        }
      
        let color = '#';
      
        for (i = 0; i < 3; i += 1) {
          const value = (hash >> (i * 8)) & 0xff;
          color += `00${value.toString(16)}`.slice(-2);
        }
        /* eslint-enable no-bitwise */
      
        return color;
      }
      
      function stringAvatar(name) {
        return {
          sx: {
            bgcolor: stringToColor(name),
          },
          children:  name.split(' ').length===1 ? `${name.split('')[0]}` :`${name.split(' ')[0][0]}${name.split(' ')[1][0]}`,
        };
      }
    const handleClick = async () => {
        try {
            await navigator.clipboard.writeText(roomId);
            setOpenSuccess(true);
        } catch (err) {
            
            console.error(err);
            setOpenWarning(true);
            
        }
    };

    const handleClose = (event, reason) => {
        if (reason === 'clickaway') {
            return;
        }

        setOpenWarning(false);
        setOpenSuccess(false);
        setOpenJoin({open:false,name:""});
        setOpenLeave({open:false,name:""});
    };
    
    const newJoin = (userName) =>{
        setOpenJoin({open:true,name:userName})
    }
    const leave = (userName) =>{
        setOpenLeave({open:true,name:userName})
    }

    const Alert = React.forwardRef(function Alert(props, ref) {
        return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
    });


   
    useEffect(() => {
        const init = async () => {
            socketRef.current = await initSocket();
            socketRef.current.on('connect_error', (err) => handleErrors(err));
            socketRef.current.on('connect_failed', (err) => handleErrors(err));

            function handleErrors(e) {
                console.log('socket error', e);
                toast.error('Socket connection failed, try again later.');
                reactNavigator('/');
            }

            socketRef.current.emit(ACTIONS.JOIN, {
                roomId,
                username: location.state?.username,
            });

            // Listening for joined event
            socketRef.current.on(
                ACTIONS.JOINED,
                ({ clients, username, socketId }) => {
                    if (username !== location.state?.username) {
                        // toast.success(`${username} joined the room.`);
                        newJoin(username);
                        console.log(`${username} joined`);
                    }
                    setClients(clients);
                    socketRef.current.emit(ACTIONS.SYNC_CODE, {
                        code: codeRef.current,
                        socketId,
                    });
                }
            );

            // Listening for disconnected
            socketRef.current.on(
                ACTIONS.DISCONNECTED,
                ({ socketId, username }) => {
                    // toast.success(`${username} left the room.`);
                    leave(username);
                    setClients((prev) => {
                        return prev.filter(
                            (client) => client.socketId !== socketId
                        );
                    });
                }
            );
        };
        init();
        return () => {
            socketRef.current.disconnect();
            socketRef.current.off(ACTIONS.JOINED);
            socketRef.current.off(ACTIONS.DISCONNECTED);
        };
    }, []);

    async function copyRoomId() {
        try {
            await navigator.clipboard.writeText(roomId);
            toast.success('Room ID has been copied to your clipboard');
        } catch (err) {
            toast.error('Could not copy the Room ID');
            console.error(err);
        }
    }

    

    function leaveRoom() {
        reactNavigator('/');
    }

    if (!location.state) {
        return <Navigate to="/" />;
    }

    return (
            
        <>
            <AppBar position="static" id='navbar'>
                <Toolbar>
                <img width={120} src={logo} alt="Logo" />
                <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                    CodeMates &lt;/&gt; 
                </Typography>

                <IconButton
                    size="large"
                    edge="start"
                    color="inherit"
                    aria-label="menu"
                    sx={{ mr: 2 }}
                    onClick={toggleDrawer( true)}
                >
                    <MenuIcon />
                </IconButton>
                </Toolbar>
            </AppBar>
            
            
            <div className="mainWrap">
                <div className="aside">
                    <div className="asideInner">
                        {/* <div className="logo">
                            <img
                                className="logoImage"
                                src="/code-sync.png"
                                alt="logo"
                            />
                        </div> */}
                        <div class="h-50">
                <label>Input</label>
                <textarea type="text" style={{margin:"5% 0 5% 0"}} rows={"10"} id="input" class="form-control h-75" aria-label="Last name"></textarea>
            
            </div>
            <div class="h-50">
                <label className='output'>Output</label>
                <textarea type="text" style={{margin:"5% 0 10% 0"}} rows={"10"} id="output" class="form-control h-75" aria-label="Last name"></textarea>
            </div>
            <Button sx={{backgroundColor:"red"}} id='Run' variant='conatined' endIcon={<PlayArrowIcon/>}>Run</Button>
            
                        <div className="clientsList">
                            <Snackbar anchorOrigin={{ vertical:'bottom', horizontal:'right' }} open={openSucces} autoHideDuration={1200} onClose={handleClose}>
                                <Alert onClose={handleClose} severity="success" sx={{ width: '100%' }}>
                                Room ID has been copied to your clipboard
                                </Alert>
                                
                            </Snackbar>
                            <Snackbar anchorOrigin={{ vertical:'bottom', horizontal:'right' }} open={openWarning} autoHideDuration={1200} onClose={handleClose}>
                                <Alert onClose={handleClose} severity="warning" sx={{ width: '100%' }}>
                                Cannot Copy Room ID
                                </Alert>
                            </Snackbar>
                            <Snackbar anchorOrigin={{ vertical:'top', horizontal:'center' }} open={openJoin.open} autoHideDuration={3000} onClose={handleClose}>
                                <Alert onClose={handleClose} severity="success" sx={{ width: '100%' }}>
                                {openJoin.name} joined
                                </Alert>
                            </Snackbar>
                            <Snackbar anchorOrigin={{ vertical:'top', horizontal:'center' }} open={openLeave.open} autoHideDuration={3000} onClose={handleClose}>
                                <Alert onClose={handleClose} severity="warning" sx={{ width: '100%' }}>
                                {openLeave.name} left the room
                                </Alert>
                            </Snackbar>
                            {/* {clients.map((client) => (
                                <Client
                                    key={client.socketId}
                                    username={client.socketId===socketRef.current.id?"me":client.username}
                                />
                            ))} */}
                            <Drawer
                                anchor={"right"}
                                open={openDrawer}
                                onClose={toggleDrawer(false)}
                                
                            >
                                <Box
                                    sx={{ width:  250,  }}
                                    role="presentation"
                                    onClick={toggleDrawer( false)}
                                    onKeyDown={toggleDrawer(false)}
                                    
                                >   
                                    <center>

                                    <Typography variant="h6" component="h2" sx={{
                                        margin:"5% 0% 0% 0%"
                                    }}>
                                        Connected
                    
                                    </Typography>
                                        
                                    </center>
                                    <List>
                                        {
                                       
                                        clients.map((client) => {
                                     return (<ListItem key={client.socketId} sx={{margin:"5%"}} disablePadding>
                                          
                                          <ListItemIcon >
                                              <Avatar {...stringAvatar(client.username)} />
                                          </ListItemIcon>
                                          <ListItemText primary={client.username + (client.socketId===socketRef.current.id?" (You)":"")} />
                                          
                                        </ListItem>
                                        )
                                      
                                    })}
                                    </List>
                                </Box>
                                {/* <button className="btn copyBtn" onClick={handleClick}>
                                    Copy ROOM ID
                                </button>
                                <button className="btn leaveBtn" onClick={leaveRoom}>
                                    Leave
                                </button> */}
                                <Button variant="contained" onClick={handleClick} sx={{width:"50%", margin:"5%"}} endIcon={< ContentCopyIcon/>}>
                                ROOM ID
                                </Button>
                                <Button variant="contained" onClick={leaveRoom} sx={{width:"50%", margin:"5%"}} endIcon={< LogoutIcon/>}>
                                    Leave
                                </Button>
                            </Drawer>

                        </div>
                    </div>
                    
                </div>
                <div className="editorWrap">
                    <Editor
                        socketRef={socketRef}
                        roomId={roomId}
                        onCodeChange={(code) => {
                            codeRef.current = code;
                        }}
                    />
                </div>
            </div>
        </>
    );
};

export default EditorPage;
