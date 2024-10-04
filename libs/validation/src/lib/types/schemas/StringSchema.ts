import { Schema } from "./Schema";

export interface StringSchema extends Schema{
    value?: string | string[],
    regex?: string,
    maxLength?: number,
    array?: boolean
}