import { Link } from 'react-router-dom';

const Page = () => {
    return <>
        <h1>home page</h1>
        <h2>available pages:</h2>
        <Link to='/sign-up'>/sign-up</Link>
        <br/>
        <Link to="/log-in">/log-in</Link>
        <br/>
        <Link to="/communication">/communication</Link>
        <br/>
        <Link to="/edit">/edit</Link>
    </>;
}

export default Page;