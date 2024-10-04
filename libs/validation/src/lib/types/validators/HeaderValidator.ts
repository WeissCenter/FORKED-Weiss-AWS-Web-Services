import { Schema } from "../schemas/Schema";
import { Validator } from "./Validator";




export interface HeaderValidator extends Validator{
    schema: Schema[]
}