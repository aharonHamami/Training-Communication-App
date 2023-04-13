import classes from './home.module.css';
import networkImage from './images/network transparent.png';

import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';

const Page = () => {
    const authState = useSelector(state => state.auth);
    
    return <div className={classes.home}>
        <div className={classes.mainWindow}>
            <div>
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
            </div>
            <div className={classes.leftWindow}>
                <img src={networkImage} alt="network"></img>
            </div>
        </div>
    </div>;
}

export default Page;