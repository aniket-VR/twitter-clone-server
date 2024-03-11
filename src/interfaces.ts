export interface GraphqlContext {
  user?: JWTuser;
}
export interface JWTuser {
  id: string;
  email: string;
}
export interface User {
  email: string;
  firstName: string;
  id: string;
  lastName?: string | null;
  profileImageUrl?: string | null;
}
