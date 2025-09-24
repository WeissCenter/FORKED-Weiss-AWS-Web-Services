import { Schema } from "../schemas/Schema";
import { Validator } from "./Validator";

export interface TypeFieldValidator extends Validator {
  schema: Schema[];
}
