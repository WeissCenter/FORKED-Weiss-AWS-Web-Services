import { Schema } from "./Schema";

export interface NumberSchema extends Schema {
  max?: number;
  min?: number;
}
