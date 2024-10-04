import { ValidationRule } from "./ValidationRule";

export interface FileValidation{
    name: string;
    rules: ValidationRule[]
}