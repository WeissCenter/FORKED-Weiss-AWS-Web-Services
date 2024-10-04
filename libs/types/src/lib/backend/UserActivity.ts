import { UserTimeOutCache } from "./UserTimeOutCache";

export interface UserActivity{
    username: string,
    cache?: UserTimeOutCache
}