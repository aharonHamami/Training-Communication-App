import classes from './home.module.css';

import networkImage from './images/network transparent.png';
import { logOut } from '../../store/slices/authSlice';

import { useSelector, useDispatch } from 'react-redux';
import { Link } from 'react-router-dom';

const Page = () => {
    const authState = useSelector(state => state.auth);
    const dispatch = useDispatch();
    
    const handleLogOut = (event) => {
        dispatch(logOut());
    }
    
    return <div className={classes.home}>
        <div className={classes.mainWindow}>
            <div className={classes.leftWindow}>
                <h1>{authState.name ? `Welcome, ${authState.name}` : "Home Page"}</h1>
                <h2>choose what you want to do:</h2>
                <div className={classes.contentBox}>
                    <Link to='/sign-up'><button>sign up</button></Link>
                    <Link to="/log-in"><button>log in</button></Link>
                    {
                        authState.token ?
                        <>
                            <Link to="/communication"><button>start communication</button></Link>
                        </>
                        : null
                    }
                    {
                        authState.admin ?
                        <>
                            <Link to="/edit"><button>edit recordings</button></Link>
                            <Link to="/users-management"><button>manage users</button></Link>
                        </>
                        : null
                    }
                </div>
                {
                    authState.token ?
                    <p style={{color: 'red', cursor: 'pointer'}} onClick={handleLogOut}>log out</p>
                    : null
                }
            </div>
            <div className={classes.rightWindow}>
                <img src={networkImage} alt="network"></img>
            </div>
        </div>
    </div>;
}

export default Page;