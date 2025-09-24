import { Validator } from "./Validator";

export type HeaderSelect = { headerIndex: number; field?: string };

export interface RowCountValidator extends Validator {
  errorText?: string;
  value: number | HeaderSelect;
}
