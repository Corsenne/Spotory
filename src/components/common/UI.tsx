import type { ReactNode } from 'react';
export function Header({title,action}:{title:string;action?:ReactNode}){return <header className="header"><h1>{title}</h1>{action}</header>}
export function Empty({title,children}:{title:string;children?:ReactNode}){return <div className="empty"><span aria-hidden>◌</span><h2>{title}</h2>{children}</div>}
export function ErrorMessage({message}:{message:string}){return <div role="alert" className="error">{message}</div>}
export function Stars({value}:{value:number|null}){return <span className="stars" aria-label={value?`評価${value}`:'未評価'}>{value?'★'.repeat(value)+'☆'.repeat(5-value):'未評価'}</span>}
