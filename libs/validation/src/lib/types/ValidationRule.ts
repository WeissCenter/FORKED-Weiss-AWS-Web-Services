import { Validator } from "./validators/Validator";

export interface ValidationRule {
  name: string;
  validator: Validator;
}
