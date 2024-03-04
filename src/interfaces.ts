export interface GraphqlContext {
    user?:JWTuser
}
export interface JWTuser{
    id:string,
    email:string
}