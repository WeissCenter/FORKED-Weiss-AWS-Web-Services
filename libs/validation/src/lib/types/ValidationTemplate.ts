import { ValidationRule } from "./ValidationRule";

export interface ValidationTemplate {
  name: string;
  rules: ValidationRule[];
}
