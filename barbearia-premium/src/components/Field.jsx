import React from 'react';
export default function Field({label,...props}){return <label className="field">{label}<input {...props}/></label>;}
