import classes from './UsersList.module.css';

import UserCard from './UserCard/UserCard';

const UsersList = (props) => {
    let cardsList = [];
    if(Array.isArray(props.users)) {
        cardsList = props.users.map((user, index) => (
                <UserCard key={'product_'+user.id}
                    information={user}
                    onRemoveClick={() => {props.onRemoveClick(index)}}
                    onEdit={info => {props.onEdit(index, info)}}
                />
        ));
    }
    
    let content = <p style={{color: 'red'}}>there are no results</p>;
    if(cardsList.length > 0) {
        content = cardsList;
    }
    
    return (
        <div className={classes.users}>
            {content}
        </div>
    );
}

export default UsersList;