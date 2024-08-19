import React from 'react';


const FireToggle = ({ id, checked, onChange, color }) => {
    const backgroundColor = checked ? color : "white";
    const borderColor = checked ? color : "#adb5bd";

    return (
        <div className="form-check form-switch">
            <input
                className="form-check-input"
                type="checkbox"
                role="switch"
                id={id}
                checked={checked}
                onChange={onChange}
                style={{
                    backgroundColor: backgroundColor,
                    borderColor: borderColor,
                }}
            />
        </div>
    );
};

export default FireToggle;
