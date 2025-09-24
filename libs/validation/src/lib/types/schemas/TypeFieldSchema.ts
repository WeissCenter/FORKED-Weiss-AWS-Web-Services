import { ValidationElement } from "../ValidationElement";
import { HeaderSelect } from "../validators/RowCountValidator";
import { Schema } from "./Schema";

export interface TypeFieldSchema extends Schema {
  field: string;
  value?: string | string[] | HeaderSelect;
  regex?: string;
  maxLength?: number;
  array?: boolean;
}
